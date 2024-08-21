import React, { useEffect, useState } from 'react';
import { Input } from '../controls/MuiWrappedInput';
import LabelProperties from '../jobs/labelProperties';
import { eventEmitter } from '../utils/signalEmitter';
import {
  Autocomplete,
  Box,
  Checkbox,
  CircularProgress,
  // FormControl,
  FormControlLabel,
  FormGroup,
  // Radio,
  // RadioGroup,
  TextField,
  Typography
} from '@mui/material';
import { SchedulerService } from './schedulerServices';

function BigQueryNotebookForm({ id, data, mode }: any) {
  const [inputFileSelectedLocal, setInputFileSelectedLocal] = useState('');
  const [retryCount, setRetryCount] = useState<number | undefined>(2);
  const [retryDelay, setRetryDelay] = useState<number | undefined>(5);
  const [parameterDetail, setParameterDetail] = useState(['']);
  const [parameterDetailUpdated, setParameterDetailUpdated] = useState(['']);
  const [keyValidation, setKeyValidation] = useState(-1);
  const [valueValidation, setValueValidation] = useState(-1);
  const [duplicateKeyError, setDuplicateKeyError] = useState(-1);
  const [isLoadingKernelDetail, setIsLoadingKernelDetail] = useState(false);
  const [serverlessList, setServerlessList] = useState<string[]>([]);
  const [serverlessDataList, setServerlessDataList] = useState<string[]>([]);
  const [serverlessSelected, setServerlessSelected] = useState('');
  const [serviceAccounts, setServiceAccounts] = useState<
    { displayName: string; email: string }[]
  >([]);
  const [serviceAccountSelected, setServiceAccountSelected] = useState('');
  const onInputFileNameChange = (evt: any) => {
    const file = evt.target.files && evt.target.files[0];
    if (file) {
      setInputFileSelectedLocal(evt.target.value);
      eventEmitter.emit(`uploadProgress-bq`, evt, data);
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

  const listSessionTemplatesAPI = async () => {
    await SchedulerService.listSessionTemplatesAPIService(
      setServerlessDataList,
      setServerlessList,
      setIsLoadingKernelDetail
    );
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

  const handleServiceAccountChange = (
    event: any,
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
  useEffect(() => {
    if (data) {
      data.parameter = parameterDetailUpdated;
    }
  }, [parameterDetailUpdated]);

  useEffect(() => {
    if (data) {
      setInputFileSelectedLocal(data.inputFile);
      setRetryCount(data.retryCount);
      setRetryDelay(data.retryDelay);
      if (data.serverless && data.serverless.jupyterSession.displayName) {
        setServerlessSelected(data.serverless.jupyterSession.displayName);
      }
      const selectedServiceAccount = serviceAccounts.find(
        option => option.email === data.serviceAccount
      );
      if (selectedServiceAccount) {
        setServiceAccountSelected(selectedServiceAccount.displayName);
      }
    }
  }, [data, serviceAccounts]);

  useEffect(() => {
    listSessionTemplatesAPI();
  }, [mode]);

  useEffect(() => {
    fetchServiceAccounts();
  }, [serviceAccountSelected]);

  return (
    <>
      <div>
        <form>
          <div className="custom-node__body">
            <label htmlFor="file-input" className="create-scheduler-style">
              Notebook*
            </label>
            <div className="input-file-container">
              <input
                className="create-scheduler-style"
                type="file"
                value={''}
                // {inputFileSelectedLocal}
                onChange={e => onInputFileNameChange(e)}
              />
              {
                <div className="create-scheduler-style">
                  {inputFileSelectedLocal}
                </div>
              }
            </div>
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
            <div className="create-scheduler-form-element">
              <div> Output Format </div>
              <FormGroup row={true}>
                <FormControlLabel
                  control={
                    <Checkbox
                      size="small"
                      //checked={}
                      //onChange={}
                    />
                  }
                  className="create-scheduler-label-style"
                  label={
                    <Typography sx={{ fontSize: 13 }}>Notebook</Typography>
                  }
                />
              </FormGroup>
            </div>

            <div className="scheduler-dropdown-form-element">
              {isLoadingKernelDetail && (
                <CircularProgress
                  size={18}
                  aria-label="Loading Spinner"
                  data-testid="loader"
                />
              )}
              {mode === 'serverless' && !isLoadingKernelDetail && (
                <Autocomplete
                  className="create-scheduler-style-trigger"
                  options={serverlessList}
                  value={serverlessSelected}
                  onChange={(_event, val) => handleServerlessSelected(val)}
                  renderInput={params => (
                    <TextField {...params} label="Serverless*" />
                  )}
                />
              )}
              {/* <FormControl className="trigger-form">
                <RadioGroup
                  aria-labelledby="demo-controlled-radio-buttons-group"
                  name="controlled-radio-buttons-group"
                  value={executeTypeSelected}
                  // onChange={handleExecuteTypeChange}
                >
                  <FormControlLabel
                    value="user"
                    className="create-scheduler-label-style"
                    control={<Radio size="small" />}
                    label={
                      <Typography sx={{ fontSize: 13 }}>
                        {' '}
                        Execute as User
                      </Typography>
                    }
                  />
                  <FormControlLabel
                    value="serviceAccount"
                    className="create-scheduler-label-style"
                    control={<Radio size="small" />}
                    label={
                      <Typography sx={{ fontSize: 13 }}>
                        Execute as Service Account
                      </Typography>
                    }
                  />
                </RadioGroup>
              </FormControl> */}
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
                // disabled={executeTypeSelected !== 'serviceAccount'}
                renderOption={(props, option) => (
                  <Box
                    component="li"
                    {...props}
                    display="flex"
                    flexDirection="column"
                    alignItems="flex-start" // Ensure left alignment
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
            </div>
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

export default BigQueryNotebookForm;
