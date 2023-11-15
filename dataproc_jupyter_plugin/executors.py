from typing import Dict
import fsspec
import nbconvert
import nbformat
from nbconvert.preprocessors import CellExecutionError, ExecutePreprocessor
from jupyter_scheduler.models import JobFeature
from jupyter_scheduler.parameterize import add_parameters
from jupyter_scheduler.executors import ExecutionManager

class CustomExecutionManager(ExecutionManager):
    """Default execution manager that executes notebooks"""
    print("-> CustomExecutionManager")
    def execute(self):
        print("-> CustomExecutionManager: Execute ")
        
        job = self.model

        with open(self.staging_paths["input"], encoding="utf-8") as f:
            nb = nbformat.read(f, as_version=4)

        if job.parameters:
            nb = add_parameters(nb, job.parameters)

        ep = ExecutePreprocessor(
            kernel_name=nb.metadata.kernelspec["name"],
            store_widget_state=True,
        )

        try:
            ep.preprocess(nb)
        except CellExecutionError as e:
            raise e
        finally:
            for output_format in job.output_formats:
                cls = nbconvert.get_exporter(output_format)
                output, resources = cls().from_notebook_node(nb)
                with fsspec.open(self.staging_paths[output_format], "w", encoding="utf-8") as f:
                    f.write(output)
            print("<- CustomExecutionManager: Execute ")

    def supported_features(cls) -> Dict[JobFeature, bool]:
        return {
            JobFeature.job_name: True,
            JobFeature.output_formats: True,
            JobFeature.job_definition: False,
            JobFeature.idempotency_token: False,
            JobFeature.tags: False,
            JobFeature.email_notifications: False,
            JobFeature.timeout_seconds: False,
            JobFeature.retry_on_timeout: False,
            JobFeature.max_retries: False,
            JobFeature.min_retry_interval_millis: False,
            JobFeature.output_filename_template: False,
            JobFeature.stop_job: True,
            JobFeature.delete_job: True,
        }

    def validate(cls, input_path: str) -> bool:
        with open(input_path, encoding="utf-8") as f:
            nb = nbformat.read(f, as_version=4)
            try:
                nb.metadata.kernelspec["name"]
            except:
                return False
            else:
                return True
