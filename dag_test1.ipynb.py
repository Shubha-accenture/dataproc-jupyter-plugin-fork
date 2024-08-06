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



start_cluster_1 = PythonOperator(
    task_id='start_cluster_1',
    python_callable=get_cluster_state_start_if_not_running,
    retries= 2,
    op_args=['cluster-9a5a'],
    provide_context=True,
    dag=dag)


write_output_task_1 = PythonOperator(
    task_id='generate_output_file_1',
    python_callable=create_unique_output_file_path,
    provide_context=True,  
    op_kwargs={'run_id': '{{run_id}}', 'task_id':'generate_output_file_1','output_notebook':'gs://us-central1-multinode-sched-5c1e56e9-bucket/dataproc-output/testcluster/output-notebooks/testcluster_'},   
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
            'main_python_file_uri': 'gs://us-central1-multinode-sched-5c1e56e9-bucket/dataproc-notebooks/wrapper_papermill.py',
             'args' : get_notebook_args('gs://us-central1-multinode-sched-5c1e56e9-bucket/dataproc-notebooks/testcluster/input_notebooks/test1.ipynb', '', 'generate_output_file_1')
        },
    },
    gcp_conn_id='google_cloud_default',  # Reference to the GCP connection
    retries = 0,
    dag=dag,
)

