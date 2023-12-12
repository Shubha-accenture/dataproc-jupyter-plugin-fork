# Copyright 2023 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
# https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import json
from jupyter_server.base.handlers import APIHandler
from jupyter_server.utils import url_path_join
import tornado
import subprocess
from cachetools import TTLCache
import datetime
from google.cloud.storage.blob import Blob
from google.cloud.storage.bucket import Bucket
import os
from google.cloud.jupyter_config.config import gcp_kernel_gateway_url, get_gcloud_config


def update_gateway_client_url(c, log):
    try:
        kernel_gateway_url = gcp_kernel_gateway_url()
    except subprocess.SubprocessError as e:
        log.warning(f"Error constructing the kernel gateway URL; configure your project, region, and credentials using gcloud: {e}")
        return
    log.info(f"Updating remote kernel gateway URL to {kernel_gateway_url}")
    c.GatewayClient.url = kernel_gateway_url


credentials_cache = None

def get_cached_credentials(log):
    global credentials_cache

    try:
        cmd = "gcloud config config-helper --format=json"
        process = subprocess.Popen(cmd, shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        output, error = process.communicate()
        if process.returncode == 0:
            config_data = json.loads(output)
            credentials = {
                    'project_id': config_data['configuration']['properties']['core']['project'],
                    'region_id': config_data['configuration']['properties']['compute']['region'],
                    'access_token': config_data['credential']['access_token']
                }

            token_expiry = config_data['credential']['token_expiry']
            utc_datetime = datetime.datetime.strptime(token_expiry, '%Y-%m-%dT%H:%M:%SZ')
            current_utc_datetime = datetime.datetime.utcnow()
            expiry_timedelta = utc_datetime - current_utc_datetime
            expiry_seconds = expiry_timedelta.total_seconds()
            if expiry_seconds > 1000:
                ttl_seconds = 1000
            else:
                ttl_seconds = expiry_seconds
            credentials_cache = TTLCache(maxsize=1, ttl=ttl_seconds)
            credentials_cache['credentials'] = credentials
            return credentials
        else:
            cmd = "gcloud config get-value account"
            process = subprocess.Popen(cmd, shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
            output, error = process.communicate()
            if output == '':
                cmd = "gcloud config get-value project"
                process = subprocess.Popen(cmd, shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
                project, error = process.communicate()
                if project == '':
                        credentials = {
                    'project_id': '',
                    'region_id': '',
                    'access_token': '',
                    'config_error': 1,
                    'login_error': 0
                    }
                else:
                    cmd = "gcloud config get-value compute/region"
                    process = subprocess.Popen(cmd, shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
                    region, error = process.communicate()
                    if region == '':
                        credentials = {
                            'project_id': '',
                            'region_id': '',
                            'access_token': '',
                            'config_error': 1,
                            'login_error': 0
                        }
                    else:
                        credentials = {
                            'project_id': '',
                            'region_id': '',
                            'access_token': '',
                            'config_error': 0,
                            'login_error': 1
                            }
            else:
                credentials = {
                    'project_id': '',
                    'region_id': '',
                    'access_token': '',
                    'config_error': 1,
                    'login_error': 0
                    }
            credentials_cache = TTLCache(maxsize=1, ttl=5)
            credentials_cache['credentials'] = credentials
            return credentials
    except Exception:
        log.exception(f"Error fetching credentials from gcloud")
        credentials = {
            'access_token': '',
            'config_error': 1
        }
        credentials_cache = TTLCache(maxsize=1, ttl=2)
        credentials_cache['credentials'] = credentials
        return credentials


class RouteHandler(APIHandler):
    # The following decorator should be present on all verb methods (head, get, post,
    # patch, put, delete, options) to ensure only authorized user can request the
    # Jupyter server
    credentials_cache = None
    @tornado.web.authenticated
    def get(self):
        cmd = 'pwd'
        process = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, shell=True)
        output, _ = process.communicate()
        print('-----PATH----')
        print(output)
        try:
            if credentials_cache is None or 'credentials' not in credentials_cache:
                cached_credentials = get_cached_credentials(self.log)
                self.finish(json.dumps(cached_credentials))
            else:
                self.finish(json.dumps(credentials_cache['credentials']))
        except Exception:
            self.log.exception(f"Error handling credential request")
            cached_credentials = get_cached_credentials(self.log)
            self.finish(json.dumps(cached_credentials))


class LoginHandler(APIHandler):
    @tornado.web.authenticated
    def get(self):
        cmd = "gcloud auth login"
        process = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, shell=True)
        output, _ = process.communicate()
        # Check if the authentication was successful
        if process.returncode == 0:
            self.finish({'login' : 'SUCCEEDED'})
        else:
            self.finish({'login' : 'FAILED'})


class ConfigHandler(APIHandler):
    @tornado.web.authenticated
    def post(self):
        ERROR_MESSAGE = "Project and region update "
        global credentials_cache
        input_data = self.get_json_body()
        project_id = input_data["projectId"]
        region = input_data["region"]
        cmd = 'gcloud config set project '+project_id
        project_set = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, shell=True)
        output, _ = project_set.communicate()
        if project_set.returncode == 0:
            cmd = 'gcloud config set compute/region '+region
            region_set = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, shell=True)
            output, _ = region_set.communicate()
            if region_set.returncode == 0:
                credentials_cache = None
                update_gateway_client_url(self.config, self.log)
                self.finish({'config' : ERROR_MESSAGE + 'successful'})
            else:
                self.finish({'config' : ERROR_MESSAGE + 'failed'})
        else:
            self.finish({'config' : ERROR_MESSAGE + 'failed'})

