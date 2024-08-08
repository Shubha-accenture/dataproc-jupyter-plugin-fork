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
  const nodeTypes = [
    { key: 'Serverless', label: 'Run a notebook on dataproc serverless' },
    { key: 'Cluster', label: 'Run a notebook on dataproc cluster' },
    // { key: 'sql', label: 'Execute a SQL on BigQuery' },
    // {
    //   key: 'gcs_operations',
    //   label: 'Move, copy, delete, etc. files & folders on GCS'
    // },
    // { key: 'ingest_data', label: 'Ingest data into a BQ table from GCS' },
    // { key: 'export_data', label: 'Export data from BQ table to GCS' },
    { key: 'Trigger', label: 'Trigger Node' }
  ];

  const filteredNodeTypes = id === '0'
  ? nodeTypes
  : nodeTypes.filter(node => node.key !== 'Trigger');

  const defaultNodeType = data && data.nodeType ? data.nodeType : id === 0 ? 'Trigger' : '';

  const [nodeTypeSelected, setNodeTypeSelected] = useState(defaultNodeType);
  const [clickedNodeData, setClickedNodeData] = useState<any>(null);
  
  useEffect(() => {
    if (data && data.nodeType !== '') {
      setNodeTypeSelected(data.nodeType);
    } 
  }, [data]);

  useEffect(() => {
    if (id === '0') {
      setNodeTypeSelected('Trigger');
      data.nodeType="Trigger"
    }
  }, []);

  const handleNodeTypeChange = (value: string | null) => {
    if (value) {
      setNodeTypeSelected(value);
      // eventEmitter.emit(`nodeType`, value, id);
      data.nodeType = value;
      //setPreviousNodeType(nodeTypeSelected);
    }
  };
  const handleCancel = () => {
    eventEmitter.emit(`closeForm`, false);
  };

  useEffect(() => {
    const clickedNode = nodes.find((node: any) => node.id === id);
    setClickedNodeData(clickedNode ? clickedNode.data : null);
    setNodeTypeSelected(clickedNode ? clickedNode.data.nodeType : null);
    // if (clickedNode && clickedNode.data.nodeType) {
    //   setNodeTypeSelected(clickedNode.data.nodeType);
    // } else if (id === 0) {
    //   setNodeTypeSelected('Trigger');
    // }

  }, [nodes, id]);

  return (
    <>
      <>
        <form>
          <div className="configure-node-container">
            <div className="task-form-header">
              <div className="create-job-scheduler-title">
              Configure Node
              </div>
              <IconButton aria-label="cancel" onClick={handleCancel}>
                <iconSearchClear.react
                  tag="div"
                  className="icon-white logo-alignment-style search-clear-icon"
                />
              </IconButton>
            </div>
            {/* <Autocomplete
              className="create-scheduler-style"
              options={nodeTypes}
              getOptionLabel={option => option.label}
              value={nodeTypes.find(option => option.key === nodeTypeSelected)}
              onChange={(_event, value) =>
                handleNodeTypeChange(value?.key || null)
              }
              renderInput={params => (
                <TextField {...params} label="Node Type*" />
              )}
            /> */}
            <Autocomplete
              className="nodetype-seletion-style"
              options={filteredNodeTypes}
              getOptionLabel={option => option.label}
              value={
                filteredNodeTypes.find(option => option.key === nodeTypeSelected) ||
                null
              }
              onChange={(_event, value) =>
                handleNodeTypeChange(value?.key || null)
              }
              renderInput={params => (
                <TextField {...params} label="Node Type*" />
              )}
              disabled={id==='0'}
            />
            {nodeTypeSelected === 'Trigger' && clickedNodeData!== null && (
              <TriggerJobForm id={id} data={clickedNodeData} nodes={nodes} />
            )}
            {nodeTypeSelected === 'Serverless' && clickedNodeData!== null && (
              <ClusterServerlessForm
                id={id}
                data={clickedNodeData}
                mode={'serverless'}
              />
            )}
            {nodeTypeSelected === 'Cluster' && clickedNodeData!== null && (
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
