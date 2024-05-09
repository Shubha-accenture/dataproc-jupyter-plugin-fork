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
from airflow import DAG
from airflow.providers.google.cloud.operators.dataproc import DataprocSubmitJobOperator
from airflow.operators.python_operator import PythonOperator
from google.cloud import dataproc_v1
from google.api_core.client_options import ClientOptions

default_args = {
    'owner': 'saranyal',
    'start_date': '2024-04-22 00:00:00',
    'retries': '2',
    'retry_delay': timedelta(minutes=int('5')), 
    'email': [], 
    'email_on_failure': 'False',     
    'email_on_retry': 'False',     
    'email_on_success':'False'
}

def write_output_to_file(run_id, **kwargs):
    output_file_path = f"gs://us-central1-composer3-e9f34418-bucket/dataproc-output/parameter-check/output-notebooks/parameter-check_{run_id}.ipynb"
    print(output_file_path)
    kwargs['ti'].xcom_push(key='output_file_path', value=output_file_path)
    return output_file_path
    
time_zone = ''
stop_cluster_check = 'False'
input_notebook = 'gs://us-central1-composer3-e9f34418-bucket/dataproc-notebooks/parameter-check/input_notebooks/Untitled5.ipynb'
output_notebook = "{{ ti.xcom_pull(task_ids='generate_output_file') }}"
notebook_args = [input_notebook, output_notebook]
parameters = '''
num1:2
'''
notebook_args= [input_notebook, output_notebook] 
# Check if parameters is not empty or contains only whitespace
if parameters.strip():  
     notebook_args.extend(["--parameters", parameters])


def get_client_cert():
    # code to load client certificate and private key.
    return client_cert_bytes, client_private_key_bytes
 

def get_cluster_state_start_if_not_running():

    options = ClientOptions(api_endpoint="us-central1-dataproc.googleapis.com:443",
    client_cert_source=get_client_cert)

    # Create a client
    client = dataproc_v1.ClusterControllerClient(client_options=options)

    # Initialize request argument(s)
    request = dataproc_v1.GetClusterRequest(
        project_id='dataproc-jupyter-extension-dev',
        region='us-central1',
        cluster_name='cluster-9a5a',
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
            cluster_name='cluster-9a5a',
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

 
def stop_the_cluster():
    if 'False' == 'True':
        options = ClientOptions(api_endpoint="us-central1-dataproc.googleapis.com:443",
            client_cert_source=get_client_cert)
    
        # Create a client
        client = dataproc_v1.ClusterControllerClient(client_options=options)
    
        # Initialize request argument(s)
        request = dataproc_v1.StopClusterRequest(
            project_id='dataproc-jupyter-extension-dev',
            region='us-central1',
            cluster_name='cluster-9a5a',
        )
    
        # Make the request
        operation = client.stop_cluster(request=request)
        print("Waiting for operation to complete...")
        response = operation.result()
        if response.status.state in (6, 7):
            print("Cluster is stopped succesfully")
    
        # Handle the response
        print(response)

dag = DAG(
    'parameter-check', 
    default_args=default_args,
    description='parameter-check',
    tags =['dataproc_jupyter_plugin'],
    schedule_interval='@once',
    catchup= False
)


start_cluster = PythonOperator(
    task_id='start_cluster',
    python_callable=get_cluster_state_start_if_not_running,
    retries= 2,
    provide_context=True,
    dag=dag)

write_output_task = PythonOperator(
    task_id='generate_output_file',
    python_callable=write_output_to_file,
    provide_context=True,  
    op_kwargs={'run_id': '{{run_id}}'},  
    dag=dag
)

submit_pyspark_job = DataprocSubmitJobOperator(
    task_id='submit_pyspark_job',
    project_id='dataproc-jupyter-extension-dev',  # This parameter can be overridden by the connection
    region='us-central1',  # This parameter can be overridden by the connection 
    job={
        'reference': {'project_id': 'dataproc-jupyter-extension-dev'},
        'placement': {'cluster_name': 'cluster-9a5a'},
        'labels': {'client': 'dataproc-jupyter-plugin'},
        'pyspark_job': {
            'main_python_file_uri': 'gs://us-central1-composer3-e9f34418-bucket/dataproc-notebooks/wrapper_papermill.py',
            'args' : notebook_args
        },
    },
    gcp_conn_id='google_cloud_default',  # Reference to the GCP connection
    dag=dag,
)

stop_cluster = PythonOperator(
        task_id='stop_cluster',
        python_callable=stop_the_cluster,
        provide_context=True,
        dag=dag)
    
start_cluster >> write_output_task >> submit_pyspark_job >> stop_cluster 
