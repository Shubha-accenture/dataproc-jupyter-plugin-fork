/**
 * @license
 * Copyright 2024 Google LLC
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
import { Input } from '../controls/MuiWrappedInput';
import LabelProperties from '../jobs/labelProperties';
import { eventEmitter } from '../utils/signalEmitter';
import {
  Autocomplete,
  Box,
  Checkbox,
  CircularProgress,
  FormControlLabel,
  FormGroup,
  TextField,
  Typography
} from '@mui/material';
import { SchedulerService } from './schedulerServices';
import { LabIcon } from '@jupyterlab/ui-components';
import errorIcon from '../../style/icons/error_icon.svg';
import Button from '@mui/material/Button';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
// import EditIconDisable from '../../style/icons/scheduler_edit_dag.svg';

const iconError = new LabIcon({
  name: 'launcher:error-icon',
  svgstr: errorIcon
});

// const iconEditDag = new LabIcon({
//   name: 'launcher:edit-disable-icon',
//   svgstr: EditIconDisable
// });

function ClusterServerlessForm({ data, mode }: any) {
  const [inputFileSelectedLocal, setInputFileSelectedLocal] = useState('');
  const [inputFileValidation, setInputFileValidation] = useState(false);
  const [retryCount, setRetryCount] = useState<number | undefined>(2);
  const [retryDelay, setRetryDelay] = useState<number | undefined>(5);
  const [parameterDetail, setParameterDetail] = useState<any>([]);
  const [parameterDetailUpdated, setParameterDetailUpdated] = useState<any>([]);
  const [keyValidation, setKeyValidation] = useState(-1);
  const [valueValidation, setValueValidation] = useState(-1);
  const [duplicateKeyError, setDuplicateKeyError] = useState(-1);
  const [isLoadingKernelDetail, setIsLoadingKernelDetail] = useState(false);
  const [clusterList, setClusterList] = useState<string[]>([]);
  const [clusterSelected, setClusterSelected] = useState('');
  const [serverlessList, setServerlessList] = useState<string[]>([]);
  const [serverlessDataList, setServerlessDataList] = useState<string[]>([]);
  const [serverlessSelected, setServerlessSelected] = useState('');
  const [stopCluster, setStopCluster] = useState(false);
  const [serviceAccounts, setServiceAccounts] = useState<
    { displayName: string; email: string }[]
  >([]);
  const [serviceAccountSelected, setServiceAccountSelected] = useState('');
  const [editNotebookLoading, setEditNotebookLoading] = useState(false);

  const onInputFileNameChange = (evt: any) => {
    const file = evt.target.files && evt.target.files[0];
    if (file) {
      const fileName = file.name;
      const isIpynbFile = fileName.endsWith('.ipynb');
      setInputFileValidation(!isIpynbFile);
      setInputFileSelectedLocal(evt.target.value);
      eventEmitter.emit(`uploadProgress-cluster`, evt, data);
    }
  };

  const handleRetryCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '') {
      // Handle empty input
      setRetryCount(undefined);
      data.retryCount = 0;
    } else {
      const numberValue = Number(value);
      if (!isNaN(numberValue)) {
        // Handle valid number
        setRetryCount(numberValue);
        data.retryCount = numberValue;
      }
    }
  };

  const handleRetryDelayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '') {
      // Handle empty input
      setRetryDelay(undefined);
      data.retryDelay = 0;
    } else {
      const numberValue = Number(value);
      if (!isNaN(numberValue)) {
        // Handle valid number
        setRetryDelay(numberValue);
        data.retryDelay = numberValue;
      }
    }
  };

  const listClustersAPI = async () => {
    await SchedulerService.listClustersAPIService(
      setClusterList,
      setIsLoadingKernelDetail
    );
  };

  const listSessionTemplatesAPI = async () => {
    await SchedulerService.listSessionTemplatesAPIService(
      setServerlessDataList,
      setServerlessList,
      setIsLoadingKernelDetail
    );
  };
  const handleClusterSelected = (value: any) => {
    if (value) {
      const selectedCluster = value.toString();
      data.clusterName = selectedCluster;
      setClusterSelected(selectedCluster);
    }
  };

  const handleServerlessSelected = (value: any) => {
    if (value) {
      const selectedServerless = value.toString();
      const selectedData: any = serverlessDataList.filter((serverless: any) => {
        return serverless.serverlessName === selectedServerless;
      });
      data.serverless = selectedData[0].serverlessData;
      setServerlessSelected(selectedServerless);
    }
  };

  const handleStopCluster = (event: React.ChangeEvent<HTMLInputElement>) => {
    setStopCluster(event.target.checked);
    data.stopCluster = event.target.checked;
  };

  const handleServiceAccountChange = (
    event: React.ChangeEvent<{}>,
    value: { displayName: string; email: string } | null
  ) => {
    setServiceAccountSelected(value?.displayName || '');
    data.serviceAccount = value?.email;
  };

  const fetchServiceAccounts = async () => {
    await SchedulerService.getServiceAccounts(
      'dataproc-jupyter-extension-dev',
      setServiceAccounts
    );
  };

  const handleEditNotebook = async (event: React.MouseEvent) => {
    setEditNotebookLoading(true)
    eventEmitter.emit(`editfile`, event, inputFileSelectedLocal);
  };

  eventEmitter.on(`openNotebook`, (openNotebookFile:boolean) => {
    setEditNotebookLoading(!openNotebookFile)
  });

  const extractFilename = (fullPath:string) => {
    return fullPath ? fullPath.split('/').pop() : '';
  };

  useEffect(() => {
    if (data && parameterDetailUpdated.length > 0) {
      data.parameter = parameterDetailUpdated;
    }
  }, [parameterDetailUpdated]);

  useEffect(() => {
    if (data) {
      setInputFileSelectedLocal(data.inputFile);
      setRetryCount(data.retryCount);
      setRetryDelay(data.retryDelay);
      setClusterSelected(data.clusterName);
      if (data.serverless && data.serverless.jupyterSession.displayName) {
        setServerlessSelected(data.serverless.jupyterSession.displayName);
      }
      setStopCluster(data.stopCluster);
      const selectedServiceAccount = serviceAccounts.find(
        option => option.email === data.serviceAccount
      );
      if (selectedServiceAccount) {
        setServiceAccountSelected(selectedServiceAccount.displayName);
      }
      setParameterDetailUpdated(data.parameter);
      setParameterDetail(data.parameter);
    }
  }, [data, serviceAccounts]);

  useEffect(() => {
    if (mode === 'cluster') {
      listClustersAPI();
    } else {
      listSessionTemplatesAPI();
      fetchServiceAccounts();
    }
  }, [mode]);



  return (
    <>
      <div>
        <form>
          <div className="custom-node-body">
            <label htmlFor="file-input" className="create-scheduler-style">
              Input file*
            </label>
            <div className="input-file-container">
              <Button
                sx={{
                  textTransform: 'none'
                }}
                component="label"
                role={undefined}
                variant="contained"
                tabIndex={-1}
                startIcon={<CloudUploadIcon />}
              >
                Upload file
                <input
                  type="file"
                  className="visually-hidden-input"
                  onChange={event => onInputFileNameChange(event)}
                  multiple={false}
                  value={''}
                  accept=".ipynb"
                />
              </Button>
              {inputFileSelectedLocal &&
                (editNotebookLoading ? (
                  <div className="loader-container">
                    <CircularProgress
                      size={18}
                      aria-label="Loading Spinner"
                      data-testid="loader"
                    />
                    {extractFilename(inputFileSelectedLocal)}
                  </div>
                ) : (
                  <div className="input-file-wrapper">
                    <a
                      href="#"
                      onClick={e => {
                        e.preventDefault();
                        handleEditNotebook(e);
                      }}
                      className="input-file-link"
                      style={{ textDecoration: 'underline', color: 'blue' }}
                    >
                      {extractFilename(inputFileSelectedLocal)}
                    </a>
                  </div>
                ))}
            </div>
            {inputFileValidation && (
              <div className="jobform-error-key-parent">
                <iconError.react tag="div" className="logo-alignment-style" />
                <div className="jobform-error-key-missing">
                  Please select a .ipynb file.
                </div>
              </div>
            )}
            <LabelProperties
              labelDetail={parameterDetail}
              setLabelDetail={setParameterDetail}
              labelDetailUpdated={parameterDetailUpdated}
              setLabelDetailUpdated={setParameterDetailUpdated}
              buttonText="ADD PARAMETER"
              keyValidation={keyValidation}
              setKeyValidation={setKeyValidation}
              valueValidation={valueValidation}
              setValueValidation={setValueValidation}
              duplicateKeyError={duplicateKeyError}
              setDuplicateKeyError={setDuplicateKeyError}
              fromPage="react-flow"
            />
            {/* <div className="create-scheduler-form-element">
              <div> Output Format </div>
              <FormGroup row={true}>
                <FormControlLabel
                  control={<Checkbox size="small" />}
                  className="create-scheduler-label-style"
                  label={
                    <Typography sx={{ fontSize: 13 }}>Notebook</Typography>
                  }
                />
              </FormGroup>
            </div> */}
            <div className="scheduler-dropdown-form-element">
              {isLoadingKernelDetail && (
                <CircularProgress
                  size={18}
                  aria-label="Loading Spinner"
                  data-testid="loader"
                />
              )}
              {mode === 'cluster' && !isLoadingKernelDetail && (
                <Autocomplete
                  className="create-scheduler-style-trigger"
                  options={clusterList}
                  value={clusterSelected}
                  onChange={(_event, val) => handleClusterSelected(val)}
                  renderInput={params => (
                    <TextField {...params} label="Cluster*" />
                  )}
                />
              )}
              {mode === 'serverless' && !isLoadingKernelDetail && (
                <>
                  <Autocomplete
                    className="create-scheduler-style-trigger"
                    options={serverlessList}
                    value={serverlessSelected}
                    onChange={(_event, val) => handleServerlessSelected(val)}
                    renderInput={params => (
                      <TextField {...params} label="Serverless*" />
                    )}
                  />
                  <Autocomplete
                    className="create-scheduler-style-trigger"
                    options={serviceAccounts}
                    getOptionLabel={option => option.displayName}
                    value={
                      serviceAccounts.find(
                        option => option.displayName === serviceAccountSelected
                      ) || null
                    }
                    onChange={handleServiceAccountChange}
                    renderInput={params => (
                      <TextField {...params} label="Service account " />
                    )}
                    renderOption={(props, option) => (
                      <Box
                        component="li"
                        {...props}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'flex-start'
                        }}
                      >
                        <Typography variant="body1">
                          {option.displayName}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          {option.email}
                        </Typography>
                      </Box>
                    )}
                  />
                </>
              )}
            </div>
            {mode === 'cluster' && (
              <div className="create-scheduler-form-element">
                <FormGroup row={true}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        size="small"
                        checked={stopCluster}
                        onChange={e => handleStopCluster(e)}
                      />
                    }
                    className="create-scheduler-label-style"
                    label={
                      <Typography
                        sx={{ fontSize: 13 }}
                        title="Stopping cluster abruptly will impact if any other job is running on the cluster at the moment"
                      >
                        Stop the cluster after notebook execution
                      </Typography>
                    }
                  />
                </FormGroup>
              </div>
            )}
            <div className="scheduler-retry-parent">
              <Input
                className="retry-count"
                value={retryCount !== undefined ? retryCount : ''}
                Label="Retry Count"
                onChange={handleRetryCountChange}
              />
              <Input
                className="retry-delay"
                value={retryDelay !== undefined ? retryDelay : ''}
                Label="Retry Delay"
                onChange={handleRetryDelayChange}
              />
            </div>
          </div>
        </form>
      </div>
    </>
  );
}

export default ClusterServerlessForm;
