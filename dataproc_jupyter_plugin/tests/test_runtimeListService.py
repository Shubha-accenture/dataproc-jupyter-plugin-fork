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
from unittest.mock import Mock, patch
from dataproc_jupyter_plugin import handlers
from dataproc_jupyter_plugin.services.runtimeListService import RuntimeListService

def test_list_clusters_success():
    log = logging.getLogger(__name__)
    cred = handlers.get_cached_credentials(log)
    credentials = {"access_token": cred['access_token'] , "project_id": cred["project_id"], "region_id":cred['region_id'] }
    page_size = 10
    page_token = ''
    service = RuntimeListService()
    response = service.list_clusters(credentials, page_size, page_token,log)
    assert len(response) >= 0 and 'error' not in response


def test_list_clusters_missing_credentials():
    credentials = {}
    page_size = 10
    page_token = ''
    log = logging.getLogger(__name__)
    service = RuntimeListService()
    result = service.list_runtime(credentials, page_size, page_token, log)
    assert "error" in result
    assert "Missing required credentials" in result["error"]









