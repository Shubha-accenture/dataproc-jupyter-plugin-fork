import React, { useEffect, useState } from 'react';
import { Input } from '../controls/MuiWrappedInput';
import LabelProperties from '../jobs/labelProperties';
import { eventEmitter } from '../utils/signalEmitter';
import {
  Autocomplete,
  Button,
  Checkbox,
  CircularProgress,
  FormControl,
  FormControlLabel,
  FormGroup,
  Radio,
  RadioGroup,
  TextField,
  Typography
} from '@mui/material';
import { SchedulerService } from './schedulerServices';

function ClusterServerlessForm({ id, data }: any) {
  const [inputFileSelectedLocal, setInputFileSelectedLocal] = useState('');
  const [inputFileSelected, setInputFileSelected] = useState('');
  const [retryCount, setRetryCount] = useState<number | undefined>(2);
  const [retryDelay, setRetryDelay] = useState<number | undefined>(5);
  const [parameterDetail, setParameterDetail] = useState(['']);
  const [parameterDetailUpdated, setParameterDetailUpdated] = useState(['']);
  const [keyValidation, setKeyValidation] = useState(-1);
  const [valueValidation, setValueValidation] = useState(-1);
  const [duplicateKeyError, setDuplicateKeyError] = useState(-1);
  const [isFormVisible, setIsFormVisible] = useState(true);
  const [isLoadingKernelDetail, setIsLoadingKernelDetail] = useState(false);
  const [isBigQueryNotebook, setIsBigQueryNotebook] = useState(false);
  const [selectedMode, setSelectedMode] = useState('cluster');
  const [clusterList, setClusterList] = useState<string[]>([]);
  const [serverlessList, setServerlessList] = useState<string[]>([]);
  const [serverlessDataList, setServerlessDataList] = useState<string[]>([]);
  const [clusterSelected, setClusterSelected] = useState('');
  const [serverlessSelected, setServerlessSelected] = useState('');
  const [serverlessDataSelected, setServerlessDataSelected] = useState({});
  const [stopCluster, setStopCluster] = useState(false);

  console.log('############## in cluster form element');
  console.log(serverlessDataSelected);
  const onInputFileNameChange = (evt: any) => {
    const file = evt.target.files && evt.target.files[0];
    if (file) {
      setInputFileSelectedLocal(evt.target.value);
      eventEmitter.emit(`uploadProgress`, evt, data, setInputFileSelected);
      console.log(inputFileSelected);
      //console.log("isFormVisible",isFormVisible)
    }
  };

  const handleRetryCountChange = (e: number) => {
    data.retryCount = e;
    setRetryCount(e);
  };

  const handleRetryDelayChange = (e: number) => {
    data.retryDelay = e;
    setRetryDelay(e);
  };

  const handleCancel = () => {
    setIsFormVisible(false);
    // console.log('cancel is clicked');
    console.log('form cancel', isFormVisible);
    eventEmitter.emit(`closeForm`, setIsFormVisible);
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
  const handleClusterSelected = (data: string | null) => {
    if (data) {
      const selectedCluster = data.toString();
      setClusterSelected(selectedCluster);
    }
  };

  const handleServerlessSelected = (data: string | null) => {
    if (data) {
      const selectedServerless = data.toString();
      const selectedData: any = serverlessDataList.filter((serverless: any) => {
        return serverless.serverlessName === selectedServerless;
      });
      setServerlessDataSelected(selectedData[0].serverlessData);
      setServerlessSelected(selectedServerless);
    }
  };

  const handleStopCluster = (event: React.ChangeEvent<HTMLInputElement>) => {
    setStopCluster(event.target.checked);
  };

  const handleSelectedModeChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setSelectedMode((event.target as HTMLInputElement).value);
  };

  useEffect(() => {
    setInputFileSelectedLocal(data.inputFile);
    setRetryCount(data.retryCount);
    setRetryDelay(data.retryDelay);
    //data.parameter = parameterDetail;
  }, [data]);

  useEffect(() => {
    if (selectedMode === 'cluster') {
      listClustersAPI();
    } else {
      listSessionTemplatesAPI();
    }
  }, [selectedMode]);

  useEffect(() => {
    if (data.inputFile && data.inputFile !== '') {
      if (data.inputFile.toLowerCase().startsWith('bigframes')) {
        setIsBigQueryNotebook(true);
        setSelectedMode('serverless');
      }
    }
  });

  return (
    <>
      {/* { isFormVisible && */}
      <div>
        <form>
          <div className="custom-node__body">
            <label htmlFor="file-input">Input file*</label>
            <input
              className="nodrag"
              type="file"
              value={inputFileSelectedLocal}
              onChange={e => onInputFileNameChange(e)}
            />
            {<div>{inputFileSelectedLocal}</div>}
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
            {!isBigQueryNotebook && (
              <div className="create-scheduler-form-element">
                <FormControl>
                  <RadioGroup
                    aria-labelledby="demo-controlled-radio-buttons-group"
                    name="controlled-radio-buttons-group"
                    value={selectedMode}
                    onChange={handleSelectedModeChange}
                    row={true}
                  >
                    <FormControlLabel
                      value="cluster"
                      control={<Radio size="small" />}
                      label={
                        <Typography sx={{ fontSize: 13 }}>Cluster</Typography>
                      }
                    />
                    <FormControlLabel
                      value="serverless"
                      className="create-scheduler-label-style"
                      control={<Radio size="small" />}
                      label={
                        <Typography sx={{ fontSize: 13 }}>
                          Serverless
                        </Typography>
                      }
                    />
                  </RadioGroup>
                </FormControl>
              </div>
            )}
            <div className="create-scheduler-form-element">
              {isLoadingKernelDetail && (
                <CircularProgress
                  size={18}
                  aria-label="Loading Spinner"
                  data-testid="loader"
                />
              )}
              {!isBigQueryNotebook &&
                selectedMode === 'cluster' &&
                !isLoadingKernelDetail && (
                  <Autocomplete
                    className="create-scheduler-style"
                    options={clusterList}
                    value={clusterSelected}
                    onChange={(_event, val) => handleClusterSelected(val)}
                    renderInput={params => (
                      <TextField {...params} label="Cluster*" />
                    )}
                  />
                )}
              {selectedMode === 'serverless' && !isLoadingKernelDetail && (
                <Autocomplete
                  className="create-scheduler-style"
                  options={serverlessList}
                  value={serverlessSelected}
                  onChange={(_event, val) => handleServerlessSelected(val)}
                  renderInput={params => (
                    <TextField {...params} label="Serverless*" />
                  )}
                />
              )}
            </div>
            {!isBigQueryNotebook && selectedMode === 'cluster' && (
              <div className="create-scheduler-form-element">
                <FormGroup row={true}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        size="small"
                        checked={stopCluster}
                        onChange={handleStopCluster}
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
            <Input
              className="nodrag"
              value={retryCount}
              Label="Retry Count"
              onChange={e => handleRetryCountChange(Number(e.target.value))}
            />
            <Input
              className="nodrag"
              value={retryDelay}
              Label="Retry Delay"
              onChange={e => handleRetryDelayChange(Number(e.target.value))}
            />

            <Button
              variant="outlined"
              aria-label="cancel"
              onClick={handleCancel}
            >
              <div>CANCEL</div>
            </Button>
          </div>
        </form>
      </div>
      {/* } */}
    </>
  );
}

export default ClusterServerlessForm;
