import json
import tornado
from google.api_core.exceptions import GoogleAPICallError
from jupyter_server.base.handlers import APIHandler
from dataproc_jupyter_plugin.services.dataproc import DataprocService

class DeleteClusterController(APIHandler):
    @tornado.web.authenticated
    async def delete(self):
        try:
            cluster_name = self.get_argument("cluster")
            service = DataprocService()
            result = await service.delete_cluster(cluster_name)
            self.finish(result)
        except GoogleAPICallError as e:
            self.log.exception("Google API Error deleting cluster")
            self.set_status(e.code)
            self.finish({"message": str(e), "error": {"code": e.code, "message": str(e)}})
        except ValueError as e:
            self.log.exception("Configuration Error")
            self.set_status(400)
            self.finish({"message": str(e), "error": {"code": 400, "message": str(e)}})
        except Exception as e:
            self.log.exception("Error deleting cluster")
            self.set_status(500)
            self.finish({"message": str(e), "error": {"code": 500, "message": str(e)}})
