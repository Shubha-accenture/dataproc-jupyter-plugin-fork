import React, { useCallback, useEffect, useState } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Input } from '../controls/MuiWrappedInput';
import LabelProperties from '../jobs/labelProperties';

function NotebookNode({ data, isConnectable }: NodeProps) {
  const [inputFileSelected, setInputFileSelected] = useState('');
  const [retryCount, setRetryCount] = useState<number | undefined>(2);
  const [retryDelay, setRetryDelay] = useState<number | undefined>(5);

  const [parameterDetail, setParameterDetail] = useState(['']);
  const [parameterDetailUpdated, setParameterDetailUpdated] = useState(['']);
  const [keyValidation, setKeyValidation] = useState(-1);
  const [valueValidation, setValueValidation] = useState(-1);
  const [duplicateKeyError, setDuplicateKeyError] = useState(-1);

  const onInputFileNameChange = useCallback(
    (evt: React.ChangeEvent<HTMLInputElement>) => {
      data.inputFile = evt.target.value;
      setInputFileSelected(evt.target.value);
    },
    []
  );

  const handleRetryCountChange = useCallback((e: number) => {
    data.retryCount = e;
    setRetryCount(e);
  }, []);

  const handleRetryDelayChange = useCallback((e: number) => {
    data.retryDelay = e;
    setRetryDelay(e);
  }, []);

  useEffect(() => {
    console.log(parameterDetail);
    data.parameter = parameterDetail;
  }, [parameterDetail]);

  return (
    <>
      <div className="notebook-node">
        <Handle
          type="target"
          position={Position.Top}
          isConnectable={isConnectable}
        />
        <div className="custom-node__header">Notebook Name</div>
        <div className="custom-node__body">
          <Input
            className="nodrag"
            value={inputFileSelected}
            Label="Input file*"
            onChange={e => onInputFileNameChange(e)}
          />
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
        </div>
        <Handle
          type="source"
          position={Position.Bottom}
          id="b"
          isConnectable={isConnectable}
        />
      </div>
    </>
  );
}

export default NotebookNode;
