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
from dataproc_jupyter_plugin.services.importErrorService import ImportErrorService

@patch('dataproc_jupyter_plugin.services.importErrorService.requests.get')
def test_import_errors_success(mock_requests_get):
    credentials = {
        "access_token": "token",
        "project_id": "project",
        "region_id": "region",
    }
    composer_name = "composer"
    log = MagicMock()
    response = MagicMock()
    response.status_code = 200
    response.json.return_value = {"import_errors": [], "total_entries": 0}
    mock_requests_get.return_value = response
    service = ImportErrorService()
    result = service.list_import_errors(credentials, composer_name, log)
    assert result == {"import_errors": [], "total_entries": 0}


def test_import_errors_missing_credentials():
    credentials = {}
    composer_name = "composer"
    log = MagicMock()
    service = ImportErrorService()
    result = service.list_import_errors(credentials, composer_name, log)
    assert "error" in result
    assert "Missing required credentials" in result["error"]



