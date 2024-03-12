import subprocess
import unittest
from unittest.mock import MagicMock
from dataproc_jupyter_plugin.services.downloadOutputService import DownloadOutputService

import subprocess
from unittest.mock import MagicMock
from dataproc_jupyter_plugin.services.downloadOutputService import DownloadOutputService

def test_download_dag_output_success():
    subprocess_mock = MagicMock()
    subprocess_mock.returncode = 0
    subprocess_mock.communicate.return_value = (b"Output data", b"")
    subprocess.Popen = MagicMock(return_value=subprocess_mock)
    log_mock = MagicMock()
    download_service = DownloadOutputService()
    result = download_service.download_dag_output("test-bucket", "test-dag", "test-run", log_mock)
    assert result == 0

def test_download_dag_output_failure():
    subprocess_mock = MagicMock()
    subprocess_mock.returncode = 1
    subprocess_mock.communicate.return_value = (b"", b"Error message")
    subprocess.Popen = MagicMock(return_value=subprocess_mock)
    log_mock = MagicMock()
    download_service = DownloadOutputService()
    result = download_service.download_dag_output("test-bucket", "test-dag", "test-run", log_mock)
    assert result == 1
    log_mock.exception.assert_called_with("Error downloading output notebook file")

