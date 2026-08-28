import json
import pytest
from unittest.mock import AsyncMock, patch, MagicMock
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
        "runtimeTemplates",
        method="GET",
    )

    assert response.code == 200
    payload = json.loads(response.body)
    assert payload == {"sessionTemplates": [{"name": "test-template"}]}
    mock_list.assert_called_once()


async def test_runtime_profile_controller_get_error(jp_fetch, monkeypatch):
    mock_list = AsyncMock(return_value=(None, "Mocked error"))
    monkeypatch.setattr(
        "dataproc_jupyter_plugin.controllers.runtimeProfile.runtime_profile_service.list_runtime_profiles",
        mock_list,
    )

    response = await jp_fetch(
        "dataproc-plugin",
        "runtimeTemplates",
        method="GET",
    )

    assert response.code == 200
    payload = json.loads(response.body)
    assert payload == {"error": "Mocked error"}
    mock_list.assert_called_once()


async def test_runtime_profile_controller_delete_success(jp_fetch, monkeypatch):
    mock_delete = AsyncMock(return_value=(True, None))
    monkeypatch.setattr(
        "dataproc_jupyter_plugin.controllers.runtimeProfile.runtime_profile_service.delete_runtime_profile",
        mock_delete,
    )

    response = await jp_fetch(
        "dataproc-plugin",
        "runtimeTemplates",
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
        "runtimeTemplates",
        method="DELETE",
        raise_error=False,
    )

    assert response.code == 400
    payload = json.loads(response.body)
    assert payload == {"error": "templateId is required"}


async def test_active_sessions_controller_get_success(jp_fetch, monkeypatch):
    mock_count = AsyncMock(
        return_value=({"count": 5, "sessionNames": ["session-1"]}, None)
    )
    monkeypatch.setattr(
        "dataproc_jupyter_plugin.controllers.runtimeProfile.runtime_profile_service.get_active_sessions_count",
        mock_count,
    )

    response = await jp_fetch(
        "dataproc-plugin",
        "runtimeProfileSessions",
        method="GET",
        params={"templateId": "test-template-id"},
    )

    assert response.code == 200
    payload = json.loads(response.body)
    assert payload == {"count": 5, "sessionNames": ["session-1"]}
    mock_count.assert_called_once()


async def test_active_sessions_controller_get_missing_id(jp_fetch):
    response = await jp_fetch(
        "dataproc-plugin",
        "runtimeProfileSessions",
        method="GET",
        raise_error=False,
    )

    assert response.code == 400
    payload = json.loads(response.body)
    assert payload == {"error": "templateId is required"}


@pytest.mark.asyncio
async def test_get_active_sessions_count_success(monkeypatch):
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
    mock_response.json = AsyncMock(
        return_value={
            "sessions": [
                {"jupyterSession": {"sessionTemplate": "template-1"}},
                {"sessionTemplate": "template-1"},
                {"jupyterSession": {"sessionTemplate": "template-2"}},
            ]
        }
    )

    mock_session = MagicMock()
    mock_session.get.return_value.__aenter__.return_value = mock_response
    monkeypatch.setattr(
        "dataproc_jupyter_plugin.services.runtimeProfile.RuntimeProfileService.get_client",
        AsyncMock(return_value=mock_session),
    )

    data, error = await runtime_profile_service.get_active_sessions_count(
        MagicMock(), "template-1"
    )
    assert error is None
    assert data["count"] == 2
    assert len(data["sessionNames"]) == 2


@pytest.mark.asyncio
async def test_get_active_sessions_count_api_error(monkeypatch):
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
    mock_response.status = 500
    mock_response.text = AsyncMock(return_value="API Error")

    mock_session = MagicMock()
    mock_session.get.return_value.__aenter__.return_value = mock_response
    monkeypatch.setattr(
        "dataproc_jupyter_plugin.services.runtimeProfile.RuntimeProfileService.get_client",
        AsyncMock(return_value=mock_session),
    )

    data, error = await runtime_profile_service.get_active_sessions_count(
        MagicMock(), "template-1"
    )
    assert "API Error" in error
    assert data["count"] == 0


@pytest.mark.asyncio
async def test_get_active_sessions_count_no_creds(monkeypatch):
    monkeypatch.setattr(
        "dataproc_jupyter_plugin.services.runtimeProfile.credentials.get_cached",
        AsyncMock(return_value=None),
    )
    data, error = await runtime_profile_service.get_active_sessions_count(
        MagicMock(), "template-1"
    )
    assert error == "No credentials found"
    assert data["count"] == 0
