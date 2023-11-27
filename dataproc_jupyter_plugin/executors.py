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
from jinja2 import Environment, FileSystemLoader


class CustomExecutionManager(ExecutionManager):
    """Default execution manager that executes notebooks"""
    
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
    
    def prepareDag(self):
        TEMPLATES_FOLDER_PATH = "dagTemplates"
        PYSPARK_JOB_TEMPLATE_V1 = "pysparkJobTemplate-v1.py"
        environment = Environment(loader=FileSystemLoader(TEMPLATES_FOLDER_PATH))
        template = environment.get_template(PYSPARK_JOB_TEMPLATE_V1)
        # filename = f"{self.model.input_filename}"
        content = template.render(self)
        # with open(filename, mode="w", encoding="utf-8") as message:
        #     message.write(content)
        #     print(f"... wrote {filename}")

    def execute(self):
        job = self.model
        print(self)
        print(job.input_filename)
        with open(self.staging_paths["input"], encoding="utf-8") as f:
            nb = nbformat.read(f, as_version=4)

        self.uploadInputFileToGcs(nb)
        # prepareDag(self)

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
