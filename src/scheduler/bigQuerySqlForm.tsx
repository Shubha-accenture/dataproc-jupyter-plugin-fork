import React, { useEffect, useState } from 'react';
import { Input } from '../controls/MuiWrappedInput';
import LabelProperties from '../jobs/labelProperties';
import { eventEmitter } from '../utils/signalEmitter';
import {
  Autocomplete,
  Checkbox,
  FormControl,
  FormControlLabel,
  FormGroup,
  Radio,
  RadioGroup,
  TextField,
  Typography
} from '@mui/material';
import { SchedulerService } from './schedulerServices';

function BigQuerySqlForm({ id, data }: any) {
  const [inputFileSelectedLocal, setInputFileSelectedLocal] = useState('');
  const [retryCount, setRetryCount] = useState<number | undefined>(2);
  const [retryDelay, setRetryDelay] = useState<number | undefined>(5);
  const [parameterDetail, setParameterDetail] = useState(['']);
  const [parameterDetailUpdated, setParameterDetailUpdated] = useState(['']);
  const [keyValidation, setKeyValidation] = useState(-1);
  const [valueValidation, setValueValidation] = useState(-1);
  const [duplicateKeyError, setDuplicateKeyError] = useState(-1);
  // const [executeTypeSelected, setExecuteTypeSelected] = useState('');
  const [isSaveQueryChecked, setIsSaveQueryChecked] = useState(false);
  const [tableID, setTableID] = useState('');
  const [partitionField, setPartitionField] = useState('');
  const [datasetId, setDatasetId] = useState('');

  const [regionRadioBtnSelected, setRegionRadioBtnSelected] = useState(false);
  const [regionTypeSelected, setRegionTypeSelected] = useState('');
  const [regionSelected, setRegionSelected] = useState('');
  const [multiRegionSelected, setMultiRegionSelected] = useState('');
  const [regionList, setRegionList] = useState<string[]>([]);
  const [writeDisposition, setWriteDisposition] = useState('');
  // const executeTypes = [
  //   { value: 'Execute as Admin' },
  //   { value: 'Execute as User' }
  // ];
  const multiRegionList = ['EU', 'US'];
  const [serviceAccounts, setServiceAccounts] = useState<{ displayName: string, email: string }[]>([]);
  const [serviceAccountSelected, setServiceAccountSelected]= useState('');
  const onInputFileNameChange = (evt: any) => {
    const file = evt.target.files && evt.target.files[0];
    if (file) {
      setInputFileSelectedLocal(evt.target.value);
      eventEmitter.emit(`uploadProgress-bqsql`, evt, data);
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
  const handleSaveQuery = (event: React.ChangeEvent<HTMLInputElement>) => {
    setIsSaveQueryChecked(event.target.checked);
  };

  const handleTableIDChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setTableID(event.target.value);
    data.tableId = event.target.value;
  };
  const handlePartitionFieldChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setPartitionField(event.target.value);
    // data.tableID = event.target.value;
  };
  const handleDatasetIdChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setDatasetId(event.target.value);
    data.datasetId = event.target.value;
  };
  const handleServiceAccountChange = (
    event: any, value: { displayName: string; email: string } | null,
  ) => {
    setServiceAccountSelected(value?.displayName|| '');
    data.serviceAccount=value?.email
  };

  const fetchServiceAccounts = async () => {
    await SchedulerService.getServiceAccounts(
      'dataproc-jupyter-extension-dev',
      setServiceAccounts
    );
  };

  const handleRegionTypeChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRegionTypeSelected(event.target.value);
  };

  const fetchRegionList = async () => {
    await SchedulerService.getRegionList(
      'dataproc-jupyter-extension-dev',
      setRegionList
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
    }
  }, [data]);

  const handleRegionRadioBtn = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRegionRadioBtnSelected(event.target.checked);
    data.location = '';
  };

  const handleMultiRegionTypeSelected = (event: any, value: string | null) => {
    setMultiRegionSelected(value || '');
    data.location = value || '';
  };

  const handleRegionTypeSelected = (event: any, value: string | null) => {
    setRegionSelected(value || '');
    data.location = value;
  };

  const handleWriteDisposition = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setWriteDisposition(event.target.value);
    data.writeDisposition = event.target.value;
  };

  useEffect(() => {
    if (regionTypeSelected === 'region') {
      fetchRegionList();
    }
  }, [regionTypeSelected]);

  useEffect(() => {
      fetchServiceAccounts();
  }, [serviceAccountSelected]);

  return (
    <>
      <div>
        <form>
          <div className="custom-node__body">
            <label htmlFor="file-input" className="create-scheduler-style">
              Input File*
            </label>
            <div className="input-file-container">
              <input
                className="create-scheduler-style"
                type="file"
                value={''}
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
              <FormGroup row={true}>
                <FormControlLabel
                  control={
                    <Checkbox
                      size="small"
                      checked={isSaveQueryChecked}
                      onChange={e => handleSaveQuery(e)}
                    />
                  }
                  className="create-scheduler-label-style"
                  label={
                    <Typography sx={{ fontSize: 13 }}>Save Query</Typography>
                  }
                />
              </FormGroup>
            </div>
            {isSaveQueryChecked && (
              <>
                <Input
                  className="create-scheduler-style-trigger"
                  value={datasetId}
                  onChange={e => handleDatasetIdChange(e)}
                  type="text"
                  placeholder=""
                  Label="DataSet ID*"
                />
                <Input
                  className="create-scheduler-style-trigger"
                  value={tableID}
                  onChange={e => handleTableIDChange(e)}
                  type="text"
                  placeholder=""
                  Label="Table ID"
                />
                <Input
                  className="create-scheduler-style-trigger"
                  value={partitionField}
                  onChange={e => handlePartitionFieldChange(e)}
                  type="text"
                  placeholder=""
                  Label="Partition field"
                />
                <FormControl className="trigger-form">
                  <RadioGroup
                    aria-labelledby="demo-controlled-radio-buttons-group"
                    name="controlled-radio-buttons-group"
                    value={writeDisposition}
                    onChange={handleWriteDisposition}
                  >
                    <FormControlLabel
                      value="WRITE_APPEND"
                      className="create-scheduler-label-style"
                      control={<Radio size="small" />}
                      label={
                        <Typography sx={{ fontSize: 13 }}>
                          Append to table
                        </Typography>
                      }
                    />
                    <FormControlLabel
                      value="WRITE_TRUNCATE"
                      className="create-scheduler-label-style"
                      control={<Radio size="small" />}
                      label={
                        <Typography sx={{ fontSize: 13 }}>
                          Overwrite table
                        </Typography>
                      }
                    />
                  </RadioGroup>
                </FormControl>
              </>
            )}

            <div className="scheduler-dropdown-form-element">
              <FormGroup row={true}>
                <FormControlLabel
                  control={
                    <Checkbox
                      size="small"
                      checked={regionRadioBtnSelected}
                      onChange={handleRegionRadioBtn}
                    />
                  }
                  className="create-scheduler-label-style"
                  label={
                    <Typography sx={{ fontSize: 13 }}>
                      Automatic region selection
                    </Typography>
                  }
                />
              </FormGroup>
              {!regionRadioBtnSelected && (
                <FormControl className="trigger-form">
                  <RadioGroup
                    aria-labelledby="demo-controlled-radio-buttons-group"
                    name="controlled-radio-buttons-group"
                    value={regionTypeSelected}
                    onChange={handleRegionTypeChange}
                    aria-disabled={!regionRadioBtnSelected}
                  >
                    <FormControlLabel
                      value="region"
                      className="create-scheduler-label-style"
                      control={<Radio size="small" />}
                      label={
                        <Typography sx={{ fontSize: 13 }}>Region</Typography>
                      }
                    />
                    <FormControlLabel
                      value="multiRegion"
                      className="create-scheduler-label-style"
                      control={<Radio size="small" />}
                      label={
                        <Typography sx={{ fontSize: 13 }}>
                          MultiRegion
                        </Typography>
                      }
                    />
                  </RadioGroup>
                </FormControl>
              )}
              {!regionRadioBtnSelected && regionTypeSelected === 'region' && (
                <Autocomplete
                  className="create-scheduler-style-trigger"
                  options={regionList}
                  getOptionLabel={option => option}
                  value={
                    regionList.find(option => option === regionSelected) || null
                  }
                  onChange={handleRegionTypeSelected}
                  renderInput={params => (
                    <TextField {...params} label="Region" />
                  )}
                />
              )}
              {!regionRadioBtnSelected &&
                regionTypeSelected === 'multiRegion' && (
                  <Autocomplete
                    className="create-scheduler-style-trigger"
                    options={multiRegionList}
                    getOptionLabel={option => option}
                    value={
                      multiRegionList.find(
                        option => option === multiRegionSelected
                      ) || null
                    }
                    onChange={handleMultiRegionTypeSelected}
                    renderInput={params => (
                      <TextField {...params} label="MultiRegion" />
                    )}
                  />
                )}
              {/* <FormControl className="trigger-form">
                <RadioGroup
                  aria-labelledby="demo-controlled-radio-buttons-group"
                  name="controlled-radio-buttons-group"
                  value={executeTypeSelected}
                  onChange={handleExecuteTypeChange}
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

export default BigQuerySqlForm;
