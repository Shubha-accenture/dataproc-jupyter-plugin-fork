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
import subprocess
import unittest
from unittest.mock import AsyncMock, MagicMock, Mock, patch

import aiohttp
import pytest
from google.cloud import storage


from dataproc_jupyter_plugin import credentials
from dataproc_jupyter_plugin.services import airflow
from dataproc_jupyter_plugin.services import executor
from dataproc_jupyter_plugin.tests.test_airflow import MockClientSession


async def mock_credentials():
    return {
        "project_id": "credentials-project",
        "project_number": 12345,
        "region_id": "mock-region",
        "access_token": "mock-token",
        "config_error": 0,
        "login_error": 0,
    }


def mock_get(api_endpoint, headers=None):
    response = Mock()
    response.status_code = 200
    response.json.return_value = {
        "api_endpoint": api_endpoint,
        "headers": headers,
    }
    return response


async def mock_config(field_name):
    return None


class TestExecuteMethod(unittest.TestCase):
    def setUp(self):
        self.instance = executor.Client
        self.input_data = {
            "dag_id": "test_dag_id",
            "name": "test_job_name",
            "composer_environment_name": "test_env",
            "input_filename": "test_input_file",
        }

    @patch("models.DescribeJob")
    @patch("executor.Client.get_bucket", new_callable=AsyncMock)
    @patch("executor.Client.check_file_exists")
    @patch("executor.Client.upload_papermill_to_gcs")
    @patch("executor.Client.upload_input_file_to_gcs")
    @patch("executor.Client.prepare_dag")
    @patch("executor.Client.upload_dag_to_gcs")
    async def test_execute_success(
        self,
        mock_upload_dag_to_gcs,
        mock_prepare_dag,
        mock_upload_input_file_to_gcs,
        mock_upload_papermill_to_gcs,
        mock_check_file_exists,
        mock_get_bucket,
        mock_describe_job,
    ):
        mock_job = MagicMock()
        mock_job.dag_id = "test_dag_id"
        mock_job.name = "test_job_name"
        mock_job.composer_environment_name = "test_env"
        mock_job.input_filename = "test_input_file"
        mock_describe_job.return_value = mock_job

        mock_get_bucket.return_value = "test_bucket"
        mock_check_file_exists.return_value = True

        result = await self.instance.execute(self.input_data)

        self.assertEqual(result, {"status": 0})


@pytest.mark.parametrize("returncode, expected_result", [(0, 0)])
async def test_download_dag_output(monkeypatch, returncode, expected_result, jp_fetch):

    async def mock_list_dag_run_task(*args, **kwargs):
        return None

    monkeypatch.setattr(airflow.Client, "list_dag_run_task", mock_list_dag_run_task)
    monkeypatch.setattr(aiohttp, "ClientSession", MockClientSession)
    mock_blob = MagicMock()
    mock_blob.download_as_bytes.return_value = b"mock file content"

    mock_bucket = MagicMock()
    mock_bucket.blob.return_value = mock_blob

    mock_storage_client = MagicMock()
    mock_storage_client.bucket.return_value = mock_bucket
    monkeypatch.setattr(credentials, "get_cached", mock_credentials)
    monkeypatch.setattr(storage, "Client", lambda credentials=None: mock_storage_client)

    mock_composer_name = "mock-composer"
    mock_bucket_name = "mock_bucket"
    mock_dag_id = "mock-dag-id"
    mock_dag_run_id = "258"
    mock_output_task_id = "generate_output_file_2"

    response = await jp_fetch(
        "dataproc-plugin",
        "downloadOutput",
        params={
            "composer": mock_composer_name,
            "bucket_name": mock_bucket_name,
            "dag_id": mock_dag_id,
            "dag_run_id": mock_dag_run_id,
            "output_task_id": mock_output_task_id
        },
    )
    assert response.code == 200
    payload = json.loads(response.body)
    print('ssssss',payload)
    assert payload["status"] == 0

async def test_invalid_composer_name(monkeypatch, jp_fetch):
    mock_composer_name = "mock_composer"
    mock_bucket_name = "mock-bucket"
    mock_dag_id = "mock-dag-id"
    mock_dag_run_id = "258"
    mock_output_task_id = "generate_output_task_2"
    response = await jp_fetch(
        "dataproc-plugin",
        "downloadOutput",
        params={
            "composer": mock_composer_name,
            "bucket_name": mock_bucket_name,
            "dag_id": mock_dag_id,
            "dag_run_id": mock_dag_run_id,
            "output_task_id": mock_output_task_id
        },
    )
    assert response.code == 200
    payload = json.loads(response.body)
    assert "status" not in payload
    assert "error" in payload
    assert "Invalid Composer environment name" in payload["error"]


async def test_invalid_bucket_name(monkeypatch, jp_fetch):
    mock_composer_name = "mock-composer"
    mock_bucket_name = "mock/bucket"
    mock_dag_id = "mock-dag-id"
    mock_dag_run_id = "258"
    mock_output_task_id = "generate_output_task_2"
    response = await jp_fetch(
        "dataproc-plugin",
        "downloadOutput",
        params={
            "composer": mock_composer_name,
            "bucket_name": mock_bucket_name,
            "dag_id": mock_dag_id,
            "dag_run_id": mock_dag_run_id,
            "output_task_id": mock_output_task_id
        },
    )
    assert response.code == 200
    payload = json.loads(response.body)
    assert "status" not in payload
    assert "error" in payload
    assert "Invalid bucket name" in payload["error"]


