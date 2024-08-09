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

from collections import defaultdict, deque
import os
import shutil
import subprocess
import uuid
from datetime import datetime, timedelta

import aiohttp
import pendulum
from google.cloud.jupyter_config.config import gcp_account
from jinja2 import Environment, PackageLoader, select_autoescape
import networkx as nx

from dataproc_jupyter_plugin import urls
from dataproc_jupyter_plugin.commons.commands import async_run_gsutil_subcommand
from dataproc_jupyter_plugin.commons.constants import (
    COMPOSER_SERVICE_NAME,
    CONTENT_TYPE,
    GCS,
    PACKAGE_NAME,
    WRAPPER_PAPPERMILL_FILE,
)
from dataproc_jupyter_plugin.models.models import DescribeJob
from dataproc_jupyter_plugin.services import airflow

unique_id = str(uuid.uuid4().hex)
job_id = ""
job_name = ""
TEMPLATES_FOLDER_PATH = "dagTemplates"
TEMPLATES_FOLDER_PATH_SERVERLESS = "dagTemplates/serverless"
TEMPLATES_FOLDER_PATH_CLUSTER = "dagTemplates/cluster"



ROOT_FOLDER = PACKAGE_NAME


class Client:
    client_session = aiohttp.ClientSession()

    def __init__(self, credentials, log, client_session):
        self.log = log
        if not (
            ("access_token" in credentials)
            and ("project_id" in credentials)
            and ("region_id" in credentials)
        ):
            self.log.exception("Missing required credentials")
            raise ValueError("Missing required credentials")
        self._access_token = credentials["access_token"]
        self.project_id = credentials["project_id"]
        self.region_id = credentials["region_id"]
        self.airflow_client = airflow.Client(credentials, log, client_session)

    def create_headers(self):
        return {
            "Content-Type": CONTENT_TYPE,
            "Authorization": f"Bearer {self._access_token}",
        }

    async def get_bucket(self, runtime_env):
        try:
            composer_url = await urls.gcp_service_url(COMPOSER_SERVICE_NAME)
            api_endpoint = f"{composer_url}v1/projects/{self.project_id}/locations/{self.region_id}/environments/{runtime_env}"
            headers = self.create_headers()
            async with self.client_session.get(
                api_endpoint, headers=headers
            ) as response:
                if response.status == 200:
                    resp = await response.json()
                    gcs_dag_path = resp.get("storageConfig", {}).get("bucket", "")
                    return gcs_dag_path
                else:
                    raise Exception(
                        f"Error getting composer bucket: {response.reason} {await response.text()}"
                    )
        except Exception as e:
            self.log.exception(f"Error getting bucket name: {str(e)}")
            raise Exception(f"Error getting composer bucket: {str(e)}")

    async def check_file_exists(self, bucket, file_path):
        try:
            cmd = f"gsutil ls gs://{bucket}/dataproc-notebooks/{file_path}"
            await async_run_gsutil_subcommand(cmd)
            return True
        except subprocess.CalledProcessError as error:
            self.log.exception(f"Error checking papermill file: {error.decode()}")
            raise IOError(error.decode)

    async def upload_papermill_to_gcs(self, gcs_dag_bucket):
        env = Environment(
            loader=PackageLoader(PACKAGE_NAME, "dagTemplates"),
            autoescape=select_autoescape(["py"]),
        )
        wrapper_papermill_path = env.get_template("wrapper_papermill.py").filename
        try:
            cmd = f"gsutil cp '{wrapper_papermill_path}' gs://{gcs_dag_bucket}/dataproc-notebooks/"
            await async_run_gsutil_subcommand(cmd)
            self.log.info("Papermill file uploaded to gcs successfully")
        except subprocess.CalledProcessError as error:
            self.log.exception(
                f"Error uploading papermill file to gcs: {error.decode()}"
            )
            raise IOError(error.decode)

    async def upload_input_file_to_gcs(self, input, gcs_dag_bucket, job_name):
        try:
            cmd = f"gsutil cp './{input}' gs://{gcs_dag_bucket}/dataproc-notebooks/{job_name}/input_notebooks/"
            await async_run_gsutil_subcommand(cmd)
            self.log.info("Input file uploaded to gcs successfully")
        except subprocess.CalledProcessError as error:
            self.log.exception(f"Error uploading input file to gcs: {error.decode()}")
            raise IOError(error.decode)
        
    async def get_execution_order(self,job,edges,cluster_stop_dict):
         #creating execution order based on the tasks  
        dependencies = defaultdict(list)
        node_without_dependencies = []
        order_of_execution = []
        for u, v in edges:
            dependencies[u].append(v)
            if u == '0':
                 node_without_dependencies.append(v)
                 
        node_exec_list = []
        for nodes in node_without_dependencies:
            if dependencies[nodes]:
                  continue
            else:
                node_data = next((n for n in job.nodes if n.get('id',{}) == nodes), None)
                if node_data and node_data.get('data', {}).get('nodeType') == 'Serverless':
                    node_exec_list.append(f"write_output_task_{nodes} >> create_batch_{nodes}")
                elif node_data and node_data.get('data', {}).get('nodeType') == 'Cluster':
                    node_exec_list.append(f"start_cluster_{nodes} >> write_output_task_{nodes} >> submit_pyspark_job_{nodes}")
        if node_exec_list:
            order_of_execution.append(f"[{', '.join(node_exec_list)}]")
        for node, deps in dependencies.items():
            dep_str_list = []
            node_type = next((n for n in job.nodes if n.get('id',{}) == node), {}).get('data', {}).get('nodeType')
            for dep in deps:
                node_data = next((n for n in job.nodes if n.get('id',{}) == dep), None)
                if node_data and node_data.get('data', {}).get('nodeType') == 'Serverless':
                    dep_str_list.append(f"write_output_task_{dep} >> create_batch_{dep}")
                elif node_data and node_data.get('data', {}).get('nodeType') == 'Cluster':
                    dep_str_list.append(f"start_cluster_{dep} >> write_output_task_{dep} >> submit_pyspark_job_{dep}")
            if len(dep_str_list) > 1:
                dep_str = ', '.join(dep_str_list)
                if node_type == 'Serverless':
                    order_of_execution.append(f"write_output_task_{node} >> create_batch_{node} >> [{dep_str}]")
                elif node_type == 'Cluster':
                    order_of_execution.append(f"start_cluster_{node} >> write_output_task_{node} >> submit_pyspark_job_{node} >> [{dep_str}]")
            else:
                if dep_str_list:
                    dep_str = dep_str_list[0]
                    if node_type == 'Serverless':
                        order_of_execution.append(f"write_output_task_{node} >> create_batch_{node} >> {dep_str}")
                    elif node_type == 'Cluster':
                        order_of_execution.append(f"start_cluster_{node} >> write_output_task_{node} >> submit_pyspark_job_{node} >> {dep_str}")
                
   
        final_order = '\n'.join(order_of_execution)
        if len(cluster_stop_dict) > 0:
            final_order += ' >> stop_cluster'
        return final_order


    async def prepare_dag(self, job, gcs_dag_bucket, dag_file, execution_order, edges):
        self.log.info("Generating dag file")
        DAG_TEMPLATE_CLUSTER_V1 = "pysparkJobTemplate-v1.txt"
        DAG_TEMPLATE_SERVERLESS_V1 = "pysparkBatchTemplate-v1.txt"
        DAG_TEMPLATE_CLUSTER_V2 = "pysparkJobTemplate-v2.txt"
        DAG_TEMPLATE_SERVERLESS_V2 = "pysparkBatchTemplate-v2.txt"
        DAG_TEMPLATE_JOB_V1 = "commonTemplate-step-1-v1.txt"
        DAG_TEMPLATE_SERVERLESS_V3 = "pysparkBatchTemplate-step-2-v3.txt"
        DAG_TEMPLATE_CLUSTER_V3 = "pysparkJobTemplate-step-2-v3.txt"
        DAG_TEMPLATE_BIGQUERY_V3 = "bigquerySqlTemplate-step-2-v3.txt"

        environment = Environment(
            loader=PackageLoader("dataproc_jupyter_plugin", TEMPLATES_FOLDER_PATH)
        )
        environment_serverless = Environment(
            loader=PackageLoader("dataproc_jupyter_plugin", TEMPLATES_FOLDER_PATH_SERVERLESS)
        )
        environment_cluster = Environment(
            loader=PackageLoader("dataproc_jupyter_plugin", TEMPLATES_FOLDER_PATH_CLUSTER)
        )
        #getting the common values needed for dag generation
        gcp_project_id = self.project_id
        gcp_region_id = self.region_id
        user = gcp_account()
        owner = user.split("@")[0]  
        if job.nodes[0]['data']['scheduleValue'] == "":
            schedule_interval = "@once"
        else:
            schedule_interval = job.nodes[0]['data']['scheduleValue']
        print('dataaaaaa', job.nodes[0]['data']['timeZone'])
        if job.nodes[0]['data']['timeZone'] == "":
            yesterday = datetime.combine(
                datetime.today() - timedelta(1), datetime.min.time()
            )
            start_date = yesterday
            time_zone = ""
        else:
            yesterday = pendulum.now().subtract(days=1)
            desired_timezone = job.nodes[0]['data']['timeZone']
            dag_timezone = pendulum.timezone(desired_timezone)
            start_date = yesterday.replace(tzinfo=dag_timezone)
            time_zone = job.nodes[0]['data']['timeZone']
        current_year = datetime.now().year


        #checking if the taks has cluster and adds stop cluster state to stop the cluster at the end
        cluster_stop_dict = {}

        for node in job.nodes:
            if node.get('data', {}).get('nodeType') == 'Cluster':
                cluster_name = node.get('data', {}).get('clusterName')
                stop_cluster = node.get('data', {}).get('stopCluster')
                cluster_stop_dict[cluster_name] = stop_cluster

        #generate dag file with common values
        LOCAL_DAG_FILE_LOCATION = f"./scheduled-jobs/{job.job_name}"
        file_path = os.path.join(LOCAL_DAG_FILE_LOCATION, dag_file)
        os.makedirs(LOCAL_DAG_FILE_LOCATION, exist_ok=True)
        common_template = environment.get_template(DAG_TEMPLATE_JOB_V1)
        contents = common_template.render(job,
        owner=owner,scheduleInterval=schedule_interval,timeZone=time_zone, startDate=start_date,year= current_year,gcpProjectId=gcp_project_id,
                    gcpRegion=gcp_region_id,clusterStop =  cluster_stop_dict)
        with open(file_path, mode="w", encoding="utf-8") as message:
            message.write(contents)

        #iterate and generate dag tasks for each node based on node type
        serverless_template = environment_serverless.get_template(DAG_TEMPLATE_SERVERLESS_V3)
        for node in job.nodes:
            node_type = node.get('data', {}).get('nodeType')
            id = node.get('id',{})
            if node_type != 'Trigger':
                input_file = node.get('data', {}).get('inputFile', '')
                if not input_file.startswith(GCS):
                    await self.upload_input_file_to_gcs( 
                    input_file, gcs_dag_bucket, job_name
                )
                parameters = "\n".join(item.replace(":", ": ") for item in node.get('data', {}).get('parameter', []))
                
                if node_type == 'Serverless' or node_type == 'Bigquery-notebooks':
                    serverless_config = node.get('data', {}).get('serverless', {})
                    print(node.get('data', {}).get('retryCount', {}))
                    phs_path = (
                        serverless_config.get("environmentConfig", {})
                        .get("peripheralsConfig", {})
                        .get("sparkHistoryServerConfig", {})
                        .get("dataprocCluster", "")
                    )
                    serverless_name = (
                        serverless_config.get("jupyterSession", {})
                        .get("displayName", "")
                    )
                    custom_container = (
                        serverless_config.get("runtimeConfig", {})
                        .get("containerImage", "")
                    )
                    metastore_service = (
                        serverless_config.get("environmentConfig", {})
                        .get("peripheralsConfig", {})
                        .get("metastoreService", "")
                    )
                    version = (
                        serverless_config.get("runtimeConfig", {})
                        .get("version", "")
                    )
                    input_notebook = (
                        f"gs://{gcs_dag_bucket}/dataproc-notebooks/{job_name}/input_notebooks/{input_file}"
                        if not input_file.startswith("gs://") else input_file
                    )
                    content = serverless_template.render(
                        job,
                        id = id,
                        inputFilePath=f"gs://{gcs_dag_bucket}/dataproc-notebooks/wrapper_papermill.py",
                        inputFile=input_file,
                        gcpProjectId=gcp_project_id,
                        gcpRegion=gcp_region_id,
                        inputNotebook=input_notebook,
                        outputNotebook=f"gs://{gcs_dag_bucket}/dataproc-output/{job.job_name}/output-notebooks/{job.job_name}_",
                        scheduleInterval=schedule_interval,
                        parameters=parameters,
                        phsPath=phs_path,
                        serverlessName=serverless_name,
                        customContainer=custom_container,
                        metastoreService=metastore_service,
                        version=version,
                        retries = node.get('data', {}).get('retryCount', {})
                    )


                    serverless_file = f"dag_{input_file}.py"
                    with open(serverless_file, mode="w", encoding="utf-8") as message:
                        message.write(content)
                    with open(serverless_file, 'r', encoding='utf-8') as file:
                        lines = file.readlines()
                        if len(lines) > 16:
                            serverless_contents = ''.join(lines[16:])
                        else:
                            serverless_contents = ''.join(lines)
                    with open(file_path, mode="a", encoding="utf-8") as message:
                        message.write(serverless_contents)
                elif node_type == 'Cluster':
                    input_notebook = (
                        f"gs://{gcs_dag_bucket}/dataproc-notebooks/{job_name}/input_notebooks/{input_file}"
                        if not input_file.startswith("gs://") else input_file
                    )
                    cluster_template = environment_cluster.get_template(DAG_TEMPLATE_CLUSTER_V3)
                    content = cluster_template.render(
                    job,
                    id = id,
                    inputFilePath=f"gs://{gcs_dag_bucket}/dataproc-notebooks/wrapper_papermill.py",
                    inputFile = input_file,
                    gcpProjectId=gcp_project_id,
                    gcpRegion=gcp_region_id,
                    inputNotebook=input_notebook,
                    outputNotebook=f"gs://{gcs_dag_bucket}/dataproc-output/{job.job_name}/output-notebooks/{job.job_name}_",
                    parameters=parameters,
                    retries = node.get('data', {}).get('retryCount', {}),
                    clusterName =node.get('data',{}).get('clusterName',{}),
                    stopStatus =node.get('data',{}).get('stopCluster',{})
                    )
                    cluster_file = f"dag_{input_file}.py"
                    with open(cluster_file, mode="w", encoding="utf-8") as message:
                        message.write(content)
                    with open(cluster_file, 'r', encoding='utf-8') as file:
                        lines = file.readlines()
                        if len(lines) > 16:
                            cluster_contents = ''.join(lines[15:])
                        else:
                            cluster_contents = ''.join(lines)
                    with open(file_path, mode="a", encoding="utf-8") as message:
                        message.write(cluster_contents)

        final_order = await self.get_execution_order(job,edges, cluster_stop_dict)
        #creating a folder 'scheduled-jobs' and place the papermill file and dag file
        with open(file_path, mode="a", encoding="utf-8") as message:
            message.write(final_order)
        env = Environment(
            loader=PackageLoader(PACKAGE_NAME, "dagTemplates"),
            autoescape=select_autoescape(["py"]),
        )
        wrapper_papermill_path = env.get_template("wrapper_papermill.py").filename
        shutil.copy2(wrapper_papermill_path, LOCAL_DAG_FILE_LOCATION)
        return file_path

    async def get_topological_order(self,nodes,edges):
    # Create a graph as an adjacency list and a dictionary for in-degrees
        graph = defaultdict(list)
        in_degree = {node: 0 for node in nodes}
        # Build the graph and in-degree dictionary
        for u, v in edges:
            graph[u].append(v)
            in_degree[v] += 1
        # Queue for nodes with no incoming edges
        zero_in_degree_queue = deque([node for node in nodes if in_degree[node] == 0])
        topological_order = []
        levels = defaultdict(list)
        level = 0
        while zero_in_degree_queue:
            level_size = len(zero_in_degree_queue)
            current_level = []
            for _ in range(level_size):
                current_node = zero_in_degree_queue.popleft()
                current_level.append(current_node)
                topological_order.append(current_node)
                for neighbor in graph[current_node]:
                    in_degree[neighbor] -= 1
                    if in_degree[neighbor] == 0:
                        zero_in_degree_queue.append(neighbor)
            levels[level] = current_level
            level += 1
        # Check for cycles (if the graph has a cycle, it cannot be topologically sorted)
        if len(topological_order) == len(nodes):
            return topological_order, levels
        else:
            raise ValueError("The graph has at least one cycle, topological sorting is not possible.")


    async def upload_dag_to_gcs(self, gcs_dag_bucket, file_path):
        try:
            cmd = f"gsutil cp '{file_path}' gs://{gcs_dag_bucket}/dags/"
            await async_run_gsutil_subcommand(cmd)
            self.log.info("Dag file uploaded to gcs successfully")
        except subprocess.CalledProcessError as error:
            self.log.exception(f"Error uploading dag file to gcs: {error.decode()}")
            raise IOError(error.decode)

    async def execute(self, input):
        try:
            job = DescribeJob(**input)
            global job_id
            global job_name
            job_name = job.job_name
            dag_file = f"dag_{job_name}.py"
            gcs_dag_bucket = await self.get_bucket(job.composer_environment_name)
            wrapper_pappermill_file_path = WRAPPER_PAPPERMILL_FILE
            nodes = [node['id'] for node in input['nodes']]

            # Extract edges
            edges = [(edge["source"], edge["target"]) for edge in input['edges']]
            order, execution_order = await self.get_topological_order(nodes, edges)
            file_path = await self.prepare_dag(job, gcs_dag_bucket, dag_file, execution_order, edges)

            if await self.check_file_exists(
                gcs_dag_bucket, wrapper_pappermill_file_path
            ):
                print(
                    f"The file gs://{gcs_dag_bucket}/{wrapper_pappermill_file_path} exists."
                )
            else:
                await self.upload_papermill_to_gcs(gcs_dag_bucket)
                print(
                    f"The file gs://{gcs_dag_bucket}/{wrapper_pappermill_file_path} does not exist."
                )
            await self.upload_dag_to_gcs(gcs_dag_bucket, file_path)         
            return {"status": 0}
        except Exception as e:
            return {"error": str(e)}
     

    async def download_dag_output(
        self, composer_environment_name, bucket_name, dag_id, dag_run_id
    ):
        try:
            await self.airflow_client.list_dag_run_task(
                composer_environment_name, dag_id, dag_run_id
            )
        except Exception as ex:
            return {"error": f"Invalid DAG run ID {dag_run_id}"}
        try:
            cmd = f"gsutil cp 'gs://{bucket_name}/dataproc-output/{dag_id}/output-notebooks/{dag_id}_{dag_run_id}.ipynb' ./"
            await async_run_gsutil_subcommand(cmd)
            self.log.info("Output notebook file downloaded successfully")
            return 0
        except subprocess.CalledProcessError as error:
            self.log.exception(f"Error downloading output notebook file: {str(error)}")
            return {"error": str(error)}
