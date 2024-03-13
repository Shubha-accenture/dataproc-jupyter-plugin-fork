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


from unittest.mock import MagicMock, patch
from dataproc_jupyter_plugin.services.triggerDagService import TriggerDagService
from unittest.mock import MagicMock, patch
from dataproc_jupyter_plugin.services.triggerDagService import TriggerDagService


@patch("dataproc_jupyter_plugin.services.dagListService.DagListService.get_airflow_uri")
@patch("dataproc_jupyter_plugin.services.triggerDagService.requests.post")
def test_dag_trigger_success(mock_post, mock_get_airflow_uri):
    mock_get_airflow_uri.return_value = ("mock_airflow_uri", "mock_bucket")
    mock_post.return_value.status_code = 200
    mock_post.return_value.json.return_value = {"mock_key": "mock_value"}
    trigger_dag_service = TriggerDagService()
    credentials = {
        "access_token": "mock_token",
        "project_id": "mock_project",
        "region_id": "mock_region",
    }
    dag_id = "mock_dag_id"
    composer = "mock_composer"
    log = MagicMock()
    result = trigger_dag_service.dag_trigger(credentials, dag_id, composer, log)
    assert result == {"mock_key": "mock_value"}


def test_dag_trigger_missing_credentials():
    trigger_dag_service = TriggerDagService()
    credentials = {}
    dag_id = "mock_dag_id"
    composer = "mock_composer"
    log = MagicMock()
    result = trigger_dag_service.dag_trigger(credentials, dag_id, composer, log)
    assert "error" in result
    assert "Missing required credentials" in result["error"]
