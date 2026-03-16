# Copyright 2024 Google LLC
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
from dataproc_jupyter_plugin.commons.constants import CONTENT_TYPE


class GoogleCloudService:
    def __init__(self, credentials, project_id, service_name, api_version):
        self.credentials = credentials
        self.project_id = project_id
        self.service_name = service_name
        self.api_version = api_version
        self.client_session = aiohttp.ClientSession()

    def create_headers(self):
        if not self.credentials or "access_token" not in self.credentials:
            raise ValueError("Missing required credentials")
        return {
            "Content-Type": CONTENT_TYPE,
            "Authorization": f"Bearer {self.credentials['access_token']}",
        }

    async def _get(self, url):
        async with self.client_session.get(url, headers=self.create_headers()) as response:
            if response.status == 200:
                return await response.json()
            else:
                raise Exception(
                    f"Error response from service: {response.reason} {await response.text()}"
                )
