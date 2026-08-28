import tornado
import json
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
                self.finish({"error": "pageSize must be an integer"})
                return

            resp, error = await runtime_profile_service.list_runtime_profiles(
                self.log, page_token, page_size
            )
            if error:
                self.finish({"error": error})
                return

            self.finish(resp)
        except Exception as e:
            self.log.exception(f"Error fetching runtime profiles")
            self.set_status(500)
            self.finish({"error": str(e)})

    @tornado.web.authenticated
    async def delete(self):
        try:
            template_id = self.get_argument("templateId", default="")
            if not template_id:
                self.set_status(400)
                self.finish({"error": "templateId is required"})
                return

            success, error = await runtime_profile_service.delete_runtime_profile(
                self.log, template_id
            )
            if error:
                self.finish({"error": error})
                return

            self.finish({"success": True})
        except Exception as e:
            self.log.exception(f"Error deleting runtime profile")
            self.set_status(500)
            self.finish({"error": str(e)})


class RuntimeProfileActiveSessionsController(APIHandler):
    @tornado.web.authenticated
    async def get(self):
        try:
            template_id = self.get_argument("templateId", default="")
            if not template_id:
                self.set_status(400)
                self.finish({"error": "templateId is required"})
                return

            data, error = await runtime_profile_service.get_active_sessions_count(
                self.log, template_id
            )
            if error:
                self.finish({"error": error})
                return

            self.finish(data)
        except Exception as e:
            self.log.exception(f"Error fetching active sessions count")
            self.set_status(500)
            self.finish({"error": str(e)})
