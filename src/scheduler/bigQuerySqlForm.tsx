import React, { useEffect, useState } from 'react';
import { Input } from '../controls/MuiWrappedInput';
import LabelProperties from '../jobs/labelProperties';
import { eventEmitter } from '../utils/signalEmitter';
import {
  Autocomplete,
  Checkbox,
  FormControlLabel,
  FormGroup,
  TextField,
  Typography
} from '@mui/material';

function BigQuerySqlForm({ id, data }: any) {
  const [inputFileSelectedLocal, setInputFileSelectedLocal] = useState('');
  const [retryCount, setRetryCount] = useState<number | undefined>(2);
  const [retryDelay, setRetryDelay] = useState<number | undefined>(5);
  const [parameterDetail, setParameterDetail] = useState(['']);
  const [parameterDetailUpdated, setParameterDetailUpdated] = useState(['']);
  const [keyValidation, setKeyValidation] = useState(-1);
  const [valueValidation, setValueValidation] = useState(-1);
  const [duplicateKeyError, setDuplicateKeyError] = useState(-1);
  const [executeTypeSelected, setExecuteTypeSelected] = useState('');
  const [isSaveQueryChecked, setIsSaveQueryChecked] = useState(false);
  const [tableID, setTableID] = useState('');
  const [datasetId, setDatasetId] = useState('');
  const executeTypes = [
    { value: 'Execute as Admin' },
    { value: 'Execute as User' }
  ];
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
    data.tableID = event.target.value;
  };
  const handleDatasetIdChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setDatasetId(event.target.value);
    data.datasetId = event.target.value;
  };

  const handleExecuteType = (value: any) => {
    setExecuteTypeSelected(value);
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
              </>
            )}

            <div className="scheduler-dropdown-form-element">
              <Autocomplete
                className="create-scheduler-style-trigger"
                options={executeTypes}
                // getOptionLabel={option => option.value}
                // value={
                //   executeTypes.find(
                //     option => option.value === executeTypeSelected
                //   ) || null
                // }
                // onChange={handleExecuteType}
                renderInput={params => (
                  <TextField {...params} label="Automatic region selection" />
                )}
                disabled={true}
              />
              <Autocomplete
                className="create-scheduler-style-trigger"
                options={executeTypes}
                getOptionLabel={option => option.value}
                value={
                  executeTypes.find(
                    option => option.value === executeTypeSelected
                  ) || null
                }
                onChange={handleExecuteType}
                renderInput={params => (
                  <TextField {...params} label="Execute as" />
                )}
                disabled={true}
              />
              <Autocomplete
                className="create-scheduler-style-trigger"
                options={executeTypes}
                // getOptionLabel={option => option.value}
                // value={
                //   executeTypes.find(
                //     option => option.value === executeTypeSelected
                //   ) || null
                // }
                // onChange={handleExecuteType}
                renderInput={params => (
                  <TextField {...params} label="Encryption" />
                )}
                disabled={true}
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
