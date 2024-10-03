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

    async def get_dag_file(self, dag_id, bucket_name):
        try:
            file_path = f"dags/dag_{dag_id}.py"
            encoded_path = urllib.parse.quote(file_path, safe="")
            storage_url = await urls.gcp_service_url(
                STORAGE_SERVICE_NAME, default_url=STORAGE_SERVICE_DEFAULT_URL
            )
            api_endpoint = f"{storage_url}b/{bucket_name}/o/{encoded_path}?alt=media"
            async with self.client_session.get(
                api_endpoint, headers=self.create_headers()
            ) as response:
                if response.status == 200:
                    self.log.info("Dag file response fetched")
                    return await response.read()
                else:
                    raise Exception(
                        f"Error getting dag file: {response.reason} {await response.text()}"
                    )
        except Exception as e:
            self.log.exception(f"Error reading dag file: {str(e)}")
            return {"error": str(e)}

    async def edit_jobs(self, dag_id, bucket_name):
        try:
            payload = {
    "job_name": "editFlowTestAllNodes25sept",
    "composer_environment_name": "test-am",
    "email_failure": True,
    "email_delay": False,
    "email_success": False,
    "email_ids": [
        "test01"
    ],
    "nodes": [
        {
            "id": "1",
            "type": "composerNode",
            "position": {
                "x": -25.80264155433821,
                "y": -458.29461037666783
            },
            "data": {
                "nodeType": "Trigger",
                "retryCount": 0,
                "retryDelay": 0,
                "parameter": [],
                "stopCluster": "",
                "clusterName": "",
                "serverless": "",
                "scheduleValue": "",
                "timeZone": "",
                "datasetId": "",
                "tableId": "",
                "location": "",
                "writeDisposition": "",
                "serviceAccount": "",
                "keyRings": "",
                "kmsKey": "",
                "isSaveQuery": False,
                "isAutoRegion": True
            },
            "width": 232,
            "height": 98,
            "selected": False,
            "positionAbsolute": {
                "x": -25.80264155433821,
                "y": -458.29461037666783
            },
            "dragging": False
        },
        {
            "id": "2",
            "type": "composerNode",
            "position": {
                "x": -318.5709729764698,
                "y": -222.12298453016086
            },
            "data": {
                "nodeType": "Cluster",
                "inputFile": "gs:us-central1-composer3-e9f34418-bucket/dataproc-notebooks/auto-4-14-47job/input_notebooks/Untitled53.ipynb",
                "retryCount": 1,
                "retryDelay": 1,
                "parameter": [
                    "1:1"
                ],
                "stopCluster": True,
                "clusterName": "cluster-dpms-test",
                "serverless": "",
                "scheduleValue": "",
                "timeZone": "",
                "datasetId": "",
                "tableId": "",
                "location": "",
                "writeDisposition": "",
                "serviceAccount": "",
                "keyRings": "",
                "kmsKey": "",
                "isSaveQuery": False,
                "isAutoRegion": True
            },
            "origin": [
                0.5,
                0
            ],
            "width": 232,
            "height": 98,
            "selected": False,
            "dragging": False,
            "positionAbsolute": {
                "x": -318.5709729764698,
                "y": -222.12298453016086
            }
        },
    #     {
    #         "id": "3",
    #         "type": "composerNode",
    #         "position": {
    #             "x": -75.43069679136013,
    #             "y": -155.6315620632125
    #         },
    #         "data": {
    #             "nodeType": "Serverless",
    #             "inputFile": "test2.ipynb",
    #             "retryCount": 2,
    #             "retryDelay": 2,
    #             "parameter": [
    #                 "2:2"
    #             ],
    #             "stopCluster": "",
    #             "clusterName": "",
    #             "serverless": {
    #                 "name": "projects/dataproc-jupyter-extension-dev/locations/us-central1/sessionTemplates/runtime-00000323d751",
    #                 "createTime": "2024-07-26T08:19:02.867092Z",
    #                 "jupyterSession": {
    #                     "kernel": "PYTHON",
    #                     "displayName": "payload"
    #                 },
    #                 "creator": "aditeekatti@google.com",
    #                 "labels": {
    #                     "client": "dataproc-jupyter-plugin"
    #                 },
    #                 "runtimeConfig": {
    #                     "version": "2.2",
    #                     "properties": {
    #                         "spark.driver.cores": "4",
    #                         "spark.driver.memory": "12200m",
    #                         "spark.driver.memoryOverhead": "1220m",
    #                         "spark.dataproc.driver.disk.size": "400g",
    #                         "spark.dataproc.driver.disk.tier": "standard",
    #                         "spark.executor.cores": "12",
    #                         "spark.executor.memory": "12200m",
    #                         "spark.dataproc.executor.disk.tier": "premium",
    #                         "spark.dataproc.executor.disk.size": "750g",
    #                         "spark.executor.instances": "2",
    #                         "spark.dynamicAllocation.enabled": "true",
    #                         "spark.dynamicAllocation.initialExecutors": "2",
    #                         "spark.dynamicAllocation.minExecutors": "2",
    #                         "spark.dynamicAllocation.maxExecutors": "1000",
    #                         "spark.dynamicAllocation.executorAllocationRatio": "0.3",
    #                         "spark.reducer.fetchMigratedShuffle.enabled": "false",
    #                         "spark.dataproc.driverEnv.LANG": "C.UTF-8",
    #                         "spark.executorEnv.LANG": "C.UTF-8",
    #                         "spark.dataproc.executor.compute.tier": "premium",
    #                         "spark.dataproc.executor.resource.accelerator.type": "a100-40",
    #                         "spark.plugins": "com.nvidia.spark.SQLPlugin",
    #                         "spark.task.resource.gpu.amount": "0.25",
    #                         "spark.shuffle.manager": "com.nvidia.spark.rapids.RapidsShuffleManager",
    #                         "key": "value"
    #                     }
    #                 },
    #                 "environmentConfig": {
    #                     "executionConfig": {
    #                         "subnetworkUri": "default"
    #                     },
    #                     "peripheralsConfig": {}
    #                 },
    #                 "description": "payload",
    #                 "updateTime": "2024-07-26T08:19:02.867092Z",
    #                 "uuid": "f1453a7d-5179-48ce-8156-c01220bf17ea"
    #             },
    #             "scheduleValue": "",
    #             "timeZone": "",
    #             "datasetId": "",
    #             "tableId": "",
    #             "location": "",
    #             "writeDisposition": "",
    #             "serviceAccount": "411524708443-compute@developer.gserviceaccount.com",
    #             "keyRings": "",
    #             "kmsKey": "",
    #             "isSaveQuery": False,
    #             "isAutoRegion": True
    #         },
    #         "origin": [
    #             0.5,
    #             0
    #         ],
    #         "width": 232,
    #         "height": 98,
    #         "selected": False,
    #         "dragging": False,
    #         "positionAbsolute": {
    #             "x": -75.43069679136013,
    #             "y": -155.6315620632125
    #         }
    #     },
    #     {
    #         "id": "4",
    #         "type": "composerNode",
    #         "position": {
    #             "x": 184.58053733312448,
    #             "y": -174.4873385836904
    #         },
    #         "data": {
    #             "nodeType": "Bigquery-Serverless",
    #             "inputFile": "test3.ipynb",
    #             "retryCount": 3,
    #             "retryDelay": 3,
    #             "parameter": [
    #                 "3:3"
    #             ],
    #             "stopCluster": "",
    #             "clusterName": "",
    #             "serverless": {
    #                 "name": "projects/dataproc-jupyter-extension-dev/locations/us-central1/sessionTemplates/runtime-000011568b68",
    #                 "createTime": "2024-06-26T10:19:57.656700Z",
    #                 "jupyterSession": {
    #                     "kernel": "PYTHON",
    #                     "displayName": "26thJuneProFromLancherWOgpuTest"
    #                 },
    #                 "creator": "amatheen@google.com",
    #                 "labels": {
    #                     "client": "dataproc-jupyter-plugin"
    #                 },
    #                 "runtimeConfig": {
    #                     "version": "2.2",
    #                     "properties": {
    #                         "spark.driver.cores": "4",
    #                         "spark.driver.memory": "12200m",
    #                         "spark.driver.memoryOverhead": "1220m",
    #                         "spark.dataproc.driver.disk.size": "400g",
    #                         "spark.dataproc.driver.disk.tier": "standard",
    #                         "spark.executor.cores": "4",
    #                         "spark.executor.memory": "12200m",
    #                         "spark.executor.memoryOverhead": "1220m",
    #                         "spark.dataproc.executor.disk.size": "400g",
    #                         "spark.dataproc.executor.disk.tier": "standard",
    #                         "spark.executor.instances": "2",
    #                         "spark.dynamicAllocation.enabled": "true",
    #                         "spark.dynamicAllocation.initialExecutors": "2",
    #                         "spark.dynamicAllocation.minExecutors": "2",
    #                         "spark.dynamicAllocation.maxExecutors": "1000",
    #                         "spark.dynamicAllocation.executorAllocationRatio": "0.3",
    #                         "spark.reducer.fetchMigratedShuffle.enabled": "false"
    #                     }
    #                 },
    #                 "environmentConfig": {
    #                     "executionConfig": {
    #                         "subnetworkUri": "default"
    #                     },
    #                     "peripheralsConfig": {
    #                         "metastoreService": "projects/dataproc-jupyter-extension-dev/locations/us-central1/services/service-meta1"
    #                     }
    #                 },
    #                 "description": "26thJuneProFromLancherWOgpuTest",
    #                 "updateTime": "2024-06-26T10:19:57.656700Z",
    #                 "uuid": "33907303-587f-4d42-98f7-dd9f28c2bfaa"
    #             },
    #             "scheduleValue": "",
    #             "timeZone": "",
    #             "datasetId": "",
    #             "tableId": "",
    #             "location": "",
    #             "writeDisposition": "",
    #             "serviceAccount": "accenture-eng-test@dataproc-jupyter-extension-dev.iam.gserviceaccount.com",
    #             "keyRings": "",
    #             "kmsKey": "",
    #             "isSaveQuery": False,
    #             "isAutoRegion": True
    #         },
    #         "origin": [
    #             0.5,
    #             0
    #         ],
    #         "width": 232,
    #         "height": 98,
    #         "selected": False,
    #         "positionAbsolute": {
    #             "x": 184.58053733312448,
    #             "y": -174.4873385836904
    #         },
    #         "dragging": False
    #     },
    #     {
    #         "id": "5",
    #         "type": "composerNode",
    #         "position": {
    #             "x": 357.25975388908,
    #             "y": -268.76622118607986
    #         },
    #         "data": {
    #             "nodeType": "Bigquery-Sql",
    #             "inputFile": "sqlfile.sql",
    #             "retryCount": 4,
    #             "retryDelay": 4,
    #             "parameter": [
    #                 "4:4:STRING"
    #             ],
    #             "stopCluster": "",
    #             "clusterName": "",
    #             "serverless": "",
    #             "scheduleValue": "",
    #             "timeZone": "",
    #             "datasetId": "test1",
    #             "tableId": "123",
    #             "location": "europe",
    #             "writeDisposition": "WRITE_TRUNCATE",
    #             "serviceAccount": "accenture-eng-test@dataproc-jupyter-extension-dev.iam.gserviceaccount.com",
    #             "keyRings": "keyRingEU",
    #             "kmsKey": "projects/dataproc-jupyter-extension-dev/locations/europe/keyRings/keyRingEU/cryptoKeys/keyEU1",
    #             "isSaveQuery": True,
    #             "isAutoRegion": False
    #         },
    #         "origin": [
    #             0.5,
    #             0
    #         ],
    #         "width": 232,
    #         "height": 98,
    #         "selected": True,
    #         "dragging": False
    #     }
    # 
    ],
    "edges": [
        {
            "id": "2",
            "source": "1",
            "target": "2"
        },
        # {
        #     "id": "3",
        #     "source": "1",
        #     "target": "3"
        # },
        # {
        #     "id": "4",
        #     "source": "1",
        #     "target": "4"
        # },
        # {
        #     "id": "5",
        #     "source": "1",
        #     "target": "5"
        # }
    ]
}
            return payload
        except Exception as e:
            self.log.exception(f"Error downloading dag file: {str(e)}")
            # cluster_name = ""
            # serverless_name = ""
            # email_on_success = "False"
            # stop_cluster_check = "False"
            # mode_selected = "serverless"
            # time_zone = ""
            # pattern = r"parameters\s*=\s*'''(.*?)'''"
            # file_response = await self.get_dag_file(dag_id, bucket_name)
            # content_str = file_response.decode("utf-8")
            # file_content = re.sub(r"(?<!\\)\\(?!n)", "", content_str)

            # if file_content:
            #     for line in file_content.split("\n"):
            #         if "input_notebook" in line:
            #             input_notebook = line.split("=")[-1].strip().strip("'\"")
            #             break

            #     for line in file_content.split("\n"):
            #         match = re.search(pattern, file_content, re.DOTALL)
            #         if match:
            #             parameters_yaml = match.group(1)
            #             parameters_list = [
            #                 line.strip()
            #                 for line in parameters_yaml.split("\n")
            #                 if line.strip()
            #             ]
            #         else:
            #             parameters_list = []

            #     for line in file_content.split("\n"):
            #         if "email" in line:
            #             # Extract the email string from the line
            #             email_str = (
            #                 line.split(":")[-1].strip().strip("'\"").replace(",", "")
            #             )
            #             # Use regular expression to extract email addresses
            #             email_list = re.findall(
            #                 r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b",
            #                 email_str,
            #             )
            #             # Remove quotes from the email addresses
            #             email_list = [email.strip("'\"") for email in email_list]
            #             break
            #     for line in file_content.split("\n"):
            #         if "cluster_name" in line:
            #             cluster_name = (
            #                 line.split(":")[-1]
            #                 .strip()
            #                 .strip("'\"}")
            #                 .split("'")[0]
            #                 .strip()
            #             )  # Extract project_id from the line
            #         elif "submit_pyspark_job" in line:
            #             mode_selected = "cluster"
            #         elif "'retries'" in line:
            #             retries = line.split(":")[-1].strip().strip("'\"},")
            #             retry_count = int(
            #                 retries.strip("'\"")
            #             )  # Extract retry_count from the line
            #         elif "retry_delay" in line:
            #             retry_delay = int(
            #                 line.split("int('")[1].split("')")[0]
            #             )  # Extract retry_delay from the line
            #         elif "email_on_failure" in line:
            #             second_part = line.split(":")[1].strip()
            #             email_on_failure = second_part.split("'")[
            #                 1
            #             ]  # Extract email_failure from the line
            #         elif "email_on_retry" in line:
            #             second_part = line.split(":")[1].strip()
            #             email_on_retry = second_part.split("'")[1]
            #         elif "email_on_success" in line:
            #             second_part = line.split(":")[1].strip()
            #             email_on_success = second_part.split("'")[1]
            #         elif "schedule_interval" in line:
            #             schedule_interval = (
            #                 line.split("=")[-1]
            #                 .strip()
            #                 .strip("'\"")
            #                 .split(",")[0]
            #                 .rstrip("'\"")
            #             )  # Extract schedule_interval from the line
            #         elif "stop_cluster_check" in line:
            #             stop_cluster_check = line.split("=")[-1].strip().strip("'\"")
            #         elif "serverless_name" in line:
            #             serverless_name = line.split("=")[-1].strip().strip("'\"")
            #         elif "time_zone" in line:
            #             time_zone = line.split("=")[-1].strip().strip("'\"")

            #     payload = {
            #         "input_filename": input_notebook,
            #         "parameters": parameters_list,
            #         "mode_selected": mode_selected,
            #         "cluster_name": cluster_name,
            #         "serverless_name": serverless_name,
            #         "retry_count": retry_count,
            #         "retry_delay": retry_delay,
            #         "email_failure": email_on_failure,
            #         "email_delay": email_on_retry,
            #         "email_success": email_on_success,
            #         "email": email_list,
            #         "schedule_value": schedule_interval,
            #         "stop_cluster": stop_cluster_check,
            #         "time_zone": time_zone,
            #     }
            #     return payload

            # else:
            #     self.log.exception("No Dag file found")


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
            client = compute_v1.RegionsClient(credentials = credentials)

            regions = client.list(project=project_id)
            region_names = [region.name for region in regions]
            return region_names
        except Exception as e:
            self.log.exception(f"Error listing regions: {str(e)}")
            return {"error": str(e)}

    async def list_service_accounts(self, project_id):
        try:
            credentials = oauth2.Credentials(self._access_token)
            iam_admin_client = iam_admin_v1.IAMAsyncClient(credentials = credentials)
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

    async def list_key_rings(self,region_id) -> kms_v1.services.key_management_service.pagers.ListKeyRingsPager:
        try:
            credentials = oauth2.Credentials(self._access_token)
            client = kms.KeyManagementServiceAsyncClient(credentials=credentials)
            location_name = f"projects/{self.project_id}/locations/{region_id}"
            key_rings = await client.list_key_rings(request={"parent": location_name})
            key_ring_list =[]
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
            keys_list =[]
            async for key in keys:
                keys_list.append(key.name)
            return keys_list
        except Exception as e:
            self.log.exception(f"Error listing keys: {str(e)}")
            return {"error": str(e)}