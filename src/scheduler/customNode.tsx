import { Input } from '../controls/MuiWrappedInput';
import React, { memo, useState } from 'react';
import LabelProperties from '../jobs/labelProperties';
import { Handle, useReactFlow, useStoreApi, Position } from 'reactflow';

function Select({
  value,
  handleId,
  nodeId,
  input_File,
  retry_count,
  retry_delay
}: any) {
  const [inputFileSelected, setInputFileSelected] = useState('');
  const [retryCount, setRetryCount] = useState<number | undefined>(2);
  const [retryDelay, setRetryDelay] = useState<number | undefined>(5);

  const [parameterDetail, setParameterDetail] = useState(['']);
  const [parameterDetailUpdated, setParameterDetailUpdated] = useState(['']);
  const [keyValidation, setKeyValidation] = useState(-1);
  const [valueValidation, setValueValidation] = useState(-1);
  const [duplicateKeyError, setDuplicateKeyError] = useState(-1);

  const { setNodes } = useReactFlow();
  const store = useStoreApi();

  const handleFileNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputFileSelected(event.target.value);
    const { nodeInternals } = store.getState();
    setNodes(
      Array.from(nodeInternals.values()).map(node => {
        if (node.id === nodeId) {
          node.data = {
            ...node.data,
            inputFile: event.target.value,
            retryCount: retryCount,
            retryDelay: retryDelay
          };
        }
        return node;
      })
    );
  };
  const handleRetryCountChange = (data: number) => {
    if (data >= 0) {
      setRetryCount(data);
      const { nodeInternals } = store.getState();
      setNodes(
        Array.from(nodeInternals.values()).map(node => {
          if (node.id === nodeId) {
            node.data = {
              ...node.data,
              inputFile: inputFileSelected,
              retryCount: data,
              retryDelay: retryDelay
            };
          }
          return node;
        })
      );
    }
  };
  const handleRetryDelayChange = (data: number) => {
    if (data >= 0) {
      setRetryDelay(data);
      const { nodeInternals } = store.getState();
      setNodes(
        Array.from(nodeInternals.values()).map(node => {
          if (node.id === nodeId) {
            node.data = {
              ...node.data,
              inputFile: inputFileSelected,
              retryCount: retryCount,
              retryDelay: data
            };
          }
          return node;
        })
      );
    }
  };
  return (
    <div className="custom-node__select">
      <Input
        className="nodrag"
        value={inputFileSelected}
        Label="Input file*"
        onChange={e => handleFileNameChange(e)}
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
      <Handle type="source" position={Position.Right} id={handleId} />
    </div>
  );
}

function CustomNode({ id, data }: any) {
  return (
    <>
      <div className="custom-node__header">
        <strong> Notebook Name: abc </strong>
      </div>
      <div className="custom-node__body">
        {/* {Object.keys(data.selects).map(handleId => (  to add the node mutiple times make changes here */}
        <Select
          nodeId={id}
          inputFile={data.inputFile}
          retryCount={data.retryCount}
          retryDelay={data.retryDelay}
        />
        {/* ))} */}
      </div>
    </>
  );
}

export default memo(CustomNode);