class GcsHandler(APIHandler):
    @tornado.web.authenticated
    def get(self):
        cmd = 'gsutil cp gs://us-central1-composer4-fe041c11-bucket/dataproc-notebooks/wrapper_papermill.py .'
        gcs = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, shell=True)
        output, _ = gcs.communicate()
        if gcs.returncode == 0:
            # Specify the path to the downloaded file
            file_path = './'
            file_name =  'wrapper_papermill.py'
            self.set_header('Content-Type', 'application/octet-stream')
            self.set_header('Content-Disposition', f'attachment; filename={file_name}')
 
            with open(file_path+file_name, 'rb') as file:
                self.write(file.read())
            # downloaded_file_path = './'
            # bucket_name = 'us-central1-composer4-fe041c11-bucket'
            
            # bucket = Bucket(bucket_name)
            # # Specify the destination blob path in your Google Cloud Storage bucket
            # gcs_blob_path = './'

            # # Create a Blob without a Client
            # blob = Blob(gcs_blob_path, bucket=bucket)
            # Upload the file to the blob
            # with open(downloaded_file_path, 'rb') as file:
            #     blob.upload_from_file(file)

            # # Optionally, you can delete the local file after uploading
            # os.remove(downloaded_file_path)
            # print(blob)
            # # Respond with a success message or handle further processing
            # self.write("File uploaded to GCS successfully.")
        else:
            # Handle the case where the gsutil cp command failed
            error_message = f"Failed to download file. Error: {_}"
            self.set_status(500)
            self.write(error_message)


 


class UrlHandler(APIHandler):
    @tornado.web.authenticated
    def get(self):
        url = {}
        dataproc_url = self.gcp_service_url('dataproc')
        compute_url = self.gcp_service_url('compute', default_url='https://compute.googleapis.com/compute/v1')
        metastore_url = self.gcp_service_url('metastore')
        cloudkms_url = self.gcp_service_url('cloudkms')
        cloudresourcemanager_url = self.gcp_service_url('cloudresourcemanager')
        datacatalog_url = self.gcp_service_url('datacatalog')
        storage_url = self.gcp_service_url('storage', default_url='https://storage.googleapis.com/storage/v1/')
        url = {
            'dataproc_url': dataproc_url,
            'compute_url': compute_url,
            'metastore_url': metastore_url,
            'cloudkms_url': cloudkms_url,
            'cloudresourcemanager_url': cloudresourcemanager_url,
            'datacatalog_url': datacatalog_url,
            'storage_url': storage_url
            }
        self.finish(url)

    def gcp_service_url(self, service_name, default_url=None):
        default_url = default_url or f'https://{service_name}.googleapis.com/'
        configured_url = get_gcloud_config(f'configuration.properties.api_endpoint_overrides.{service_name}')
        url = configured_url or default_url
        self.log.info('Service_url for service {service_name}: {url}')
        return url


class LogHandler(APIHandler):
    @tornado.web.authenticated
    def post(self):
        logger = self.log.getChild('DataprocPluginClient')
        log_body = self.get_json_body()
        logger.log(log_body["level"], log_body["message"])
        self.finish({'status': 'OK'})


def setup_handlers(web_app):
    host_pattern = ".*$"

    base_url = web_app.settings["base_url"]

    # Prepend the base_url so that it works in a JupyterHub setting
    route_pattern = url_path_join(base_url, "dataproc-plugin", "credentials")
    handlers = [(route_pattern, RouteHandler)]
    web_app.add_handlers(host_pattern, handlers)

    route_pattern = url_path_join(base_url, "dataproc-plugin", "login")
    handlers = [(route_pattern, LoginHandler)]
    web_app.add_handlers(host_pattern, handlers)

    route_pattern = url_path_join(base_url, "dataproc-plugin", "configuration")
    handlers = [(route_pattern, ConfigHandler)]
    web_app.add_handlers(host_pattern, handlers)

    route_pattern = url_path_join(base_url, "dataproc-plugin", "getGcpServiceUrls")
    handlers = [(route_pattern, UrlHandler)]
    web_app.add_handlers(host_pattern, handlers)

    route_pattern = url_path_join(base_url, "dataproc-plugin", "gcsDownload")
    handlers = [(route_pattern, GcsHandler)]
    web_app.add_handlers(host_pattern, handlers)

    route_pattern = url_path_join(base_url, "dataproc-plugin", "log")
    handlers = [(route_pattern, LogHandler)]
    web_app.add_handlers(host_pattern, handlers)
