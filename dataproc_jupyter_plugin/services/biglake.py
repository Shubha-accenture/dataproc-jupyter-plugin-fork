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

import json
from dataproc_jupyter_plugin.commons.google_cloud_service import GoogleCloudService
from dataproc_jupyter_plugin.commons.constants import BIGLAKE_SERVICE_NAME


class BigLakeService(GoogleCloudService):
    def __init__(self):
        super().__init__(
            credentials=None,
            project_id=None,
            service_name=BIGLAKE_SERVICE_NAME,
            api_version="v1",
        )

    async def list_catalogs(self, credentials, project_id):
        self.project_id = project_id
        self.credentials = credentials
        url = f"https://biglake.googleapis.com/iceberg/v1/restcatalog/extensions/projects/{self.project_id}/catalogs"
        return await self._get(url)
