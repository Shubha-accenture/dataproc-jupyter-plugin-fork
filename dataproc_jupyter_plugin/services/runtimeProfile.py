import time
import aiohttp
from dataproc_jupyter_plugin import credentials, urls
from dataproc_jupyter_plugin.commons.constants import (
    DATAPROC_SERVICE_NAME,
    CONTENT_TYPE,
)


class RuntimeProfileService:
    def __init__(self):
        self._session = None
        self._creation_time = 0

    async def get_client(self, log):
        if self._session is None or (time.time() - self._creation_time) > 3600:
            if self._session:
                await self._session.close()
            self._session = aiohttp.ClientSession()
            self._creation_time = time.time()
        return self._session

    async def list_runtime_profiles(self, log, page_token="", page_size="50"):
        creds = await credentials.get_cached()
        if not creds:
            return None, "No credentials found"

        project_id = creds["project_id"]
        region_id = creds["region_id"]
        access_token = creds["access_token"]

        dataproc_url = await urls.gcp_service_url(DATAPROC_SERVICE_NAME)
        api_endpoint = f"{dataproc_url}v1/projects/{project_id}/locations/{region_id}/sessionTemplates?pageSize={page_size}"
        if page_token:
            api_endpoint += f"&pageToken={page_token}"

        headers = {
            "Content-Type": CONTENT_TYPE,
            "Authorization": f"Bearer {access_token}",
        }

        session = await self.get_client(log)
        async with session.get(api_endpoint, headers=headers) as response:
            if response.status == 200:
                resp = await response.json()
                return resp, None
            else:
                error_msg = await response.text()
                log.error(f"Error fetching runtime profiles: {error_msg}")
                return None, f"Failed to fetch profiles: {error_msg}"

    async def delete_runtime_profile(self, log, template_id):
        creds = await credentials.get_cached()
        if not creds:
            return False, "No credentials found"

        access_token = creds["access_token"]

        dataproc_url = await urls.gcp_service_url(DATAPROC_SERVICE_NAME)
        api_endpoint = f"{dataproc_url}v1/{template_id}"

        headers = {
            "Content-Type": CONTENT_TYPE,
            "Authorization": f"Bearer {access_token}",
        }

        session = await self.get_client(log)
        async with session.delete(api_endpoint, headers=headers) as response:
            if response.status in [200, 204]:
                return True, None
            else:
                error_msg = await response.text()
                log.error(f"Error deleting runtime profile: {error_msg}")
                return False, f"Failed to delete profile: {error_msg}"

    async def get_active_sessions_count(self, log, template_id):
        creds = await credentials.get_cached()
        if not creds:
            return {"count": 0, "sessionNames": []}, "No credentials found"

        project_id = creds["project_id"]
        region_id = creds["region_id"]
        access_token = creds["access_token"]

        dataproc_url = await urls.gcp_service_url(DATAPROC_SERVICE_NAME)
        # Fetch only active sessions to minimize payload size
        api_endpoint = f"{dataproc_url}v1/projects/{project_id}/locations/{region_id}/sessions?filter=state=ACTIVE"

        headers = {
            "Content-Type": CONTENT_TYPE,
            "Authorization": f"Bearer {access_token}",
        }

        session = await self.get_client(log)
        async with session.get(api_endpoint, headers=headers) as response:
            if response.status == 200:
                resp = await response.json()
                sessions = resp.get("sessions", [])

                count = 0
                session_names = []
                for s in sessions:
                    jupyter_session = s.get("jupyterSession", {})
                    s_template = jupyter_session.get(
                        "sessionTemplate", s.get("sessionTemplate", "")
                    )

                    if s_template == template_id or (
                        template_id and s_template.endswith(template_id)
                    ):
                        count += 1
                        session_name = s.get("name", "")
                        session_id = (
                            session_name.split("/")[-1]
                            if session_name
                            else s.get("uuid", "Unknown")
                        )
                        session_names.append(session_id)
                return {"count": count, "sessionNames": session_names}, None
            else:
                error_msg = await response.text()
                log.error(f"Error fetching active sessions: {error_msg}")
                return {
                    "count": 0,
                    "sessionNames": [],
                }, f"Failed to fetch sessions: {error_msg}"


runtime_profile_service = RuntimeProfileService()
