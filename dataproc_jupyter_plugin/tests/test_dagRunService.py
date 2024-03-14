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
import pytest
from unittest.mock import MagicMock, Mock, patch
from dataproc_jupyter_plugin import handlers
from dataproc_jupyter_plugin.services.dagRunService import (
    DagRunListService,
    DagRunTaskListService,
    DagRunTaskLogsListService,
)


@patch("dataproc_jupyter_plugin.services.dagRunService.requests.get")
def test_dag_run_list_success(mock_requests_get):
    credentials = {
        "access_token": "token",
        "project_id": "project",
        "region_id": "region",
    }
    composer_name = "composer"
    dag_id = "mock_dag_id"
    start_date = "mock_start_date"
    end_date = "mock_end_date"
    offset = "mock_offset"
    log = MagicMock()
    response = MagicMock()
    response.status_code = 200
    response.json.return_value = {"dag_runs": [], "total_entries": 0}
    mock_requests_get.return_value = response
    service = DagRunListService()
    result = service.list_dag_runs(
        credentials, composer_name, dag_id, start_date, end_date, offset, log
    )
    assert result == {"dag_runs": [], "total_entries": 0}


def test_dag_run_list_missing_credentials():
    credentials = {}
    composer_name = "composer"
    dag_id = "mock_dag_id"
    start_date = "mock_start_date"
    end_date = "mock_end_date"
    offset = "mock_offset"
    log = MagicMock()
    service = DagRunListService()
    result = service.list_dag_runs(
        credentials, composer_name, dag_id, start_date, end_date, offset, log
    )
    assert "error" in result
    assert "Missing required credentials" in result["error"]


@patch("dataproc_jupyter_plugin.services.dagRunService.requests.get")
def test_dag_run_task_list_success(mock_requests_get):
    credentials = {
        "access_token": "token",
        "project_id": "project",
        "region_id": "region",
    }
    composer_name = "composer"
    dag_id = "mock_dag_id"
    dag_run_id = "mock_dag_run_id"
    log = MagicMock()
    response = MagicMock()
    response.status_code = 200
    response.json.return_value = {"task_instances": [], "total_entries": 0}
    mock_requests_get.return_value = response
    service = DagRunTaskListService()
    result = service.list_dag_run_task(
        credentials, composer_name, dag_id, dag_run_id, log
    )
    assert result == {"task_instances": [], "total_entries": 0}


def test_dag_run_task_list_missing_credentials():
    credentials = {}
    composer_name = "composer"
    dag_id = "mock_dag_id"
    dag_run_id = "mock_dag_run_id"
    log = MagicMock()
    service = DagRunTaskListService()
    result = service.list_dag_run_task(
        credentials, composer_name, dag_id, dag_run_id, log
    )
    assert "error" in result
    assert "Missing required credentials" in result["error"]


@patch("dataproc_jupyter_plugin.services.dagRunService.requests.get")
def test_dag_run_task_logs_success(mock_requests_get):
    credentials = {
        "access_token": "token",
        "project_id": "project",
        "region_id": "region",
    }
    composer_name = "composer"
    dag_id = "mock_dag_id"
    dag_run_id = "mock_dag_run_id"
    task_id = "mock_task_id"
    task_try_number = 1
    log = MagicMock()
    response = MagicMock()
    response.status_code = 200
    response.text = "dummy_response"
    mock_requests_get.return_value = response
    service = DagRunTaskLogsListService()
    result = service.list_dag_run_task_logs(
        credentials, composer_name, dag_id, dag_run_id, task_id, task_try_number, log
    )
    assert result == {"content": "dummy_response"}


def test_dag_run_task_logs_missing_credentials():
    credentials = {}
    composer_name = "composer"
    dag_id = "mock_dag_id"
    dag_run_id = "mock_dag_run_id"
    task_id = "mock_task_id"
    task_try_number = "mock_task_try_number"
    log = MagicMock()
    service = DagRunTaskLogsListService()
    result = service.list_dag_run_task_logs(
        credentials, composer_name, dag_id, dag_run_id, task_id, task_try_number, log
    )
    assert "error" in result
    assert "Missing required credentials" in result["error"]
