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
import subprocess
import unittest
import pytest
from unittest.mock import MagicMock, Mock, patch
from dataproc_jupyter_plugin import handlers
from dataproc_jupyter_plugin.services.dagListService import DagDeleteService, DagListService, DagUpdateService


@patch("dataproc_jupyter_plugin.services.dagListService.requests.get")
def test_list_jobs_success(mock_requests_get):
    credentials = {
        "access_token": "token",
        "project_id": "project",
        "region_id": "region",
    }
    composer_name = "composer"
    tags = "tags"
    log = MagicMock()
    response = MagicMock()
    response.status_code = 200
    response.json.return_value = {"dag1": {}, "dag2": {}}
    mock_requests_get.return_value = response
    service = DagListService()
    result, bucket = service.list_jobs(credentials, composer_name, tags, log)
    assert result == {"dag1": {}, "dag2": {}}


def test_list_jobs_missing_credentials():
    credentials = {}
    composer_name = "composer"
    tags = "tags"
    log = MagicMock()
    service = DagListService()
    result = service.list_jobs(credentials, composer_name, tags, log)
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
   

@patch('dataproc_jupyter_plugin.services.dagListService.DagListService.get_airflow_uri')
def test_update_job_success(mock_get_airflow_uri):
    mock_get_airflow_uri.return_value = ('http://example.com', 'bucket_name')
    service = DagUpdateService()
    credentials = {'access_token': 'valid_token'}
    composer_name = 'test_composer'
    dag_id = 'test_dag'
    status = 'true'
    log = MagicMock()
    mock_response = MagicMock()
    mock_response.status_code = 200
    with patch('dataproc_jupyter_plugin.services.dagListService.requests.patch') as mock_patch:
        mock_patch.return_value = mock_response
        result = service.update_job(credentials, composer_name, dag_id, status, log)
        assert result == 0



@patch('dataproc_jupyter_plugin.services.dagListService.DagListService.get_airflow_uri')
@patch('dataproc_jupyter_plugin.services.dagListService.requests.delete')
@patch('dataproc_jupyter_plugin.services.dagListService.subprocess.Popen')
def test_delete_job_success(mock_popen, mock_delete, mock_get_airflow_uri):
        # Mocking dependencies
        mock_get_airflow_uri.return_value = ('http://example.com', 'bucket_name')
        mock_delete.return_value.status_code = 200
        mock_popen.return_value.communicate.return_value = (b'', b'')
        mock_popen.return_value.returncode = 0
        
        # Mocking credentials and logger
        credentials = {'access_token': 'valid_token'}
        composer_name = 'test_composer'
        dag_id = 'test_dag'
        from_page = None
        log = MagicMock()

        # Creating instance of DagDeleteService
        dag_delete_service = DagDeleteService()

        # Calling the delete_job method
        result = dag_delete_service.delete_job(credentials, composer_name, dag_id, from_page, log)
        assert result == 0







