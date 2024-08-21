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
import os
from airflow import DAG
from airflow.providers.google.cloud.operators.dataproc import DataprocCreateBatchOperator
from airflow.providers.google.cloud.operators.dataproc import DataprocSubmitJobOperator
from airflow.operators.python_operator import PythonOperator
from google.cloud import dataproc_v1
from google.api_core.client_options import ClientOptions
from airflow.providers.google.cloud.operators.bigquery import BigQueryInsertJobOperator
from airflow.providers.google.cloud.hooks.gcs import GCSHook
from airflow.utils.dates import days_ago


default_args = {
    'owner': 'saranyal',
    'start_date': '2024-08-20 00:00:00', 
    'email': None, 
    'email_on_failure': 'False',     
    'email_on_retry': 'False',      
    'email_on_success':'False'
}

time_zone = ''

dag = DAG(
    'test-sql-flow2', 
    default_args=default_args,
    description='test-sql-flow2',
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

 


service_account = 'accenture-eng-test@dataproc-jupyter-extension-dev.iam.gserviceaccount.com'

# Function to read the SQL query from GCS
def read_sql_query_from_gcs(gcs_path,service_account, **kwargs):
    if gcs_path.startswith('gs://'):
        gcs_path = gcs_path[5:]
    bucket_name, object_name = gcs_path.split('/', 1)
    
    gcs_hook = GCSHook(impersonate_service_account=service_account)
    
    sql_query_bytes = gcs_hook.download(bucket_name, object_name)
    sql_query = sql_query_bytes.decode('utf-8')
    return sql_query


# Function to prepare the BigQuery configuration
def prepare_bigquery_config(id,projectId,datasetId,tableId,writeDisposition, **kwargs):
    ti = kwargs['ti']
    sql_query = ti.xcom_pull(task_ids=f'read_sql_query_{id}')
    config = {
        "query": {
            "query": sql_query,
            "useLegacySql": False,
            "destinationTable": {
               "projectId": projectId,
                "datasetId": datasetId,
                "tableId": tableId,
            },
           "writeDisposition": writeDisposition,
        }
    }
    ti.xcom_push(key='bigquery_config', value=config)
    return config
   
    # Task to read the SQL query from GCS
read_sql_query_task_2 = PythonOperator(
    task_id='read_sql_query_2',
    python_callable=read_sql_query_from_gcs,
    op_kwargs={'gcs_path': 'gs://us-central1-multinode-sched-5c1e56e9-bucket/dataproc-notebooks/test-sql-flow2/input_notebooks/sqlfile.sql', 'service_account':'accenture-eng-test@dataproc-jupyter-extension-dev.iam.gserviceaccount.com'},
    provide_context=True,
    dag=dag,
)


# Task to prepare the BigQuery configuration
prepare_config_task_2 = PythonOperator(
    task_id='prepare_config_2',
    python_callable=prepare_bigquery_config,
    op_kwargs={'id': '2','projectId': 'dataproc-jupyter-extension-dev', 'datasetId': 'test_dataset', 'tableId': 'games_post_wide_updated', 'writeDisposition':'WRITE_APPEND'},
    provide_context=True,
    dag=dag,
)


# Function to get the BigQuery configuration from XCom
def run_bigquery_insert_job_2(**kwargs):
    ti = kwargs['ti']
    config = ti.xcom_pull(task_ids='prepare_config_2', key='bigquery_config')
    insert_job = BigQueryInsertJobOperator(
        task_id='run_query_2',
        configuration=config,
        
        impersonation_chain=service_account,
        dag=kwargs['dag'],
    )
    insert_job.execute(context=kwargs)

# Task to run the BigQuery job
run_query_task_2 = PythonOperator(
    task_id='run_query_task_2',
    python_callable=run_bigquery_insert_job_2,
    provide_context=True,
    dag=dag,
)
[read_sql_query_task_2 >>prepare_config_task_2 >> run_query_task_2]