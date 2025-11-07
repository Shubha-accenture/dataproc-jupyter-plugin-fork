/**
 * @license
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import React, { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { LabIcon } from '@jupyterlab/ui-components';
import LeftArrowIcon from '../../style/icons/left_arrow_icon.svg';
import LabelPropertiesRHF from './labelPropertiesRHF';
import { authApi } from '../utils/utils';
import {
  ARCHIVE_FILES_MESSAGE,
  ARGUMENTS_MESSAGE,
  FILES_MESSAGE,
  JAR_FILE_MESSAGE,
  MAIN_CLASS_MESSAGE,
  MAX_RESTART_MESSAGE,
  QUERY_FILE_MESSAGE,
  RESTART_JOB_URL,
  STATUS_RUNNING
} from '../utils/const';
import errorIcon from '../../style/icons/error_icon.svg';
import { Input } from '../controls/MuiWrappedInput';
import { Autocomplete, TextField } from '@mui/material';
import { MuiChipsInput } from 'mui-chips-input';
import { JobService } from './jobServices';
import { jobSchema, JobFormValues } from './schema';

const iconLeftArrow = new LabIcon({
  name: 'launcher:left-arrow-icon',
  svgstr: LeftArrowIcon
});
const iconError = new LabIcon({
  name: 'launcher:error-icon',
  svgstr: errorIcon
});

function jobKey(selectedJobClone: any) {
  const jobKeys: string[] = [];
  for (const key in selectedJobClone) {
    if (key.endsWith('Job')) {
      jobKeys.push(key);
    }
  }
  return jobKeys;
}

function jobTypeFunction(jobKey: string) {
  switch (jobKey) {
    case 'sparkRJob':
      return 'SparkR';
    case 'pysparkJob':
      return 'PySpark';
    case 'sparkSqlJob':
      return 'SparkSql';
    default:
      return 'Spark';
  }
}

const handleOptionalFields = (selectedJobClone: any, jobTypeKey: string) => {
  const args = selectedJobClone[jobTypeKey]?.args || [];
  const jarFileUris = selectedJobClone[jobTypeKey]?.jarFileUris || [];
  const archiveUris = selectedJobClone[jobTypeKey]?.archiveUris || [];
  const fileUris = selectedJobClone[jobTypeKey]?.fileUris || [];
  const pythonFileUris = selectedJobClone[jobTypeKey]?.pythonFileUris || [];
  const maxFailuresPerHour =
    selectedJobClone.scheduling?.maxFailuresPerHour || '';

  return {
    fileUris,
    jarFileUris,
    args,
    archiveUris,
    pythonFileUris,
    maxFailuresPerHour
  };
};

function SubmitJob({
  setSubmitJobView,
  selectedJobClone,
  clusterResponse
}: any) {
  const [clusterList, setClusterList] = useState([{}]);

  const generateRandomHex = () => {
    const crypto = window.crypto || (window as any).Crypto;
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    const hex = array[0].toString(16);
    return 'job-' + hex.padStart(8, '0');
  };

  const getInitialValues = (): JobFormValues => {
    if (Object.keys(selectedJobClone).length === 0) {
      return {
        cluster: '',
        jobId: generateRandomHex(),
        jobType: 'Spark',
        maxRestarts: '',
        properties: [],
        labels: [],
        mainClass: ''
      } as JobFormValues;
    }

    const jobKeys = jobKey(selectedJobClone);
    const jobTypeKey = jobKeys[0];
    const jobType = jobTypeFunction(jobTypeKey);

    const {
      fileUris,
      jarFileUris,
      args,
      archiveUris,
      pythonFileUris,
      maxFailuresPerHour
    } = handleOptionalFields(selectedJobClone, jobTypeKey);

    const baseValues = {
      cluster: selectedJobClone.placement?.clusterName || '',
      jobId: generateRandomHex(),
      jobType: jobType as any,
      maxRestarts: maxFailuresPerHour,
      properties: selectedJobClone[jobTypeKey]?.properties
        ? Object.entries(selectedJobClone[jobTypeKey].properties).map(
            ([k, v]) => ({
              key: k,
              value: v as string
            })
          )
        : [],
      labels: selectedJobClone.labels
        ? Object.entries(selectedJobClone.labels).map(([k, v]) => ({
            key: k,
            value: v as string
          }))
        : []
    };

    if (jobType === 'Spark') {
      const mainJarFileUri = selectedJobClone[jobTypeKey]?.mainJarFileUri || '';
      const mainClass = selectedJobClone[jobTypeKey]?.mainClass || '';
      return {
        ...baseValues,
        mainClass: mainJarFileUri || mainClass,
        jarFiles: jarFileUris,
        files: fileUris,
        archives: archiveUris,
        args: args
      } as JobFormValues;
    } else if (jobType === 'SparkR') {
      return {
        ...baseValues,
        mainRFile: selectedJobClone[jobTypeKey]?.mainRFileUri || '',
        files: fileUris,
        args: args
      } as JobFormValues;
    } else if (jobType === 'PySpark') {
      return {
        ...baseValues,
        mainPythonFile: selectedJobClone[jobTypeKey]?.mainPythonFileUri || '',
        pythonFiles: pythonFileUris,
        jarFiles: jarFileUris,
        files: fileUris,
        archives: archiveUris,
        args: args
      } as JobFormValues;
    } else if (jobType === 'SparkSql') {
      const hasQueryFile = selectedJobClone[jobTypeKey]?.queryFileUri;
      const hasQueryList = selectedJobClone[jobTypeKey]?.queryList;
      return {
        ...baseValues,
        querySource: hasQueryFile ? 'Query file' : 'Query text',
        queryFile: hasQueryFile || '',
        queryText: hasQueryList?.queries?.[0] || '',
        jarFiles: jarFileUris,
        parameters: []
      } as JobFormValues;
    }

    return baseValues as JobFormValues;
  };

  const {
    control, // Manages all component state
    handleSubmit, // Wraps your submit function
    watch, // Lets you "watch" a field to conditionally render
    setValue, // We need this to set the initial Job ID
    formState: { errors, isValid } // Gives you all errors and valid status
  } = useForm<JobFormValues>({
    resolver: zodResolver(jobSchema),
    mode: 'onChange', // Validates as the user types
    defaultValues: getInitialValues()
  });

  // Watch the 'jobType' field so we can conditionally render the UI
  const jobTypeSelected = watch('jobType');
  const querySourceSelected = watch('querySource');

  useEffect(() => {
    const transformClusterListData = clusterResponse
      .filter((data: any) => data.status === STATUS_RUNNING)
      .map((obj: { clusterName: string }) => obj.clusterName);
    setClusterList(transformClusterListData);
  }, [clusterResponse]);

  // Reset fields when job type changes
  useEffect(() => {
    if (jobTypeSelected === 'Spark') {
      setValue('files', []);
      setValue('jarFiles', []);
      setValue('archives', []);
      setValue('args', []);
    } else if (jobTypeSelected === 'SparkR') {
      setValue('files', []);
      setValue('args', []);
    } else if (jobTypeSelected === 'PySpark') {
      setValue('pythonFiles', []);
      setValue('jarFiles', []);
      setValue('files', []);
      setValue('archives', []);
      setValue('args', []);
    } else if (jobTypeSelected === 'SparkSql') {
      setValue('jarFiles', []);
      setValue('querySource', 'Query file');
    }
  }, [jobTypeSelected, setValue]);

  const handleCancelJobButton = () => {
    setSubmitJobView(false);
  };

  const handleSubmitJobBackView = () => {
    setSubmitJobView(false);
  };

  const onSubmit = async (data: JobFormValues) => {
    console.log('Data', data);
    const credentials = await authApi();
    if (!credentials) return;

    const labelObject: { [key: string]: string } = {};
    data.labels?.forEach(({ key, value }) => {
      labelObject[key] = value;
    });

    const propertyObject: { [key: string]: string } = {};
    data.properties?.forEach(({ key, value }) => {
      propertyObject[key] = value;
    });

    let jobPayload: any = {};

    if (data.jobType === 'Spark') {
      const isJar = data.mainClass.includes('.jar');
      jobPayload = {
        sparkJob: {
          ...(isJar
            ? { mainJarFileUri: data.mainClass }
            : { mainClass: data.mainClass }),
          ...(propertyObject && { properties: propertyObject }),
          ...(data.archives?.length && { archiveUris: data.archives }),
          ...(data.files?.length && { fileUris: data.files }),
          ...(data.jarFiles?.length && { jarFileUris: data.jarFiles }),
          ...(data.args?.length && { args: data.args })
        }
      };
    } else if (data.jobType === 'SparkR') {
      jobPayload = {
        sparkRJob: {
          mainRFileUri: data.mainRFile,
          ...(propertyObject && { properties: propertyObject }),
          ...(data.files?.length && { fileUris: data.files }),
          ...(data.args?.length && { args: data.args })
        }
      };
    } else if (data.jobType === 'PySpark') {
      jobPayload = {
        pysparkJob: {
          mainPythonFileUri: data.mainPythonFile,
          ...(propertyObject && { properties: propertyObject }),
          ...(data.jarFiles?.length && { jarFileUris: data.jarFiles }),
          ...(data.files?.length && { fileUris: data.files }),
          ...(data.archives?.length && { archiveUris: data.archives }),
          ...(data.args?.length && { args: data.args }),
          ...(data.pythonFiles?.length && { pythonFileUris: data.pythonFiles })
        }
      };
    } else if (data.jobType === 'SparkSql') {
      const parameterObject: { [key: string]: string } = {};
      data.parameters?.forEach(({ key, value }) => {
        parameterObject[key] = value;
      });

      jobPayload = {
        sparkSqlJob: {
          ...(propertyObject && { properties: propertyObject }),
          ...(data.jarFiles?.length && { jarFileUris: data.jarFiles }),
          scriptVariables: parameterObject,
          ...(data.querySource === 'Query file' && {
            queryFileUri: data.queryFile
          }),
          ...(data.querySource === 'Query text' && {
            queryList: { queries: [data.queryText] }
          })
        }
      };
    }

    const payload = {
      projectId: credentials.project_id,
      region: credentials.region_id,
      job: {
        placement: { clusterName: data.cluster },
        statusHistory: [],
        reference: { jobId: data.jobId, projectId: '' },
        ...(data.maxRestarts && {
          scheduling: { maxFailuresPerHour: data.maxRestarts }
        }),
        ...(labelObject && { labels: labelObject }),
        ...jobPayload
      }
    };

    await JobService.submitJobService(payload, data.jobId, credentials);
    setSubmitJobView(false);
  };

  return (
    <div>
      <div className="cluster-details-header">
        <div
          role="button"
          className="back-arrow-icon"
          onClick={() => handleSubmitJobBackView()}
        >
          <iconLeftArrow.react
            tag="div"
            className="icon-white logo-alignment-style"
          />
        </div>
        <div className="cluster-details-title">Submit a job</div>
      </div>
      <div className="submit-job-container">
        <div className="submit-job-label-header">Cluster</div>
        <div>Choose a cluster to run your job in.</div>

        {clusterList.length === 0 ? (
          <Input className="input-style" value="No clusters running" readOnly />
        ) : (
          <div className="select-text-overlay">
            <Controller
              name="cluster"
              control={control}
              render={({ field }) => (
                <Autocomplete
                  {...field}
                  options={clusterList}
                  onChange={(_event, val) => field.onChange(val || '')}
                  renderInput={params => (
                    <TextField
                      {...params}
                      label="Cluster*"
                      // Automatic error handling
                      error={!!errors.cluster}
                      helperText={errors.cluster?.message}
                    />
                  )}
                />
              )}
            />{' '}
          </div>
        )}
        <div className="submit-job-label-header">Job</div>
        <div className="select-text-overlay">
          <Controller
            name="jobId"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                className="submit-job-input-style"
                type="text"
                Label="Job ID*"
              />
            )}
          />
        </div>

        {errors.jobId && (
          <div className="error-key-parent">
            <iconError.react tag="div" className="logo-alignment-style" />
            <div className="error-key-missing">{errors.jobId.message}</div>
          </div>
        )}

        <div className="select-text-overlay">
          <Controller
            name="jobType"
            control={control}
            render={({ field }) => (
              <Autocomplete
                {...field}
                className="project-region-select"
                onChange={(_, val) => field.onChange(val || 'Spark')}
                options={['Spark', 'SparkR', 'SparkSql', 'PySpark']}
                renderInput={params => (
                  <TextField {...params} label="Job type*" />
                )}
              />
            )}
          />
        </div>

        {jobTypeSelected === 'SparkSql' && (
          <div className="select-text-overlay">
            <Controller
              name="querySource"
              control={control}
              render={({ field }) => (
                <Autocomplete
                  {...field}
                  className="project-region-select"
                  onChange={(_, val) => field.onChange(val || 'Query file')}
                  options={['Query file', 'Query text']}
                  renderInput={params => (
                    <TextField {...params} label="Query source type*" />
                  )}
                />
              )}
            />
          </div>
        )}

        {querySourceSelected === 'Query file' &&
          jobTypeSelected === 'SparkSql' && (
            <>
              <div className="select-text-overlay">
                <Controller
                  name="queryFile"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      className="submit-job-input-style"
                      Label="Query file*"
                    />
                  )}
                />
              </div>
              {(errors as any).queryFile?.message && (
                <div className="error-key-parent">
                  <iconError.react tag="div" className="logo-alignment-style" />
                  <div className="error-key-missing">
                    {(errors as any).queryFile.message}
                  </div>
                </div>
              )}
              {!(errors as any).queryFile && (
                <div className="submit-job-message-input">
                  {QUERY_FILE_MESSAGE}
                </div>
              )}
            </>
          )}
        {querySourceSelected === 'Query text' &&
          jobTypeSelected === 'SparkSql' && (
            <>
              <div className="select-text-overlay">
                <Controller
                  name="queryText"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      className="submit-job-input-style"
                      Label="Query text*"
                    />
                  )}
                />
              </div>
              {(errors as any).queryText && (
                <div className="error-key-parent">
                  <iconError.react tag="div" className="logo-alignment-style" />
                  <div className="error-key-missing">
                    {(errors as any).queryText.message}
                  </div>
                </div>
              )}
              <div className="submit-job-message-input">
                The query to execute
              </div>
            </>
          )}
        {jobTypeSelected === 'Spark' && (
          <>
            <div className="select-text-overlay">
              <Controller
                name="mainClass"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    className="submit-job-input-style"
                    Label="Main class or jar*"
                  />
                )}
              />
            </div>
            {(errors as any).mainClass && (
              <div className="error-key-parent">
                <iconError.react tag="div" className="logo-alignment-style" />
                <div className="error-key-missing">
                  {(errors as any).mainClass.message}
                </div>
              </div>
            )}
            {!(errors as any).mainClass && (
              <div className="submit-job-message-input">
                {MAIN_CLASS_MESSAGE}
              </div>
            )}
          </>
        )}
        {jobTypeSelected === 'SparkR' && (
          <>
            <div className="select-text-overlay">
              <Controller
                name="mainRFile"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    className="submit-job-input-style"
                    Label="Main R file*"
                  />
                )}
              />
            </div>
            {(errors as any).mainRFile && (
              <div className="error-key-parent">
                <iconError.react tag="div" className="logo-alignment-style" />
                <div className="error-key-missing">
                  {(errors as any).mainRFile.message}
                </div>
              </div>
            )}
            {!(errors as any).mainRFile && (
              <div className="submit-job-message-input">
                {QUERY_FILE_MESSAGE}
              </div>
            )}
          </>
        )}
        {jobTypeSelected === 'PySpark' && (
          <>
            <div className="select-text-overlay">
              <Controller
                name="mainPythonFile"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    className="submit-job-input-style"
                    Label="Main Python file*"
                  />
                )}
              />
            </div>
            {(errors as any).mainPythonFile && (
              <div className="error-key-parent">
                <iconError.react tag="div" className="logo-alignment-style" />
                <div className="error-key-missing">
                  {(errors as any).mainPythonFile.message}
                </div>
              </div>
            )}
            {!(errors as any).mainPythonFile && (
              <div className="submit-job-message-input">
                {QUERY_FILE_MESSAGE}
              </div>
            )}

            <div className="select-text-overlay">
              <Controller
                name="pythonFiles"
                control={control}
                render={({ field }) => (
                  <MuiChipsInput
                    {...field}
                    className="select-job-style"
                    value={field.value || []}
                    onChange={chips => field.onChange(chips)}
                    inputProps={{ placeholder: '' }}
                    label="Additional python files"
                  />
                )}
              />
            </div>
            {(errors as any).pythonFiles && (
              <div className="error-key-parent">
                <iconError.react tag="div" className="logo-alignment-style" />
                <div className="error-key-missing">
                  {(errors as any).pythonFiles.message}
                </div>
              </div>
            )}
          </>
        )}

        {jobTypeSelected !== 'SparkR' && (
          <>
            <div className="select-text-overlay">
              <Controller
                name="jarFiles"
                control={control}
                render={({ field }) => (
                  <MuiChipsInput
                    {...field}
                    className="select-job-style"
                    value={field.value || []}
                    onChange={chips => field.onChange(chips)}
                    inputProps={{ placeholder: '' }}
                    label="Jar files"
                  />
                )}
              />
            </div>
            {(errors as any).jarFiles && (
              <div className="error-key-parent">
                <iconError.react tag="div" className="logo-alignment-style" />
                <div className="error-key-missing">
                  {(errors as any).jarFiles.message}
                </div>
              </div>
            )}
            {!(errors as any).jarFiles && (
              <div className="submit-job-message">{JAR_FILE_MESSAGE}</div>
            )}
          </>
        )}
        {jobTypeSelected !== 'SparkSql' && (
          <>
            <div className="select-text-overlay">
              <Controller
                name="files"
                control={control}
                render={({ field }) => (
                  <MuiChipsInput
                    {...field}
                    className="select-job-style"
                    value={field.value || []}
                    onChange={chips => field.onChange(chips)}
                    inputProps={{ placeholder: '' }}
                    label="Files"
                  />
                )}
              />
            </div>
            {(errors as any).files && (
              <div className="error-key-parent">
                <iconError.react tag="div" className="logo-alignment-style" />
                <div className="error-key-missing">{(errors as any).files.message}</div>
              </div>
            )}
            {!(errors as any).files && (
              <div className="submit-job-message">{FILES_MESSAGE}</div>
            )}
          </>
        )}

        {(jobTypeSelected === 'Spark' || jobTypeSelected === 'PySpark') && (
          <>
            <div className="select-text-overlay">
              <Controller
                name="archives"
                control={control}
                render={({ field }) => (
                  <MuiChipsInput
                    {...field}
                    className="select-job-style"
                    value={field.value || []}
                    onChange={chips => field.onChange(chips)}
                    inputProps={{ placeholder: '' }}
                    label="Archive files"
                  />
                )}
              />
            </div>
            {(errors as any).archives && (
              <div className="error-key-parent">
                <iconError.react tag="div" className="logo-alignment-style" />
                <div className="error-key-missing">
                  {(errors as any).archives.message}
                </div>
              </div>
            )}
            {!(errors as any).archives && (
              <div className="submit-job-message">{ARCHIVE_FILES_MESSAGE}</div>
            )}
          </>
        )}
        {jobTypeSelected !== 'SparkSql' && (
          <>
            <div className="select-text-overlay">
              <Controller
                name="args"
                control={control}
                render={({ field }) => (
                  <MuiChipsInput
                    {...field}
                    className="select-job-style"
                    value={field.value || []}
                    onChange={chips => field.onChange(chips)}
                    inputProps={{ placeholder: '' }}
                    label="Arguments"
                  />
                )}
              />
            </div>
            {(errors as any).args && (
              <div className="error-key-parent">
                <iconError.react tag="div" className="logo-alignment-style" />
                <div className="error-key-missing">{(errors as any).args.message}</div>
              </div>
            )}
            {!(errors as any).args && (
              <div className="submit-job-message">{ARGUMENTS_MESSAGE}</div>
            )}
          </>
        )}

        {querySourceSelected === 'Query file' &&
          jobTypeSelected === 'SparkSql' && (
            <>
              <div className="submit-job-label-header">Query parameters</div>
              <Controller
                name="parameters"
                control={control}
                render={({ field }) => (
                  <LabelPropertiesRHF
                    value={field.value || []}
                    onChange={field.onChange}
                    error={(errors as any).parameters?.message}
                    buttonText="ADD PARAMETER"
                    selectedJobClone={selectedJobClone}
                  />
                )}
              />
            </>
          )}
        <div className="select-text-overlay">
          <Controller
            name="maxRestarts"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                className="submit-job-input-style"
                Label="Max restarts per hour"
              />
            )}
          />{' '}
        </div>

        <div className="submit-job-message-with-link">
          {MAX_RESTART_MESSAGE}
          <div
            className="submit-job-learn-more"
            onClick={() => {
              window.open(`${RESTART_JOB_URL}`, '_blank');
            }}
          >
            Learn more
          </div>
        </div>

        <div className="submit-job-label-header">Properties</div>
        <Controller
          name="properties"
          control={control}
          render={({ field }) => (
            <LabelPropertiesRHF
              value={field.value || []}
              onChange={field.onChange}
              error={errors.properties?.message}
              buttonText="ADD PROPERTY"
              selectedJobClone={selectedJobClone}
            />
          )}
        />

        <div className="submit-job-label-header">Labels</div>
        <Controller
          name="labels"
          control={control}
          render={({ field }) => (
            <LabelPropertiesRHF
              value={field.value || []}
              onChange={field.onChange}
              error={errors.labels?.message}
              buttonText="ADD LABEL"
              selectedJobClone={selectedJobClone}
            />
          )}
        />
        <div className="job-button-style-parent">
          <div
            className={
              !isValid ? 'submit-button-disable-style' : 'submit-button-style'
            }
          >
            <div
              role="button"
              onClick={handleSubmit(onSubmit)}
              style={{
                opacity: !isValid ? 0.5 : 1,
                pointerEvents: !isValid ? 'none' : 'auto'
              }}
            >
              SUBMIT
            </div>
          </div>
          <div className="job-cancel-button-style">
            <div
              role="button"
              onClick={() => {
                handleCancelJobButton();
              }}
            >
              CANCEL
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SubmitJob;
