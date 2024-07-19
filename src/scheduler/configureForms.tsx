import React, { useEffect, useState } from 'react';
import { eventEmitter } from '../utils/signalEmitter';
import { Autocomplete, IconButton, TextField } from '@mui/material';
import ClusterServerlessForm from './clusterServerlessForm';
import TriggerJobForm from './triggerJobForm';
import { LabIcon } from '@jupyterlab/ui-components';
import searchClearIcon from '../../style/icons/search_clear_icon.svg';

interface ClusterData {
  inputFile: ''; //inputFileSelected;
  retryCount: 0;
  retryDelay: 0;
  parameter: [];
  stop_cluster: '';
  cluster_name: '';
}
interface ServerlessData {
  inputFile: ''; //inputFileSelected;
  retryCount: 0;
  retryDelay: 0;
  parameter: [];
  serverless: '';
}
interface TriggerData {
  schedule_value: '';
  time_zone: '';
}

const iconSearchClear = new LabIcon({
  name: 'launcher:search-clear-icon',
  svgstr: searchClearIcon
});

function ConfigureForm({ id, data, nodes }: any) {

  const nodeTypes = [
    { key: 'serverless', label: 'Run a notebook on dataproc serverless' },
    { key: 'cluster', label: 'Run a notebook on dataproc cluster' },
    { key: 'sql', label: 'Execute a SQL on BigQuery' },
    {
      key: 'gcs_operations',
      label: 'Move, copy, delete, etc. files & folders on GCS'
    },
    { key: 'ingest_data', label: 'Ingest data into a BQ table from GCS' },
    { key: 'export_data', label: 'Export data from BQ table to GCS' },
    { key: 'trigger', label: 'Trigger Node' }
  ];

  const initialClusterData: ClusterData = {
    inputFile: '',
    retryCount: 0,
    retryDelay: 0,
    parameter: [],
    stop_cluster: '',
    cluster_name: ''
  };

  const initialServerlessData: ServerlessData = {
    inputFile: '',
    retryCount: 0,
    retryDelay: 0,
    parameter: [],
    serverless: ''
  };

  const initialTriggerData: TriggerData = {
    schedule_value: '',
    time_zone: ''
  };

  //const filteredNodeTypes = id === 0 ? nodeTypes : nodeTypes.filter(type => type !== 'Trigger Node');
  // const defaultNodeType = id === '0' ? 'Trigger Node' : '';
  //const defaultNodeType = data.inputFile ? 'Trigger Node' : '';
  const [nodeTypeSelected, setnodeTypeSelected] = useState('');
  const [clickedNodeData, setClickedNodeData] = useState<any>(null);
  const [previousNodeType, setPreviousNodeType] = useState('');

  // const handleNodeTypeChange = (value: any) => {
  //   setnodeTypeSelected(value);
  //   eventEmitter.emit(`nodeType`, value, id);
  //   data.nodetype = value;
  //   setPreviousNodeType(nodeTypeSelected);

  // };

  const handleNodeTypeChange = (value: string | null) => {
    console.log("handleNodetypechange")
    if (value) {
      setnodeTypeSelected(value);
      eventEmitter.emit(`nodeType`, value, id);
      if (value === 'trigger') {
        let clickedNode = nodes.find((node: any) => node.id === id);
        setClickedNodeData(initialTriggerData);
        data=initialTriggerData;
        clickedNode.data=data;
      } else if (value === 'serverless') {
        setClickedNodeData(initialServerlessData);
        data=initialServerlessData
      } else if (value === 'cluster') {
        setClickedNodeData(initialClusterData);
        data=initialClusterData;
      }
      data.nodetype = value;
      setPreviousNodeType(nodeTypeSelected);
    }
  };
  const handleCancel = () => {
    eventEmitter.emit(`closeForm`, false);
  };

  useEffect(() => {
    console.log("useeffect",nodes, id, data)
    const clickedNode = nodes.find((node: any) => node.id === id);
    console.log("clicked node",clickedNode, nodes)
    setClickedNodeData(clickedNode ? clickedNode.data : '');
    setnodeTypeSelected(clickedNode ? clickedNode.data.nodetype : null);
  }, [nodes]);

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
              options={nodeTypes}
              getOptionLabel={option => option.label}
              value={nodeTypes.find(option => option.key === nodeTypeSelected)}
              onChange={(_event, value) =>
                handleNodeTypeChange(value?.key || null)
              }
              renderInput={params => (
                <TextField {...params} label="Node Type*" />
              )}
            />
            {nodeTypeSelected === 'trigger' && (
              <TriggerJobForm id={id} data={clickedNodeData} nodes={nodes} />
            )}
            {nodeTypeSelected === 'serverless' && (
              <ClusterServerlessForm
                id={id}
                data={clickedNodeData}
                mode={'serverless'}
              />
            )}
            {nodeTypeSelected === 'cluster' && (
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
