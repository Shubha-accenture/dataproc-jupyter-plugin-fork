# Copyright 2024 Google LLC
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
import re
import subprocess
import urllib
import google.oauth2.credentials as oauth2
from google.cloud import compute_v1
from google.cloud import iam_admin_v1
import proto
from google.cloud.iam_admin_v1 import types
from google.cloud import kms
from google.cloud import kms_v1
from google.cloud import storage


from dataproc_jupyter_plugin import urls
from dataproc_jupyter_plugin.commons.commands import async_run_gsutil_subcommand
from dataproc_jupyter_plugin.commons.constants import (
    COMPOSER_SERVICE_NAME,
    CONTENT_TYPE,
    STORAGE_SERVICE_DEFAULT_URL,
    STORAGE_SERVICE_NAME,
    TAGS,
)


class Client:
    def __init__(self, credentials, log, client_session):
        self.log = log
        if not (
            ("access_token" in credentials)
            and ("project_id" in credentials)
            and ("region_id" in credentials)
        ):
            self.log.exception("Missing required credentials")
            raise ValueError("Missing required credentials")
        self._access_token = credentials["access_token"]
        self.project_id = credentials["project_id"]
        self.region_id = credentials["region_id"]
        self.client_session = client_session

    def create_headers(self):
        return {
            "Content-Type": CONTENT_TYPE,
            "Authorization": f"Bearer {self._access_token}",
        }

    async def get_airflow_uri(self, composer_name):
        try:
            composer_url = await urls.gcp_service_url(COMPOSER_SERVICE_NAME)
            api_endpoint = f"{composer_url}v1/projects/{self.project_id}/locations/{self.region_id}/environments/{composer_name}"
            async with self.client_session.get(
                api_endpoint, headers=self.create_headers()
            ) as response:
                if response.status == 200:
                    resp = await response.json()
                    airflow_uri = resp.get("config", {}).get("airflowUri", "")
                    bucket = resp.get("storageConfig", {}).get("bucket", "")
                    return airflow_uri, bucket
                else:
                    raise Exception(
                        f"Error getting airflow uri: {response.reason} {await response.text()}"
                    )
        except Exception as e:
            self.log.exception(f"Error getting airflow uri: {str(e)}")
            raise Exception(f"Error getting airflow uri: {str(e)}")

    async def list_jobs(self, composer_name):
        airflow_uri, bucket = await self.get_airflow_uri(composer_name)
        try:
            api_endpoint = f"{airflow_uri}/api/v1/dags?tags={TAGS}"
            async with self.client_session.get(
                api_endpoint, headers=self.create_headers()
            ) as response:
                if response.status == 200:
                    resp = await response.json()
                    return resp, bucket
                else:
                    raise Exception(
                        f"Error lsiting scheduled jobs: {response.reason} {await response.text()}"
                    )
        except Exception as e:
            self.log.exception(f"Error getting dag list: {str(e)}")
            return {"error": str(e)}

    async def delete_job(self, composer_name, dag_id, from_page):
        airflow_uri, bucket_name = await self.get_airflow_uri(composer_name)
        try:
            api_endpoint = f"{airflow_uri}/api/v1/dags/{dag_id}"
            # Delete the DAG via the Airflow API if from_page is None
            if from_page is None:
                async with self.client_session.delete(
                    api_endpoint, headers=self.create_headers()
                ) as response:
                    self.log.info(response)
            bucket = storage.Client().bucket(bucket_name)
            blob_name = f"dags/dag_{dag_id}.py"
            blob = bucket.blob(blob_name)
            blob.delete()

            self.log.info(f"Deleted {blob_name} from bucket {bucket_name}")

            return 0
        except Exception as e:
            self.log.exception(f"Error deleting DAG: {str(e)}")
            return {"error": str(e)}

    async def update_job(self, composer_name, dag_id, status):
        airflow_uri, bucket = await self.get_airflow_uri(composer_name)
        try:
            api_endpoint = f"{airflow_uri}/api/v1/dags/{dag_id}"

            data = {"is_paused": status.lower() != "true"}
            async with self.client_session.patch(
                api_endpoint, json=data, headers=self.create_headers()
            ) as response:
                if response.status == 200:
                    return 0
                else:
                    self.log.exception("Error updating status")
                    return {
                        "error": f"Error updating Airflow DAG status: {response.reason} {await response.text()}"
                    }
        except Exception as e:
            self.log.exception(f"Error updating status: {str(e)}")
            return {"error": str(e)}

    async def list_dag_runs(self, composer_name, dag_id, start_date, end_date, offset):
        airflow_uri, bucket = await self.get_airflow_uri(composer_name)
        try:
            api_endpoint = f"{airflow_uri}/api/v1/dags/{dag_id}/dagRuns?execution_date_gte={start_date}&execution_date_lte={end_date}&offset={offset}"
            async with self.client_session.get(
                api_endpoint, headers=self.create_headers()
            ) as response:
                if response.status == 200:
                    resp = await response.json()
                    return resp
                else:
                    raise Exception(
                        f"Error displaying BigQuery preview data: {response.reason} {await response.text()}"
                    )
        except Exception as e:
            self.log.exception(f"Error fetching dag run list: {str(e)}")
            return {"error": str(e)}

    async def list_dag_run_task(self, composer_name, dag_id, dag_run_id):
        airflow_uri, bucket = await self.get_airflow_uri(composer_name)
        try:
            api_endpoint = (
                f"{airflow_uri}/api/v1/dags/{dag_id}/dagRuns/{dag_run_id}/taskInstances"
            )
            async with self.client_session.get(
                api_endpoint, headers=self.create_headers()
            ) as response:
                if response.status == 200:
                    resp = await response.json()
                    return resp
                else:
                    raise Exception(
                        f"Error listing dag runs: {response.reason} {await response.text()}"
                    )
        except Exception as e:
            self.log.exception(f"Error fetching dag run task list: {str(e)}")
            return {"error": str(e)}

    async def list_dag_run_task_logs(
        self, composer_name, dag_id, dag_run_id, task_id, task_try_number
    ):
        airflow_uri, bucket = await self.get_airflow_uri(composer_name)
        try:
            api_endpoint = f"{airflow_uri}/api/v1/dags/{dag_id}/dagRuns/{dag_run_id}/taskInstances/{task_id}/logs/{task_try_number}"
            async with self.client_session.get(
                api_endpoint, headers=self.create_headers()
            ) as response:
                if response.status == 200:
                    resp = await response.text()
                    return {"content": resp}
                else:
                    raise Exception(
                        f"Error listing dag run task logs: {response.reason} {await response.text()}"
                    )
        except Exception as e:
            self.log.exception(f"Error fetching dag run task logs: {str(e)}")
            return {"error": str(e)}

    async def edit_jobs(self, dag_id, bucket_name):
        try:
            json_file_path = f"input-payload/{dag_id}_payload.json"
            storage_client = storage.Client()
            bucket = storage_client.bucket(bucket_name)
            blob = bucket.blob(json_file_path)
            json_data = blob.download_as_text()
            job_data = json.loads(json_data)
            print(job_data)
            return job_data
        except Exception as e:
            self.log.exception(f"Error editing dag file: {str(e)}")

    async def list_import_errors(self, composer):
        airflow_uri, bucket = await self.get_airflow_uri(composer)
        try:
            api_endpoint = (
                f"{airflow_uri}/api/v1/importErrors?order_by=-import_error_id"
            )
            async with self.client_session.get(
                api_endpoint, headers=self.create_headers()
            ) as response:
                if response.status == 200:
                    resp = await response.json()
                    return resp
                else:
                    raise Exception(
                        f"Error listing import errors: {response.reason} {await response.text()}"
                    )
        except Exception as e:
            self.log.exception(f"Error fetching import error list: {str(e)}")
            return {"error": str(e)}

    async def dag_trigger(self, dag_id, composer):
        airflow_uri, bucket = await self.get_airflow_uri(composer)
        try:
            api_endpoint = f"{airflow_uri}/api/v1/dags/{dag_id}/dagRuns"
            body = {"conf": {}}
            async with self.client_session.post(
                api_endpoint, headers=self.create_headers(), json=body
            ) as response:
                if response.status == 200:
                    resp = await response.json()
                    return resp
                else:
                    raise Exception(
                        f"Error triggering dag: {response.reason} {await response.text()}"
                    )
        except Exception as e:
            self.log.exception(f"Error triggering dag: {str(e)}")
            return {"error": str(e)}

    async def list_regions(self, project_id):
        try:
            credentials = oauth2.Credentials(self._access_token)
            client = compute_v1.RegionsClient(credentials=credentials)

            regions = client.list(project=project_id)
            region_names = [region.name for region in regions]
            return region_names
        except Exception as e:
            self.log.exception(f"Error listing regions: {str(e)}")
            return {"error": str(e)}

    async def list_service_accounts(self, project_id):
        try:
            credentials = oauth2.Credentials(self._access_token)
            iam_admin_client = iam_admin_v1.IAMAsyncClient(credentials=credentials)
            request = types.ListServiceAccountsRequest()
            request.name = f"projects/{project_id}"

            accounts = await iam_admin_client.list_service_accounts(request=request)
            account_list = []
            async for account in accounts:
                account_list.append(json.loads(proto.Message.to_json(account)))

            return account_list
        except Exception as e:
            self.log.exception(f"Error listing service accounts: {str(e)}")
            return {"error": str(e)}

    async def list_key_rings(
        self, region_id
    ) -> kms_v1.services.key_management_service.pagers.ListKeyRingsPager:
        try:
            credentials = oauth2.Credentials(self._access_token)
            client = kms.KeyManagementServiceAsyncClient(credentials=credentials)
            location_name = f"projects/{self.project_id}/locations/{region_id}"
            key_rings = await client.list_key_rings(request={"parent": location_name})
            key_ring_list = []
            async for key in key_rings:
                key_ring_list.append(key.name)
            return key_ring_list
        except Exception as e:
            self.log.exception(f"Error listing key rings: {str(e)}")
            return {"error": str(e)}

    async def list_keys(self, region_id, key_ring_id):
        try:
            credentials = oauth2.Credentials(self._access_token)
            client = kms.KeyManagementServiceAsyncClient(credentials=credentials)
            parent = client.key_ring_path(self.project_id, region_id, key_ring_id)
            keys = await client.list_crypto_keys(request={"parent": parent})
            keys_list = []
            async for key in keys:
                keys_list.append(key.name)
            return keys_list
        except Exception as e:
            self.log.exception(f"Error listing keys: {str(e)}")
            return {"error": str(e)}
