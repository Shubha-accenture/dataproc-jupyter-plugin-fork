import os
from typing import Dict

import requests
from dataproc_jupyter_plugin.environments import ENVIRONMENT_API
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
import uuid

unique_id = str(uuid.uuid4().hex)
dag_file = f"pysparkTemplate_{unique_id}.py"
def getBucket(runtime_env):
    credentials = get_cached_credentials()
    if 'access_token' and 'project_id' and 'region_id' in credentials:
            access_token = credentials['access_token']
            project_id = credentials['project_id']
            region_id = credentials['region_id']
    api_endpoint = f"{ENVIRONMENT_API}/projects/{project_id}/locations/{region_id}/environments/{runtime_env}"

    headers = {
        'Content-Type': 'application/json',
        'Authorization': f'Bearer {access_token}'
        }
    try:
        response = requests.get(api_endpoint,headers=headers)
        if response.status_code == 200:
                resp = response.json()
                gcs_dag_path = resp.get('config', {}).get('dagGcsPrefix', '')
                return gcs_dag_path
    except Exception as e:
            print(f"Error: {e}")
class CustomExecutionManager(ExecutionManager):
    """Default execution manager that executes notebooks"""
    
    @staticmethod
    def uploadToGcloud(runtime_env):
        credentials = get_cached_credentials()
        if 'region_id' in credentials:
            region = credentials['region_id']
            cmd = f"gcloud beta composer environments storage dags import --environment {runtime_env} --location {region} --source={dag_file}"
            process = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, shell=True)
            output, _ = process.communicate()
        if process.returncode == 0:
            os.remove(dag_file)
    
    @staticmethod
    def uploadInputFileToGcs(input,runtime_env):
        gcs_dag_bucket = getBucket(runtime_env)
        cmd = f"gsutil cp '{input}' "+gcs_dag_bucket
        process = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, shell=True)
        output, _ = process.communicate()
        print(process.returncode,_,output)


    @staticmethod
    def prepareDag(self,runtime_env):
        TEMPLATES_FOLDER_PATH = "dataproc_jupyter_plugin/dagTemplates"
        DAG_TEMPLATE_V1 = "pysparkJobTemplate-v1.py"
        environment = Environment(loader=FileSystemLoader(TEMPLATES_FOLDER_PATH))
        template = environment.get_template(DAG_TEMPLATE_V1)
        credentials = get_cached_credentials()
        gcs_dag_bucket = getBucket(runtime_env)
        if 'project_id' in credentials:
            gcpProjectId = credentials['project_id']
        content = template.render(self.model, inputFilePath= gcs_dag_bucket+"/"+dag_file, gcpProjectId=gcpProjectId)
        with open(dag_file, mode="w", encoding="utf-8") as message:
            message.write(content)

    def execute(self):
        job = self.model
        with open(self.staging_paths["input"], encoding="utf-8") as f:
            nb = nbformat.read(f, as_version=4)

        self.uploadInputFileToGcs(self.staging_paths["input"],job.runtime_environment_name)
        self.prepareDag(self,job.runtime_environment_name)

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
            self.uploadToGcloud(job.runtime_environment_name)

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