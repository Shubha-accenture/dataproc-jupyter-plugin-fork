from datetime import datetime, timedelta
from airflow import DAG
from airflow.providers.google.cloud.operators.dataproc import DataprocSubmitJobOperator

yesterday = datetime.combine(
    datetime.today() - timedelta(1),
    datetime.min.time())

default_args = {
    'owner': 'airflow',
    'start_date': yesterday,
    'retries': 1,
    'retry_delay': timedelta(minutes=5),
}
input_notebook = "gs://dag_inputs/sample_notebook.ipynb"
output_notebook = "gs://dag_inputs/"+'{{name}}_{{job_id}}'+"output.ipynb"
notebook_args= [input_notebook, output_notebook] 

dag = DAG(
    '{{name}}', 
    default_args=default_args,
    description='{{name}}',
    schedule_interval=timedelta(days=1),
)

submit_pyspark_job = DataprocSubmitJobOperator(
    task_id='submit_pyspark_job',
    project_id='{{gcpProjectId}}',  # This parameter can be overridden by the connection
    region='{{gcpRegion}}',  # This parameter can be overridden by the connection 
    job={
        'reference': {'project_id': '{{gcpProjectId}}', 'job_id': '{{job_id}}'},
        'placement': {'cluster_name': 'cluster-9a5a'},
        'pyspark_job': {
            'main_python_file_uri': '{{inputFilePath}}'
        },
    },
    gcp_conn_id='google_cloud_default',  # Reference to the GCP connection
    dag=dag,
)
