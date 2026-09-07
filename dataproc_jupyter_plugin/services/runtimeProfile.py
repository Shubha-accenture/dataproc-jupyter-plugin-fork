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

import aiohttp
import urllib.parse
import json
from dataproc_jupyter_plugin import credentials, urls
from dataproc_jupyter_plugin.commons.constants import (
    DATAPROC_SERVICE_NAME,
    CONTENT_TYPE,
)


class RuntimeProfileService:
    def __init__(self):
        pass

    async def list_runtime_profiles(self, log, page_token="", page_size="50"):
        creds = await credentials.get_cached()
        if not creds or creds.get("login_error") or creds.get("config_error"):
            return None, {
                "message": "No credentials found or user not logged in",
                "error": {"code": 401, "message": "No credentials found or user not logged in"}
            }

        project_id = creds["project_id"]
        region_id = creds["region_id"]
        access_token = creds["access_token"]

        dataproc_url = await urls.gcp_service_url(DATAPROC_SERVICE_NAME)

        params = {"pageSize": page_size}
        if page_token:
            params["pageToken"] = page_token
        query_string = urllib.parse.urlencode(params)

        api_endpoint = f"{dataproc_url}v1/projects/{project_id}/locations/{region_id}/sessionTemplates?{query_string}"

        headers = {
            "Content-Type": CONTENT_TYPE,
            "Authorization": f"Bearer {access_token}",
        }

        async with aiohttp.ClientSession() as session:
            async with session.get(api_endpoint, headers=headers) as response:
                if response.status == 200:
                    resp = await response.json()
                    return resp, None
                else:
                    error_msg = await response.text()
                    log.error(f"Error fetching runtime profiles: {error_msg}")
                    try:
                        error_json = json.loads(error_msg)
                        code = error_json.get("error", {}).get("code", response.status)
                        message = error_json.get("error", {}).get("message", error_msg)
                    except Exception:
                        code = response.status
                        message = error_msg
                    return None, {
                        "message": "Failed to fetch profiles",
                        "error": {"code": code, "message": message}
                    }

    async def delete_runtime_profile(self, log, template_id):
        creds = await credentials.get_cached()
        if not creds or creds.get("login_error") or creds.get("config_error"):
            return False, {
                "message": "No credentials found or user not logged in",
                "error": {"code": 401, "message": "No credentials found or user not logged in"}
            }
        project_id = creds["project_id"]
        region_id = creds["region_id"]
        expected_prefix = (
            f"projects/{project_id}/locations/{region_id}/sessionTemplates/"
        )
        if not template_id.startswith(expected_prefix):
            return False, {
                "message": f"Invalid templateId. Must belong to project '{project_id}' and region '{region_id}'",
                "error": {"code": 400, "message": "Invalid templateId prefix"}
            }
        access_token = creds["access_token"]
        dataproc_url = await urls.gcp_service_url(DATAPROC_SERVICE_NAME)
        api_endpoint = f"{dataproc_url}v1/{template_id}"

        headers = {
            "Content-Type": CONTENT_TYPE,
            "Authorization": f"Bearer {access_token}",
        }

        async with aiohttp.ClientSession() as session:
            async with session.delete(api_endpoint, headers=headers) as response:
                if response.status in [200, 204]:
                    return True, None
                else:
                    error_msg = await response.text()
                    log.error(f"Error deleting runtime profile: {error_msg}")
                    try:
                        error_json = json.loads(error_msg)
                        code = error_json.get("error", {}).get("code", response.status)
                        message = error_json.get("error", {}).get("message", error_msg)
                    except Exception:
                        code = response.status
                        message = error_msg
                    return False, {
                        "message": "Failed to delete profile",
                        "error": {"code": code, "message": message}
                    }


runtime_profile_service = RuntimeProfileService()
