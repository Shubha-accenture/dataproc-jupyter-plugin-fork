from typing import Dict
import fsspec
import nbconvert
import nbformat
from nbconvert.preprocessors import CellExecutionError, ExecutePreprocessor
from jupyter_scheduler.models import JobFeature
from jupyter_scheduler.parameterize import add_parameters
from jupyter_scheduler.executors import ExecutionManager
import subprocess
from dataproc_jupyter_plugin.handlers import get_cached_credentials

class CustomExecutionManager(ExecutionManager):
    """Default execution manager that executes notebooks"""
    print("-> CustomExecutionManager")
    @staticmethod
    def uploadToGcloud():
        print("gcloud")
        credentials = get_cached_credentials()

    # Check if the access token is available
        if 'region' in credentials:
            region = credentials['region']
            print(region)
            cmd = "gcloud beta composer environments storage dags import --environment composer3  --location"+region+"--source='dagTemplates/clusterDagTemplate.py'"
            process = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, shell=True)
            output, _ = process.communicate()
            print(process.returncode,_,output)
    @staticmethod
    def uploadInputFileToGcs(nb):
        print("gcloud upload")
        cmd = f"gsutil cp '{nb}' gs://dataproc-extension"
        process = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, shell=True)
        output, _ = process.communicate()
        print(process.returncode,_,output)
    def execute(self):
        print("-> CustomExecutionManager: Execute ")
        
        job = self.model
        print(self)
        print(job.input_filename)
        with open(self.staging_paths["input"], encoding="utf-8") as f:
            nb = nbformat.read(f, as_version=4)

        self.uploadInputFileToGcs(nb)
        # prepareDag()

        if job.parameters:
            nb = add_parameters(nb, job.parameters)
            print(job.parameters)
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
            self.uploadToGcloud()
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
