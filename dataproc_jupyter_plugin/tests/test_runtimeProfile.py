# Copyright 2026 Google LLC
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
import pytest
from unittest.mock import AsyncMock, MagicMock
from dataproc_jupyter_plugin.services.runtimeProfile import runtime_profile_service


async def test_runtime_profile_controller_get_success(jp_fetch, monkeypatch):
    mock_list = AsyncMock(
        return_value=({"sessionTemplates": [{"name": "test-template"}]}, None)
    )
    monkeypatch.setattr(
        "dataproc_jupyter_plugin.controllers.runtimeProfile.runtime_profile_service.list_runtime_profiles",
        mock_list,
    )

    response = await jp_fetch(
        "dataproc-plugin",
        "runtimeProfiles",
        method="GET",
    )

    assert response.code == 200
    payload = json.loads(response.body)
    assert payload == {"sessionTemplates": [{"name": "test-template"}]}
    mock_list.assert_called_once()


async def test_runtime_profile_controller_get_error(jp_fetch, monkeypatch):
    mock_list = AsyncMock(return_value=(None, {
        "message": "Failed to fetch profiles",
        "error": {"code": 500, "message": "Mocked error"}
    }))
    monkeypatch.setattr(
        "dataproc_jupyter_plugin.controllers.runtimeProfile.runtime_profile_service.list_runtime_profiles",
        mock_list,
    )

    response = await jp_fetch(
        "dataproc-plugin",
        "runtimeProfiles",
        method="GET",
        raise_error=False,
    )

    assert response.code == 500
    payload = json.loads(response.body)
    assert payload == {
        "message": "Failed to fetch profiles",
        "error": {"code": 500, "message": "Mocked error"}
    }
    mock_list.assert_called_once()


async def test_runtime_profile_controller_delete_success(jp_fetch, monkeypatch):
    mock_delete = AsyncMock(return_value=(True, None))
    monkeypatch.setattr(
        "dataproc_jupyter_plugin.controllers.runtimeProfile.runtime_profile_service.delete_runtime_profile",
        mock_delete,
    )

    response = await jp_fetch(
        "dataproc-plugin",
        "runtimeProfiles",
        method="DELETE",
        params={"templateId": "test-template-id"},
    )

    assert response.code == 200
    payload = json.loads(response.body)
    assert payload == {"success": True}
    mock_delete.assert_called_once()


async def test_runtime_profile_controller_delete_missing_id(jp_fetch):
    response = await jp_fetch(
        "dataproc-plugin",
        "runtimeProfiles",
        method="DELETE",
        raise_error=False,
    )

    assert response.code == 400
    payload = json.loads(response.body)
    assert payload == {
        "message": "templateId is required",
        "error": {"code": 400, "message": "templateId is required"}
    }


@pytest.mark.asyncio
async def test_delete_runtime_profile_invalid_prefix(monkeypatch):
    mock_creds = AsyncMock(
        return_value={
            "project_id": "test-project",
            "region_id": "test-region",
            "access_token": "token",
        }
    )
    monkeypatch.setattr(
        "dataproc_jupyter_plugin.services.runtimeProfile.credentials.get_cached",
        mock_creds,
    )
    success, error = await runtime_profile_service.delete_runtime_profile(
        MagicMock(), "invalid-prefix/sessionTemplates/test"
    )
    assert success is False
    assert "Invalid templateId" in error["message"]


@pytest.mark.asyncio
async def test_delete_runtime_profile_success(monkeypatch):
    mock_creds = AsyncMock(
        return_value={
            "project_id": "test-project",
            "region_id": "test-region",
            "access_token": "token",
        }
    )
    monkeypatch.setattr(
        "dataproc_jupyter_plugin.services.runtimeProfile.credentials.get_cached",
        mock_creds,
    )
    monkeypatch.setattr(
        "dataproc_jupyter_plugin.services.runtimeProfile.urls.gcp_service_url",
        AsyncMock(return_value="https://test.url/"),
    )

    mock_response = AsyncMock()
    mock_response.status = 200
    mock_session = MagicMock()
    mock_session.delete.return_value.__aenter__.return_value = mock_response
    mock_client = MagicMock()
    mock_client.__aenter__.return_value = mock_session
    monkeypatch.setattr("aiohttp.ClientSession", MagicMock(return_value=mock_client))

    success, error = await runtime_profile_service.delete_runtime_profile(
        MagicMock(), "projects/test-project/locations/test-region/sessionTemplates/test"
    )
    assert success is True
    assert error is None


@pytest.mark.asyncio
async def test_list_runtime_profiles_success(monkeypatch):
    mock_creds = AsyncMock(
        return_value={
            "project_id": "test-project",
            "region_id": "test-region",
            "access_token": "token",
        }
    )
    monkeypatch.setattr(
        "dataproc_jupyter_plugin.services.runtimeProfile.credentials.get_cached",
        mock_creds,
    )
    monkeypatch.setattr(
        "dataproc_jupyter_plugin.services.runtimeProfile.urls.gcp_service_url",
        AsyncMock(return_value="https://test.url/"),
    )

    mock_response = AsyncMock()
    mock_response.status = 200
    mock_response.json = AsyncMock(return_value={"sessionTemplates": []})
    mock_session = MagicMock()
    mock_session.get.return_value.__aenter__.return_value = mock_response
    mock_client = MagicMock()
    mock_client.__aenter__.return_value = mock_session
    monkeypatch.setattr("aiohttp.ClientSession", MagicMock(return_value=mock_client))

    resp, error = await runtime_profile_service.list_runtime_profiles(MagicMock(), "")
    assert error is None
    assert resp == {"sessionTemplates": []}
