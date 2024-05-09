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
    'start_date': '2024-04-23 00:00:00',
    'email': [], 
    'email_on_failure': 'False',     
    'email_on_retry': 'False',     
    'email_on_success':'False'
}
dag = DAG(
    'multiple-check-execution', 
    default_args=default_args,
    description='multiple-check-execution',
    tags =['dataproc_jupyter_plugin'],
    schedule_interval='@once',
    catchup= False
)

def write_output_to_file(run_id,task_id, **kwargs):
    output_file_path = f"gs://us-central1-composer3-e9f34418-bucket/dataproc-output/multiple-check-execution/output-notebooks/multiple-check-execution_{run_id}{task_id}.ipynb"
    print(output_file_path)
    kwargs['ti'].xcom_push(key='output_file_path', value=output_file_path)
    return output_file_path

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

time_zone = ''
stop_cluster_check = 'False'



input_file = 'gs://us-central1-composer3-e9f34418-bucket/dataproc-notebooks/test-serverless/input_notebooks/test1.ipynb'
parameter = ['num1: 3']

write_output_task_0 = PythonOperator(
    task_id='generate_output_file_0',
    python_callable=write_output_to_file,
    provide_context=True,  
    op_kwargs={'run_id': '{{run_id}}', 'task_id':'generate_output_file_0'},  
    dag=dag
)

submit_pyspark_job_0 = DataprocSubmitJobOperator(
    task_id='submit_pyspark_job_0',
    project_id='dataproc-jupyter-extension-dev',  # This parameter can be overridden by the connection
    region='us-central1',  # This parameter can be overridden by the connection 
    job={
        'reference': {'project_id': 'dataproc-jupyter-extension-dev'},
        'placement': {'cluster_name': 'cluster-9a5a'},
        'labels': {'client': 'dataproc-jupyter-plugin'},
        'pyspark_job': {
            'main_python_file_uri': 'gs://us-central1-composer3-e9f34418-bucket/dataproc-notebooks/wrapper_papermill.py',
            'args' : get_notebook_args(input_file,parameter,'generate_output_file_0')
        },
    },
    retries = 0,
    gcp_conn_id='google_cloud_default',  # Reference to the GCP connection
    dag=dag,
)



input_file = 'gs://us-central1-composer3-e9f34418-bucket/dataproc-notebooks/test-serverless/input_notebooks/test2.ipynb'
parameter = []

write_output_task_1 = PythonOperator(
    task_id='generate_output_file_1',
    python_callable=write_output_to_file,
    provide_context=True,  
    op_kwargs={'run_id': '{{run_id}}', 'task_id':'generate_output_file_1'},  
    dag=dag
)

submit_pyspark_job_1 = DataprocSubmitJobOperator(
    task_id='submit_pyspark_job_1',
    project_id='dataproc-jupyter-extension-dev',  # This parameter can be overridden by the connection
    region='us-central1',  # This parameter can be overridden by the connection 
    job={
        'reference': {'project_id': 'dataproc-jupyter-extension-dev'},
        'placement': {'cluster_name': 'cluster-9a5a'},
        'labels': {'client': 'dataproc-jupyter-plugin'},
        'pyspark_job': {
            'main_python_file_uri': 'gs://us-central1-composer3-e9f34418-bucket/dataproc-notebooks/wrapper_papermill.py',
            'args' : get_notebook_args(input_file,parameter,'generate_output_file_1')
        },
    },
    retries = 0,
    gcp_conn_id='google_cloud_default',  # Reference to the GCP connection
    dag=dag,
)



input_file = 'gs://us-central1-composer3-e9f34418-bucket/dataproc-notebooks/test-serverless/input_notebooks/test3.ipynb'
parameter = []

write_output_task_2 = PythonOperator(
    task_id='generate_output_file_2',
    python_callable=write_output_to_file,
    provide_context=True,  
    op_kwargs={'run_id': '{{run_id}}', 'task_id':'generate_output_file_2'},  
    dag=dag
)

submit_pyspark_job_2 = DataprocSubmitJobOperator(
    task_id='submit_pyspark_job_2',
    project_id='dataproc-jupyter-extension-dev',  # This parameter can be overridden by the connection
    region='us-central1',  # This parameter can be overridden by the connection 
    job={
        'reference': {'project_id': 'dataproc-jupyter-extension-dev'},
        'placement': {'cluster_name': 'cluster-9a5a'},
        'labels': {'client': 'dataproc-jupyter-plugin'},
        'pyspark_job': {
            'main_python_file_uri': 'gs://us-central1-composer3-e9f34418-bucket/dataproc-notebooks/wrapper_papermill.py',
            'args' : get_notebook_args(input_file,parameter,'generate_output_file_2')
        },
    },
    retries = 0,
    gcp_conn_id='google_cloud_default',  # Reference to the GCP connection
    dag=dag,
)




write_output_task_0 >> submit_pyspark_job_0 >> write_output_task_1 >> submit_pyspark_job_1 >> write_output_task_2 >> submit_pyspark_job_2



