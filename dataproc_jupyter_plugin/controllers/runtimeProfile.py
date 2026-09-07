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

import tornado
from jupyter_server.base.handlers import APIHandler
from dataproc_jupyter_plugin.services.runtimeProfile import runtime_profile_service


class RuntimeProfileController(APIHandler):
    @tornado.web.authenticated
    async def get(self):
        try:
            page_token = self.get_argument("pageToken", default="")
            page_size = self.get_argument("pageSize", default="50")
            if not page_size.isdigit():
                self.set_status(400)
                self.finish({
                    "message": "pageSize must be an integer",
                    "error": {"code": 400, "message": "pageSize must be an integer"}
                })
                return

            resp, error = await runtime_profile_service.list_runtime_profiles(
                self.log, page_token, page_size
            )
            if error:
                self.set_status(error.get("error", {}).get("code", 500))
                self.finish(error)
                return

            self.finish(resp)
        except Exception as e:
            self.log.exception(f"Error fetching runtime profiles")
            self.set_status(500)
            self.finish({
                "message": "Error fetching runtime profiles",
                "error": {"code": 500, "message": str(e)}
            })

    @tornado.web.authenticated
    async def delete(self):
        try:
            template_id = self.get_argument("templateId", default="")
            if not template_id:
                self.set_status(400)
                self.finish({
                    "message": "templateId is required",
                    "error": {"code": 400, "message": "templateId is required"}
                })
                return

            success, error = await runtime_profile_service.delete_runtime_profile(
                self.log, template_id
            )
            if error:
                self.set_status(error.get("error", {}).get("code", 500))
                self.finish(error)
                return

            self.finish({"success": True})
        except Exception as e:
            self.log.exception(f"Error deleting runtime profile")
            self.set_status(500)
            self.finish({
                "message": "Error deleting runtime profile",
                "error": {"code": 500, "message": str(e)}
            })
