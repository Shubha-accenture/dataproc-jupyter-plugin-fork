import unittest
from unittest.mock import MagicMock

from requests import patch
from dataproc_jupyter_plugin.services.editDagService import (
    DagEditService,
)  # Import the class containing the get_dag_file method


def test_get_dag_file_success():
    with unittest.mock.patch("requests.get") as mock_get:
        mock_get.return_value.status_code = 200
        mock_get.return_value.json.return_value = {"mock_key": "mock_value"}
        credentials = {
            "access_token": "mock_token",
            "project_id": "mock_project",
            "region_id": "mock_region",
        }
        dag_id = "mock_dag_id"
        bucket = "mock_bucket"
        log = MagicMock()
        service = DagEditService()
        result = service.get_dag_file(credentials, dag_id, bucket, log)
        assert result is not None
        assert "Dag file response fetched" in log.info.call_args[0][0]


def test_get_dag_file_missing_credentials():
    credentials = {}
    dag_id = "mock_dag_id"
    bucket = "mock_bucket"
    log = MagicMock()
    service = DagEditService()
    result = service.get_dag_file(credentials, dag_id, bucket, log)
    assert "error" in result
    assert "Missing required credentials" in result["error"]


def test_get_dag_file_exception():
    with unittest.mock.patch("requests.get") as mock_get:
        mock_get.side_effect = Exception("Mocked exception")
        credentials = {
            "access_token": "mock_token",
            "project_id": "mock_project",
            "region_id": "mock_region",
        }
        dag_id = "mock_dag_id"
        bucket = "mock_bucket"
        log = MagicMock()
        service = DagEditService()
        result = service.get_dag_file(credentials, dag_id, bucket, log)
        assert result == {"error": "Mocked exception"}
        assert "Error reading dag file" in log.exception.call_args[0][0]
