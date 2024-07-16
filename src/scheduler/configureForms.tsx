import React, { useEffect, useState } from 'react';
import { eventEmitter } from '../utils/signalEmitter';
import { Autocomplete, IconButton, TextField } from '@mui/material';
import ClusterServerlessForm from './clusterServerlessForm';
import TriggerJobForm from './triggerJobForm';
import { LabIcon } from '@jupyterlab/ui-components';
import searchClearIcon from '../../style/icons/search_clear_icon.svg';

const iconSearchClear = new LabIcon({
  name: 'launcher:search-clear-icon',
  svgstr: searchClearIcon
});

function ConfigureForm({ id, data, nodes }: any) {
 // const [isFormVisible, setIsFormVisible] = useState(true);
  const nodeTypes = [
    'Run a notebook on dataproc serverless',
    'Run a notebook on dataproc cluster',
    'Execute a SQL on BigQuery',
    'Move, copy, delete, etc. files & folders on GCS',
    'Ingest data into a BQ table from GCS',
    'Export data from BQ table to GCS',
    'Trigger Node'
  ];

  //const filteredNodeTypes = id === 0 ? nodeTypes : nodeTypes.filter(type => type !== 'Trigger Node');
  const defaultNodeType = id === '0' ? 'Trigger Node' : '';
  //const defaultNodeType = data.inputFile ? 'Trigger Node' : '';
  const [nodeTypeSelected, setnodeTypeSelected] = useState(defaultNodeType);
  const [clickedNodeData, setClickedNodeData] = useState<any>(null);
  const [previousNodeType, setPreviousNodeType] = useState(defaultNodeType);

  const handleNodeTypeChange = (value: any) => {
    setnodeTypeSelected(value);
    eventEmitter.emit(`nodeType`, value, id);
    data.type = value;
    setPreviousNodeType(nodeTypeSelected);
  };

  const handleCancel = () => {
    // setIsFormVisible(false);
    // //eventEmitter.emit(`closeForm`, isFormVisible);
    // console.log('form cancel', isFormVisible);
    eventEmitter.emit(`closeForm`, false);
  };

  useEffect(() => {
    const clickedNode = nodes.find((node: any) => node.id === id);
    setClickedNodeData(clickedNode ? clickedNode.data : '');
    setnodeTypeSelected(clickedNode ? clickedNode.data.type : null);
  }, [nodes, id]);

  useEffect(() => {
    if (previousNodeType && previousNodeType !== nodeTypeSelected) {
      setClickedNodeData('');
    }
  }, [nodeTypeSelected, previousNodeType]);

  return (
    <>
      <>
        <form>
          <div className="submit-job-container">
            <div className="submit-job-label-header">
              Configure Node
              <IconButton aria-label="cancel" onClick={handleCancel}>
                <iconSearchClear.react
                  tag="div"
                  className="icon-white logo-alignment-style search-clear-icon"
                />
              </IconButton>
            </div>
            <Autocomplete
              className="create-scheduler-style"
              options={nodeTypes} //{filteredNodeTypes}
              value={nodeTypeSelected}
              onChange={(_event, value) => handleNodeTypeChange(value)}
              // disabled={id==="0"}
              renderInput={params => (
                <TextField {...params} label="Node Type*" />
              )}
            />
            {nodeTypeSelected === 'Trigger Node' && (
              <TriggerJobForm id={id} data={clickedNodeData} />
            )}
            {nodeTypeSelected === 'Run a notebook on dataproc serverless' && (
              <ClusterServerlessForm
                id={id}
                data={clickedNodeData}
                mode={'serverless'}
              />
            )}
            {nodeTypeSelected === 'Run a notebook on dataproc cluster' && (
              <ClusterServerlessForm
                id={id}
                data={clickedNodeData}
                mode={'cluster'}
              />
            )}
          </div>
        </form>
      </>
    </>
  );
}

export default ConfigureForm;
