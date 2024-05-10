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


import subprocess

import requests
import urllib
from dataproc_jupyter_plugin.commons.constants import CONTENT_TYPE, storage_url


class DownloadOutputService:
    def get_output_file(self, bucket_name, dag_id, dag_run_id,credentials,log):
        try:
            if ("access_token" in credentials) and ("project_id" in credentials):
                    access_token = credentials["access_token"]
                    project_id = credentials["project_id"]
            match_string = f'{dag_id}_{dag_run_id}'
            params = {
                'delimiter': '/',
                'includeFoldersAsPrefixes': 'true',
                'matchGlob': f'**/{{{{{match_string}}}}}**.ipynb',
                'prefix': f'dataproc-output/{dag_id}/output-notebooks/'
            }
            encoded_params = '&'.join([f"{k}={urllib.parse.quote(v, safe='*')}" for k, v in params.items()])
            api_endpoint = (
                f"{storage_url}b/{bucket_name}/o?{encoded_params}"
            )
            headers = {
                "Content-Type": CONTENT_TYPE,
                "Authorization": f"Bearer {access_token}",
                "X-Goog-User-Project": project_id,
            }
            response = requests.get(api_endpoint, headers=headers)
            if response.status_code == 200:
                resp = response.json()
                output_files = []
                for item in resp["items"]:
                    name = item["name"]
                    output_files.append(name)
                return output_files
            else:
                log.exception(f"Error getting output file response")
                raise ValueError("Error getting output file response")
        except Exception as e:
            log.exception(f"Error getting output file: {str(e)}")
            return {"error": str(e)}
    def download_dag_output(self, bucket_name, dag_id, dag_run_id, credentials, log):
        try:
            output_files = self.get_output_file(bucket_name, dag_id, dag_run_id,credentials,log)
            for file_name in output_files:
                try:
                    cmd = f"gsutil cp 'gs://{bucket_name}/{file_name}' ./"
                    process = subprocess.Popen(
                        cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, shell=True
                    )
                    output, _ = process.communicate()
                    if process.returncode == 0:
                        print(f"Downloaded file: {file_name}")
                    else:
                        log.exception(f"Error downloading output notebook file")
                        return 1
                except Exception as e:
                    log.exception(f"Error downloading file: {str(e)}")
                    return 1
            return 0
        except Exception as e:
            log.exception(f"Error downloading output notebook file: {str(e)}")
            return {"error": str(e)}
