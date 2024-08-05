# Copyright 2023 Google LLC
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


from datetime import datetime, timedelta, timezone
import uuid
from airflow import DAG
from airflow.providers.google.cloud.operators.dataproc import DataprocCreateBatchOperator
from airflow.providers.google.cloud.operators.dataproc import DataprocSubmitJobOperator
from airflow.operators.python_operator import PythonOperator
from google.cloud import dataproc_v1
from google.api_core.client_options import ClientOptions
import os


default_args = {
    'owner': 'saranyal',
    'start_date': '2024-08-04 00:00:00', 
    'email': None, 
    'email_on_failure': 'False',     
    'email_on_retry': 'False',      
    'email_on_success':'False'
}

time_zone = ''

dag = DAG(
    'test-serverless-execution', 
    default_args=default_args,
    description='test-serverless-execution',
    tags =['dataproc_jupyter_plugin'],
    schedule_interval='@once',
    catchup= False
)

#function to pass input notebook, output notebook path and parameters as arguments to task
def get_notebook_args(input_notebook,parameter,task_id):
    input_notebook = input_notebook
    output_notebook = "{{ ti.xcom_pull(task_ids='" + task_id + "',key='output_file_path') }}"
    notebook_args = [input_notebook, output_notebook]
    parameters_str = '''
    {}
    '''.format(',\n'.join(parameter)).replace('\n', '')
    # Check if parameters is not empty or contains only whitespace
    if parameters_str.strip():  
        notebook_args.extend(["--parameters", parameters_str])
    return notebook_args

def get_client_cert():
    # code to load client certificate and private key.
    return client_cert_bytes, client_private_key_bytes


def get_cluster_state_start_if_not_running(cluster):

    options = ClientOptions(api_endpoint="us-central1-dataproc.googleapis.com:443",
    client_cert_source=get_client_cert)

    # Create a client
    client = dataproc_v1.ClusterControllerClient(client_options=options)

    # Initialize request argument(s)
    request = dataproc_v1.GetClusterRequest(
        project_id='dataproc-jupyter-extension-dev',
        region='us-central1',
        cluster_name=cluster,
    )

    # Make the request
    response = client.get_cluster(request=request)    
   
    # Handle the response
    print(f"State is {response.status.state}")
    if response.status.state in (6, 7):
        print("Cluster is in stopped/stopping state. Starting the cluster")
        request1 = dataproc_v1.StartClusterRequest(
            project_id='dataproc-jupyter-extension-dev',
            region='us-central1',
            cluster_name=cluster,
        )
        operation = client.start_cluster(request=request1)
        print("Waiting for operation to complete...")
        response = operation.result()
        if response.status.state in (2, 5):
            print("Cluster is started succesfully")    
    elif response.status.state in (2, 5):
       print("Cluster is already running")
    else:
        print("Cluster is unavailable")
        raise Exception("Cluster is unavailable")

 
def stop_the_cluster(cluster,stopStatus):
    if stopStatus == 'True':
        options = ClientOptions(api_endpoint="us-central1-dataproc.googleapis.com:443",
            client_cert_source=get_client_cert)
    
        # Create a client
        client = dataproc_v1.ClusterControllerClient(client_options=options)
    
        # Initialize request argument(s)
        request = dataproc_v1.StopClusterRequest(
            project_id='dataproc-jupyter-extension-dev',
            region='us-central1',
            cluster_name=cluster,
        )
    
        # Make the request
        operation = client.stop_cluster(request=request)
        print("Waiting for operation to complete...")
        response = operation.result()
        if response.status.state in (6, 7):
            print("Cluster is stopped succesfully")
    
        # Handle the response
        print(response)

def create_unique_output_file_path(run_id,task_id,output_notebook, **kwargs):
    output_file_path = f"{output_notebook}{run_id}-{task_id}.ipynb"
    print(output_file_path)
    kwargs['ti'].xcom_push(key='output_file_path', value=output_file_path)
    return output_file_path

def stop_multiple_clusters(cluster_stop):
    for cluster, stop in cluster_stop.items():
        stop_the_cluster(cluster, str(stop))



write_output_task_1 = PythonOperator(
    task_id='generate_output_file_1',
    python_callable=create_unique_output_file_path,
    provide_context=True,  
    op_kwargs={'run_id': '{{run_id}}', 'task_id':'generate_output_file_1','output_notebook':'gs://us-central1-multinode-sched-5c1e56e9-bucket/dataproc-output/test-serverless-execution/output-notebooks/test-serverless-execution_'},   
    dag=dag
    )

create_batch_1 = DataprocCreateBatchOperator(
        task_id="batch_create_1",
        project_id = 'dataproc-jupyter-extension-dev',
        region = 'us-central1',
        batch={
            "pyspark_batch": {
                "main_python_file_uri": 'gs://us-central1-multinode-sched-5c1e56e9-bucket/dataproc-notebooks/wrapper_papermill.py',
                'args' : get_notebook_args('gs://us-central1-multinode-sched-5c1e56e9-bucket/dataproc-notebooks/test-serverless-execution/input_notebooks/test1.ipynb','','generate_output_file_1')         
            },
            "environment_config": {
                "peripherals_config": {
                    
                    "spark_history_server_config": {
                        "dataproc_cluster": '',
                    },
                },
            },
            
            "runtime_config": {
                
                
                "version":'2.2'
                
            },
            
        },
        retries = 1,
        batch_id=str(uuid.uuid4()),
        dag = dag,
    )


write_output_task_2 = PythonOperator(
    task_id='generate_output_file_2',
    python_callable=create_unique_output_file_path,
    provide_context=True,  
    op_kwargs={'run_id': '{{run_id}}', 'task_id':'generate_output_file_2','output_notebook':'gs://us-central1-multinode-sched-5c1e56e9-bucket/dataproc-output/test-serverless-execution/output-notebooks/test-serverless-execution_'},   
    dag=dag
    )

create_batch_2 = DataprocCreateBatchOperator(
        task_id="batch_create_2",
        project_id = 'dataproc-jupyter-extension-dev',
        region = 'us-central1',
        batch={
            "pyspark_batch": {
                "main_python_file_uri": 'gs://us-central1-multinode-sched-5c1e56e9-bucket/dataproc-notebooks/wrapper_papermill.py',
                'args' : get_notebook_args('gs://us-central1-multinode-sched-5c1e56e9-bucket/dataproc-notebooks/test-serverless-execution/input_notebooks/test2.ipynb','','generate_output_file_2')         
            },
            "environment_config": {
                "peripherals_config": {
                    
                    "spark_history_server_config": {
                        "dataproc_cluster": '',
                    },
                },
            },
            
            "runtime_config": {
                
                
                "version":'2.2'
                
            },
            
        },
        retries = 1,
        batch_id=str(uuid.uuid4()),
        dag = dag,
    )
create_batch_1 >> write_output_task_2 >> create_batch_2