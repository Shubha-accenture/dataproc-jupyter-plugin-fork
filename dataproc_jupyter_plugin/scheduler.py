import multiprocessing as mp
import os
import random
import shutil
from typing import Dict, Optional, Type, Union
from dataproc_jupyter_plugin.handlers import get_cached_credentials

import fsspec
import psutil
from jupyter_core.paths import jupyter_data_dir
from jupyter_server.transutils import _i18n
from jupyter_server.utils import to_os_path
from sqlalchemy import and_, asc, desc, func
from traitlets import Instance
from traitlets import Type as TType
from traitlets import Unicode, default
from traitlets.config import LoggingConfigurable
from jupyter_scheduler.scheduler import Scheduler
import requests

from jupyter_scheduler.models import (

    ListJobsResponse,
    ListJobsQuery,
    DescribeJob,
    SortDirection

)
from jupyter_scheduler.orm import Job, JobDefinition, create_session
from jupyter_scheduler.utils import create_output_directory, create_output_filename

class BaseScheduler(Scheduler):
    """Base class for schedulers. A default implementation
    is provided in the `Scheduler` class, but extension creators
    can provide their own scheduler by subclassing this class.
    By implementing this class, you will replace both the service
    API and the persistence layer for the scheduler.
    """

    # @classmethod
    # def from_json(cls, json_data):
    #     return cls(
    #         input_filename=json_data.get('dag_id'),
    #     )

    def list_jobs(self, query: ListJobsQuery) -> ListJobsResponse:
        print('-----List jobs------')
        # print(self.json())
        credentials = get_cached_credentials()
        if 'access_token' and 'project_id' and 'region_id' in credentials:
            access_token = credentials['access_token']
            project_id = credentials['project_id']
            region_id = credentials['region_id']
        environments = []
        api_endpoint = f"https://b56b51577bc548479916c7b35fb7dd23-dot-us-central1.composer.googleusercontent.com/api/v1/dags"

        headers = {
        'Content-Type': 'application/json',
        'Authorization': f'Bearer {access_token}'
        }
        response = requests.get(api_endpoint,headers=headers)
        if response.status_code == 200:
            resp = response.json()
            print(resp)
        with self.db_session() as session:
            jobs = session.query(Job)
            new_job =  Job()
            print('-----Job query------')
            print(query.json())
            if query.status:
                jobs = jobs.filter(Job.status == query.status)
            if query.job_definition_id:
                jobs = jobs.filter(Job.job_definition_id == query.job_definition_id)
            if query.start_time:
                jobs = jobs.filter(Job.start_time >= query.start_time)
            if query.name:
                jobs = jobs.filter(Job.name.like(f"{query.name}%"))
            if query.tags:
                jobs = jobs.filter(and_(Job.tags.contains(tag) for tag in query.tags))

            total = jobs.count()

            if query.sort_by:
                for sort_field in query.sort_by:
                    direction = desc if sort_field.direction == SortDirection.desc else asc
                    jobs = jobs.order_by(direction(getattr(Job, sort_field.name)))
            next_token = int(query.next_token) if query.next_token else 0
            jobs = jobs.limit(query.max_items).offset(next_token)

            jobs = jobs.all()

        next_token = next_token + len(jobs)
        if next_token >= total:
            next_token = None

        jobs_list = []
        for job in jobs:
            print('----Job structure------')
            # print(job.json())
            model = DescribeJob.from_orm(job)
            print('------Job Model-------')
            print(model.json())
            self.add_job_files(model=model)
            jobs_list.append(model)

    

        print(jobs_list)
        list_jobs_response = ListJobsResponse(
            jobs=jobs_list,
            next_token=next_token,
            total_count=total,
        )
       

        return list_jobs_response
    
