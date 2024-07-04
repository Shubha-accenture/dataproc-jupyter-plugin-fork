import React, { useEffect, useState } from 'react';
import { Input } from '../controls/MuiWrappedInput';
import LabelProperties from '../jobs/labelProperties';
import { eventEmitter } from '../utils/signalEmitter';
import { Button } from '@mui/material';

function SchedulerForm({ id, data }: any) {
  const [inputFileSelectedLocal, setInputFileSelectedLocal] = useState('');
  const [inputFileSelected, setInputFileSelected] = useState('');
  const [retryCount, setRetryCount] = useState<number | undefined>(2);
  const [retryDelay, setRetryDelay] = useState<number | undefined>(5);
  const [parameterDetail, setParameterDetail] = useState(['']);
  const [parameterDetailUpdated, setParameterDetailUpdated] = useState(['']);
  const [keyValidation, setKeyValidation] = useState(-1);
  const [valueValidation, setValueValidation] = useState(-1);
  const [duplicateKeyError, setDuplicateKeyError] = useState(-1);
  const [isFormVisible, setIsFormVisible] =useState(true)

  // console.log('############## in form element');

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

  const handleCancel = () =>{
    setIsFormVisible(false)
    console.log("cancel is clicked")
    console.log("form cancel",isFormVisible)
    eventEmitter.emit(`closeForm`,setIsFormVisible);
  }

  useEffect(() => {
    setInputFileSelectedLocal(data.inputFile);
    setRetryCount(data.retryCount);
    setRetryDelay(data.retryDelay);
    //data.parameter = parameterDetail;
  }, [data]);

  return (
    <>
    {/* { isFormVisible && */}
      <div className="notebook-node">
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

export default SchedulerForm;
