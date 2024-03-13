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


import logging
from dataproc_jupyter_plugin.services.dagListService import DagListService
import pytest
from unittest.mock import MagicMock, Mock, patch
from dataproc_jupyter_plugin import handlers
from dataproc_jupyter_plugin.services.triggerDagService import TriggerDagService


@patch("dataproc_jupyter_plugin.services.triggerDagService.requests.post")
def test_trigger_dag_success(mock_requests_get):
    credentials = {
        "access_token": "token",
        "project_id": "project",
        "region_id": "region",
    }
    composer = "composer"
    dag_id = "dag_id"
    log = MagicMock()
    response = MagicMock()
    response.status_code = 200
    response.json.return_value = {"conf": {}}
    mock_requests_get.return_value = response
    service = TriggerDagService()
    result = service.dag_trigger(credentials, dag_id, composer, log)
    assert result == {"conf": {}}


def test_trigger_dag_missing_credentials():
    credentials = {}
    composer = "composer"
    dag_id = "dag_id"
    log = MagicMock()
    service = TriggerDagService()
    result = service.dag_trigger(credentials, dag_id, composer, log)
    assert "error" in result
    assert "Missing required credentials" in result["error"]


@patch("dataproc_jupyter_plugin.services.dagListService.requests.get")
def test_get_airflow_uri_success(mock_requests_get):
    log = logging.getLogger(__name__)
    cred = handlers.get_cached_credentials(log)
    credentials = {
        "access_token": cred["access_token"],
        "project_id": cred["project_id"],
        "region_id": cred["region_id"],
    }
    composer_name = "composer"
    response = Mock()
    response.status_code = 200
    response.json.return_value = {
        "config": {"airflowUri": "airflow_uri"},
        "storageConfig": {"bucket": "bucket"},
    }
    mock_requests_get.return_value = response
    service = DagListService()
    airflow_uri, bucket = service.get_airflow_uri(composer_name, credentials, log)
    assert airflow_uri == "airflow_uri"
    assert bucket == "bucket"