async def test_invalid_dag_id(monkeypatch, jp_fetch):
    mock_composer_name = "mock-composer"
    mock_bucket_name = "mock-bucket"
    mock_dag_id = "mock/dag/id"
    mock_dag_run_id = "258"
    mock_output_task_id = "generate_output_task_2"
    response = await jp_fetch(
        "dataproc-plugin",
        "downloadOutput",
        params={
            "composer": mock_composer_name,
            "bucket_name": mock_bucket_name,
            "dag_id": mock_dag_id,
            "dag_run_id": mock_dag_run_id,
            "output_task_id": mock_output_task_id
        },
    )
    assert response.code == 200
    payload = json.loads(response.body)
    assert "status" not in payload
    assert "error" in payload
    assert "Invalid DAG ID" in payload["error"]


async def test_invalid_dag_run_id(monkeypatch, jp_fetch):
    mock_composer_name = "mock-composer"
    mock_bucket_name = "mock-bucket"
    mock_dag_id = "mock-dag-id"
    mock_dag_run_id = "a/b/c/d"
    mock_output_task_id = "generate_output_task_2"
    response = await jp_fetch(
        "dataproc-plugin",
        "downloadOutput",
        params={
            "composer": mock_composer_name,
            "bucket_name": mock_bucket_name,
            "dag_id": mock_dag_id,
            "dag_run_id": mock_dag_run_id,
            "output_task_id": mock_output_task_id
        },
    )
    assert response.code == 200
    payload = json.loads(response.body)
    assert "status" not in payload
    assert "error" in payload
    assert "Invalid DAG Run ID" in payload["error"]

# @pytest.mark.asyncio
# async def test_download_dag_output_success(monkeypatch, jp_fetch):
#     # Mock airflow client
#     mock_list_dag_run_task = AsyncMock()
#     monkeypatch.setattr("airflow.Client.list_dag_run_task", mock_list_dag_run_task)

#     # Mock GCS client and blob
#     mock_blob = MagicMock()
#     mock_blob.download_as_bytes.return_value = b"notebook content"
#     mock_bucket = MagicMock()
#     mock_bucket.blob.return_value = mock_blob
#     mock_storage_client = MagicMock()
#     mock_storage_client.bucket.return_value = mock_bucket
#     monkeypatch.setattr("downloadOutput.storage.Client", lambda credentials: mock_storage_client)

#     # Mock oauth2 credentials
#     mock_credentials = MagicMock()
#     monkeypatch.setattr("downloadOutput.oauth2.Credentials", lambda token: mock_credentials)

#     # Mock aiofiles
#     mock_aiofiles = AsyncMock()
#     monkeypatch.setattr("downloadOutput.aiofiles.open", mock_aiofiles)

#     response = await jp_fetch(
#         "dataproc-plugin",
#         "downloadOutput",
#         params={
#             "composer": "mock-composer",
#             "bucket_name": "mock-bucket",
#             "dag_id": "mock-dag-id",
#             "dag_run_id": "258",
#             "output_task_id": "task1"
#         },
#     )

#     assert response.code == 200
#     payload = json.loads(response.body)
#     assert payload["status"] == 0

#     mock_list_dag_run_task.assert_called_once()
#     mock_storage_client.bucket.assert_called_once_with("mock-bucket")
#     mock_bucket.blob.assert_called_once_with("dataproc-output/mock-dag-id/output-notebooks/mock-dag-id_258-task1.ipynb")
#     mock_blob.download_as_bytes.assert_called_once()
#     mock_aiofiles.assert_called_once()

# @pytest.mark.asyncio
# async def test_invalid_dag_run_id(monkeypatch, jp_fetch):
#     mock_list_dag_run_task = AsyncMock(side_effect=Exception("Invalid DAG run ID"))
#     monkeypatch.setattr("airflow.Client.list_dag_run_task", mock_list_dag_run_task)

#     response = await jp_fetch(
#         "dataproc-plugin",
#         "downloadOutput",
#         params={
#             "composer": "mock-composer",
#             "bucket_name": "mock-bucket",
#             "dag_id": "mock-dag-id",
#             "dag_run_id": "invalid-id",
#             "output_task_id": "task1"
#         },
#     )

#     assert response.code == 200
#     payload = json.loads(response.body)
#     assert "error" in payload
#     assert "Invalid DAG run ID" in payload["error"]

# @pytest.mark.asyncio
# async def test_gcs_error(monkeypatch, jp_fetch):
#     mock_list_dag_run_task = AsyncMock()
#     monkeypatch.setattr("airflow.Client.list_dag_run_task", mock_list_dag_run_task)

#     mock_storage_client = MagicMock()
#     mock_storage_client.bucket.side_effect = Exception("GCS Error")
#     monkeypatch.setattr("downloadOutput.storage.Client", lambda credentials: mock_storage_client)

#     monkeypatch.setattr("downloadOutput.oauth2.Credentials", lambda token: MagicMock())

#     response = await jp_fetch(
#         "dataproc-plugin",
#         "downloadOutput",
#         params={
#             "composer": "mock-composer",
#             "bucket_name": "mock-bucket",
#             "dag_id": "mock-dag-id",
#             "dag_run_id": "258",
#             "output_task_id": "task1"
#         },
#     )

#     assert response.code == 200
#     payload = json.loads(response.body)
#     assert "error" in payload
#     assert "GCS Error" in payload["error"]
