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

from jupyter_server.base.handlers import APIHandler
import tornado
from dataproc_jupyter_plugin.services.biglake import BigLakeService

class BigLakeCatalogController(APIHandler):
    @tornado.web.authenticated
    async def get(self, project_id):
        try:
            from dataproc_jupyter_plugin import credentials
            
            cached_credentials = await credentials.get_cached()
            biglake_service = BigLakeService()
            catalogs = await biglake_service.list_catalogs(credentials=cached_credentials, project_id=project_id)
            self.finish(catalogs)
        except Exception as e:
            self.log.exception(f"Error fetching BigLake catalogs for project {project_id}")
            self.set_status(500, f"Error fetching BigLake catalogs for project {project_id}: {str(e)}")


