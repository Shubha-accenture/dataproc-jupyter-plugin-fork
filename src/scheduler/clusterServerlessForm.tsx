import React, { useEffect, useState } from 'react';
import { Input } from '../controls/MuiWrappedInput';
import LabelProperties from '../jobs/labelProperties';
import { eventEmitter } from '../utils/signalEmitter';
import {
  Autocomplete,
  Checkbox,
  CircularProgress,
  FormControlLabel,
  FormGroup,
  TextField,
  Typography
} from '@mui/material';
import { SchedulerService } from './schedulerServices';

function ClusterServerlessForm({ id, data, mode }: any) {
  const [inputFileSelectedLocal, setInputFileSelectedLocal] = useState('');
  const [inputFileSelected, setInputFileSelected] = useState('');
  const [retryCount, setRetryCount] = useState<number | undefined>(2);
  const [retryDelay, setRetryDelay] = useState<number | undefined>(5);
  const [parameterDetail, setParameterDetail] = useState(['']);
  const [parameterDetailUpdated, setParameterDetailUpdated] = useState(['']);
  const [keyValidation, setKeyValidation] = useState(-1);
  const [valueValidation, setValueValidation] = useState(-1);
  const [duplicateKeyError, setDuplicateKeyError] = useState(-1);
  const [isLoadingKernelDetail, setIsLoadingKernelDetail] = useState(false);
  const [isBigQueryNotebook, setIsBigQueryNotebook] = useState(false);
  const [selectedMode, setSelectedMode] = useState(mode);
  const [clusterList, setClusterList] = useState<string[]>([]);
  const [serverlessList, setServerlessList] = useState<string[]>([]);
  const [serverlessDataList, setServerlessDataList] = useState<string[]>([]);
  const [clusterSelected, setClusterSelected] = useState('');
  const [serverlessSelected, setServerlessSelected] = useState('');
  const [serverlessDataSelected, setServerlessDataSelected] = useState({});
  const [stopCluster, setStopCluster] = useState(false);
  console.log('11', serverlessDataSelected);
  const onInputFileNameChange = (evt: any) => {
    const file = evt.target.files && evt.target.files[0];
    if (file) {
      setInputFileSelectedLocal(evt.target.value);
      eventEmitter.emit(`uploadProgress`, evt, data, setInputFileSelected);
      console.log(inputFileSelected);
    }
  };

  const handleRetryCountChange = (e: number) => {
    if (e) {
      data.retryCount = e;
      setRetryCount(e);
    }
  };

  const handleRetryDelayChange = (e: number) => {
    if (e) {
      data.retryDelay = e;
      setRetryDelay(e);
    }
  };

  const listClustersAPI = async () => {
    await SchedulerService.listClustersAPIService(
      setClusterList,
      setIsLoadingKernelDetail
    );
  };

  const listSessionTemplatesAPI = async () => {
    //console.log(serverlessDataList);
    await SchedulerService.listSessionTemplatesAPIService(
      setServerlessDataList,
      setServerlessList,
      setIsLoadingKernelDetail
    );
  };
  const handleClusterSelected = (value: any) => {
    //its string--> string | null
    if (value) {
      const selectedCluster = value.toString();
      data.clusterName = selectedCluster;
      setClusterSelected(selectedCluster);
    }
  };

  // const handleServerlessSelected = (value: any) => {
  //   //its string--> string | null
  //   if (value) {
  //     const selectedServerless = value.toString();
  //     data.serverless = selectedServerless;
  //     console.log("selectedServerless",selectedServerless)
  //     setServerlessSelected(selectedServerless);
  //     console.log("serverlessDataList",serverlessDataList)

  //   }
  // };
  const handleServerlessSelected = (value: any) => {
    if (value) {
      const selectedServerless = value.toString();
      const selectedData: any = serverlessDataList.filter((serverless: any) => {
        return serverless.serverlessName === selectedServerless;
      });
      setServerlessDataSelected(selectedData[0].serverlessData);
      data.serverless = selectedData[0].serverlessData;
      setServerlessSelected(selectedServerless);
      //console.log(selectedServerless, selectedData, serverlessDataList);
    }
  };

  const handleStopCluster = (event: React.ChangeEvent<HTMLInputElement>) => {
    setStopCluster(event.target.checked);
    data.stopCluster = event.target.checked;
  };

  // const checkCompletionStatus = () => {
  //   const isComplete = data.inputFile;
  //   eventEmitter.emit(
  //     'color coding',
  //     isComplete ? 'complete' : 'incomplete',
  //     id
  //   );
  // };

  // useEffect(() => {
    
  //   checkCompletionStatus();
  // }, [inputFileSelectedLocal]);

  useEffect(() => {
    if (data) {
      // setInputFileSelectedLocal(data.inputFile);
      // setRetryCount(data.retryCount);
      // setRetryDelay(data.retryDelay);
      data.parameter = parameterDetailUpdated;
    }
    // console.log(data, parameterDetailUpdated);
  }, [parameterDetailUpdated]);

  useEffect(() => {
    if (data) {
      setInputFileSelectedLocal(data.inputFile);
      setRetryCount(data.retryCount);
      setRetryDelay(data.retryDelay);
      //data.parameter = parameterDetailUpdated;
      setClusterSelected(data.clusterName);
      setServerlessDataSelected(data.serverless); //here
      if (data.serverless && data.serverless.jupyterSession.displayName) {
        setServerlessSelected(
          data.serverless.jupyterSession.displayName
        );
      }
      setStopCluster(data.stopCluster);
    }
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
  },[]);

  return (
    <>
      {/* { isFormVisible && */}
      <div>
        <form>
          <div className="custom-node__body">
            <label htmlFor="file-input" className='create-scheduler-style'>Input file*</label>
            <div className="input-file-container">
            <input
            className='create-scheduler-style'
             // className="nodrag"
              type="file"
              value={''}
              // {inputFileSelectedLocal}
              onChange={e => onInputFileNameChange(e)}
            />
            {<div className='create-scheduler-style'>{inputFileSelectedLocal}</div>}
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
              // data={data}
              fromPage="react-flow"
            />
            <div className="scheduler-dropdown-form-element">
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
                    className="create-scheduler-style-trigger"
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
                  className="create-scheduler-style-trigger"
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
            <div className='scheduler-retry-parent'>
            <Input
              className="retry-count"
              value={retryCount}
              Label="Retry Count"
              onChange={e => handleRetryCountChange(Number(e.target.value))}
            />
            <Input
              className="retry-delay"
              value={retryDelay}
              Label="Retry Delay"
              onChange={e => handleRetryDelayChange(Number(e.target.value))}
            />
            </div>
          </div>
        </form>
      </div>
      {/* } */}
    </>
  );
}

export default ClusterServerlessForm;
