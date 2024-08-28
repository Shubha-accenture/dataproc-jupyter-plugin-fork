import React, { useEffect, useState } from 'react';
import { Input } from '../controls/MuiWrappedInput';
import { eventEmitter } from '../utils/signalEmitter';
import {
  Autocomplete,
  Box,
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
import { LabIcon } from '@jupyterlab/ui-components';
import errorIcon from '../../style/icons/error_icon.svg';
import { KEY_MESSAGE } from '../utils/const';
import SchedulerProperties from './schedulerProperties';

function BigQuerySqlForm({ data }: any) {
  const [inputFileSelectedLocal, setInputFileSelectedLocal] = useState('');
  const [retryCount, setRetryCount] = useState<number | undefined>(2);
  const [retryDelay, setRetryDelay] = useState<number | undefined>(5);
  const [parameterDetail, setParameterDetail] = useState(['']);
  const [parameterDetailUpdated, setParameterDetailUpdated] = useState(['']);
  const [keyValidation, setKeyValidation] = useState(-1);
  const [valueValidation, setValueValidation] = useState(-1);
  const [duplicateKeyError, setDuplicateKeyError] = useState(-1);

  const [isSaveQueryChecked, setIsSaveQueryChecked] = useState(false);
  const [tableID, setTableID] = useState('');
  const [partitionField, setPartitionField] = useState('');
  const [datasetId, setDatasetId] = useState('');

  const [autoRegionSelected, setAutoRegionSelected] = useState(false);
  const [regionTypeSelected, setRegionTypeSelected] = useState('');
  const [regionSelected, setRegionSelected] = useState('');
  const [multiRegionSelected, setMultiRegionSelected] = useState('');
  const [regionList, setRegionList] = useState<string[]>([]);
  const [writeDisposition, setWriteDisposition] = useState('');
  const multiRegionList = [
    { key: 'us', label: 'US' },
    { key: 'europe', label: 'EU' }
  ]; //['us','europe']//['EU', 'US'];

  const [serviceAccounts, setServiceAccounts] = useState<
    { displayName: string; email: string }[]
  >([]);
  const [serviceAccountSelected, setServiceAccountSelected] = useState('');

  let keyType = '';
  let keyRing = '';
  let keys = '';
  const selectedKeyType = keyType ? 'customerManaged' : 'googleManaged';
  const [selectedEncryptionRadio, setSelectedEncryptionRadio] =
    useState(selectedKeyType);
  const [selectedRadioValue, setSelectedRadioValue] = useState('key'); //check this if causing any issue
  const [keyRingSelected, setKeyRingSelected] = useState(keyRing);
  const [keySelected, setKeySelected] = useState(keys);
  const [manualKeySelected, setManualKeySelected] = useState('');
  const [manualValidation, setManualValidation] = useState(true);
  const [keylist, setKeylist] = useState<{ displaykey: string; key: string }[]>(
    []
  ); //change this to only array of strings
  const [keyRinglist, setKeyRinglist] = useState<string[]>([]);
  // const [regionId, setRegionId]=useState('')//for api passing

  const iconError = new LabIcon({
    name: 'launcher:error-icon',
    svgstr: errorIcon
  });

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
  };
  const handleDatasetIdChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setDatasetId(event.target.value);
    data.datasetId = event.target.value;
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

  const handleRegionRadioBtn = (event: React.ChangeEvent<HTMLInputElement>) => {
    setAutoRegionSelected(event.target.checked);
    data.location = 'us';//as per backend requirement
  };

  const handleMultiRegionTypeSelected = (
    event: React.ChangeEvent<{}>,
    value: { key: string; label: string } | null
  ) => {
    setMultiRegionSelected(value?.label || '');
    data.location = value?.key || '';
    console.log(data.location);
  };

  const handleRegionTypeSelected = (
    event: React.ChangeEvent<{}>,
    value: string | null
  ) => {
    setRegionSelected(value || '');
    data.location = value;
  };

  const handleWriteDisposition = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setWriteDisposition(event.target.value);
    data.writeDisposition = event.target.value;
  };

  const handlekeyRingRadio = () => {
    setSelectedRadioValue('key');
    setManualKeySelected('');
    setManualValidation(true);
  };

  const handleGoogleManagedRadio = () => {
    setSelectedEncryptionRadio('googleManaged');
    setKeyRingSelected('');
    setKeySelected('');
    setManualKeySelected('');
  };
  const handlekeyManuallyRadio = () => {
    setSelectedRadioValue('manually');
    setKeyRingSelected('');
    setKeySelected('');
  };

  const handleManualKeySelected = (event: any) => {
    //any
    const inputValue = event.target.value;
    const numericRegex =
      /^projects\/[^/]+\/locations\/[^/]+\/keyRings\/[^/]+\/cryptoKeys\/[^/]+$/;

    if (numericRegex.test(inputValue) || inputValue === '') {
      setManualValidation(true);
    } else {
      setManualValidation(false);
    }

    setManualKeySelected(inputValue);
    data.kmsKey = inputValue;
  };

  const handleKeyRingChange = (value: string | null) => {
    if (data !== null) {
      setKeyRingSelected(value!.toString());
      listKeysAPI(value!.toString());
      data.keyRings = value;
    }
  };

  const handleKeyChange = (
    event: React.SyntheticEvent<Element, Event>,
    value: { displaykey: string; key: string } | null
  ) => {
    if (value) {
      setKeySelected(value.displaykey);
      data.kmsKey = value.key;
    } else {
      setKeySelected('');
      data.kmsKey = '';
    }
  };

  const listKeysAPI = async (keyRingSelected: string) => {
    await SchedulerService.getKeysList(
      data.location,
      keyRingSelected,
      setKeylist
    );
  };
  const listKeyRingsAPI = async () => {
    console.log(data.location);
    await SchedulerService.getKeyRingsList(data.location, setKeyRinglist);
  };

  useEffect(() => {
    if (data) {
      data.parameter = parameterDetailUpdated;
    }
  }, [parameterDetailUpdated]);

  useEffect(() => {
    fetchRegionList();
    fetchServiceAccounts();
    //  listKeyRingsAPI();//check now as we don't have region here
  }, []);

  useEffect(() => {
    if (data.location) {
      listKeyRingsAPI();
    }
  }, [regionSelected, multiRegionSelected]);

  useEffect(() => {
    if (data) {
      setInputFileSelectedLocal(data.inputFile);
      setRetryCount(data.retryCount);
      setRetryDelay(data.retryDelay);
      setTableID(data.tableId);
      setDatasetId(data.datasetId);
      setServiceAccountSelected(data.serviceAccount);
      setWriteDisposition(data.writeDisposition);
      if (data.serviceAccount) {
        setServiceAccountSelected(data.serviceAccount);
      }
      if (data.datasetId || data.tableId) {
        setIsSaveQueryChecked(true);
      }
      const selectedServiceAccount = serviceAccounts.find(
        option => option.email === data.serviceAccount
      );
      if (selectedServiceAccount) {
        setServiceAccountSelected(selectedServiceAccount.displayName);
      }
      // if (data.location) {
      //   if (multiRegionList.includes(data.location)) {
      //     setRegionTypeSelected('multiRegion');
      //     setMultiRegionSelected(data.location);
      //   } else {
      //     setRegionTypeSelected('region');
      //     setRegionSelected(data.location);
      //   }
      // } else if (data.location === '') {
      //   setAutoRegionSelected(true);
      // }
      // due to region change this is not working properly
      // if(data.keyRings){
      //   setKeyRingSelected(data.keyRings)
      //   setSelectedEncryptionRadio('customerManaged')
      // }
      if (data.kmsKey) {
        setSelectedEncryptionRadio('customerManaged');
        // console.log(data.kmsKey, keylist)
        // const selectedKey = keylist.find(option => option.key === data.kmsKey);
        // console.log(selectedKey)
        // if (selectedKey) {
        //   setKeySelected(selectedKey.displaykey);
        // }
        // projects/dataproc-jupyter-extension-dev/locations/us-central1/keyRings/keyring1/cryptoKeys/key3 // handle rings with this
        let kmsKeyArray = data.kmsKey.split('/');
        console.log(kmsKeyArray);
        setKeyRingSelected(kmsKeyArray[5]);
        setKeySelected(kmsKeyArray[7]);
      }
    }
  }, [data, serviceAccounts, keylist]); //remove keylist by checking

  return (
    <>
      <div>
        <form>
          <div className="custom-node-body">
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
            <SchedulerProperties
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
                    <Typography sx={{ fontSize: 13 }}>
                      Set a destination table for query results
                    </Typography>
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
                  Label="DataSet Id*"
                />
                <Input
                  className="create-scheduler-style-trigger"
                  value={tableID}
                  onChange={e => handleTableIDChange(e)}
                  type="text"
                  placeholder=""
                  Label="Table Id*"
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
            <div className="configure-form-dropdown-element">
              <FormGroup row={true}>
                <FormControlLabel
                  control={
                    <Checkbox
                      size="small"
                      checked={autoRegionSelected}
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
              {!autoRegionSelected && (
                <FormControl className="trigger-form">
                  <RadioGroup
                    aria-labelledby="demo-controlled-radio-buttons-group"
                    name="controlled-radio-buttons-group"
                    value={regionTypeSelected}
                    onChange={handleRegionTypeChange}
                    aria-disabled={!autoRegionSelected}
                  >
                    <FormControlLabel
                      value="region"
                      className="create-scheduler-label-style"
                      control={<Radio size="small" />}
                      disabled={autoRegionSelected}
                      label={
                        <Typography sx={{ fontSize: 13 }}>Region</Typography>
                      }
                    />
                    <FormControlLabel
                      value="multiRegion"
                      className="create-scheduler-label-style"
                      control={<Radio size="small" />}
                      disabled={autoRegionSelected}
                      label={
                        <Typography sx={{ fontSize: 13 }}>
                          MultiRegion
                        </Typography>
                      }
                    />
                  </RadioGroup>
                </FormControl>
              )}
              {!autoRegionSelected && regionTypeSelected === 'region' ? (
                <Autocomplete
                  className="create-scheduler-style-trigger"
                  options={regionList}
                  getOptionLabel={option => option}
                  value={
                    regionList.find(option => option === regionSelected) || null
                  }
                  disabled={autoRegionSelected}
                  onChange={handleRegionTypeSelected}
                  renderInput={params => (
                    <TextField {...params} label="Region*" />
                  )}
                />
              ) : (
                !autoRegionSelected &&
                regionTypeSelected === 'multiRegion' && (
                  <Autocomplete
                    className="create-scheduler-style-trigger"
                    options={multiRegionList}
                    getOptionLabel={option => option.label}
                    value={
                      multiRegionList.find(
                        option => option.label === multiRegionSelected
                      ) || null
                    }
                    disabled={autoRegionSelected}
                    onChange={handleMultiRegionTypeSelected}
                    renderInput={params => (
                      <TextField {...params} label="MultiRegion*" />
                    )}
                  />
                )
              )}
              <div className="scheduler-retry-parent">
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
              </div>
            </div>

            <div>
              <label htmlFor="encryption" className="encryption-header">
                Encryption
              </label>
              <div>
                <div className="create-batch-radio">
                  <Radio
                    size="small"
                    className="select-batch-radio-style"
                    value="googleManaged"
                    checked={selectedEncryptionRadio === 'googleManaged'}
                    onChange={handleGoogleManagedRadio}
                  />
                  <div className="create-batch-message">
                    Google-managed encryption key
                  </div>
                </div>
                <div className="create-batch-sub-message">
                  No configuration required
                </div>
              </div>
              <div>
                <div className="create-batch-radio">
                  <Radio
                    size="small"
                    className="select-batch-radio-style"
                    value="googleManaged"
                    checked={selectedEncryptionRadio === 'customerManaged'}
                    onChange={() =>
                      setSelectedEncryptionRadio('customerManaged')
                    }
                  />
                  <div className="create-batch-message">
                    Customer-managed encryption key (CMEK)
                  </div>
                </div>
                <div className="create-batch-sub-message">
                  Manage via{' '}
                  <div
                    className="submit-job-learn-more"
                    // onClick={() => {
                    //   window.open(
                    //     `${SECURITY_KEY}?project=${projectName}`,
                    //     '_blank'
                    //   );
                    // }}
                  >
                    Google Cloud Key Management Service
                  </div>
                </div>
                {selectedEncryptionRadio === 'customerManaged' && (
                  <>
                    <div>
                      <div className="create-scheduler-encrypt">
                        <Radio
                          size="small"
                          className="select-batch-encrypt-radio-style"
                          value="mainClass"
                          checked={selectedRadioValue === 'key'}
                          onChange={handlekeyRingRadio}
                        />
                        <div className="create-scheduler-style-key">
                          <Autocomplete
                            className="create-scheduler-style-key-rings"
                            disabled={
                              selectedRadioValue === 'manually' ? true : false
                            }
                            options={keyRinglist}
                            value={keyRingSelected}
                            onChange={(_event, val) => handleKeyRingChange(val)}
                            renderInput={params => (
                              <TextField {...params} label="Key rings" />
                            )}
                          />
                          <Autocomplete
                            className="create-scheduler-style-keys"
                            disabled={
                              selectedRadioValue === 'manually' ? true : false
                            }
                            options={keylist}
                            getOptionLabel={option => option.displaykey}
                            value={keylist.find(
                              option => option.displaykey === keySelected
                            )}
                            onChange={handleKeyChange}
                            renderInput={params => (
                              <TextField {...params} label="Keys" />
                            )}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="create-scheduler-encrypt">
                      <Radio
                        size="small"
                        className="select-batch-encrypt-radio-style "
                        value="mainClass"
                        checked={selectedRadioValue === 'manually'}
                        onChange={handlekeyManuallyRadio}
                      />
                      <div className="create-scheduler-style-key">
                        <Input
                          // className={
                          //   selectedRadioValue === 'key'
                          //     ? 'disable-text create-batch-key manual-key'
                          //     : 'create-batch-style manual-key'
                          // }
                          className="create-scheduler-style-key"
                          value={manualKeySelected}
                          type="text"
                          disabled={selectedRadioValue === 'key'}
                          onChange={handleManualKeySelected}
                          Label="Enter key manually"
                        />
                      </div>
                    </div>
                    {!manualValidation && (
                      <div className="error-key-parent-manual">
                        <iconError.react
                          tag="div"
                          className="logo-alignment-style"
                        />
                        <div className="error-key-missing">{KEY_MESSAGE}</div>
                      </div>
                    )}
                  </>
                )}
              </div>
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
