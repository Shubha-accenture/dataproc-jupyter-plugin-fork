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


  //const filteredNodeTypes = id === 0 ? nodeTypes : nodeTypes.filter(type => type !== 'Trigger Node');
  const defaultNodeType = id === '0' ? 'Trigger Node' : '';
  //const defaultNodeType = data.inputFile ? 'Trigger Node' : '';
  const [nodeTypeSelected, setnodeTypeSelected] = useState(defaultNodeType);
  const [clickedNodeData, setClickedNodeData] = useState<any>(null);
  const [previousNodeType, setPreviousNodeType] = useState('');

  console.log(data)
  if(data && data.nodeType!=='')
  {console.log("to check",id,data,)
}
  // const handleNodeTypeChange = (value: any) => {
  //   setnodeTypeSelected(value);
  //   eventEmitter.emit(`nodeType`, value, id);
  //   data.nodetype = value;
  //   setPreviousNodeType(nodeTypeSelected);

  // };

  const handleNodeTypeChange = (value: string | null) => {
    if (value) {
      setnodeTypeSelected(value);
      eventEmitter.emit(`nodeType`, value, id);
      data.nodeType = value;
      setPreviousNodeType(nodeTypeSelected);
    }
  };
  const handleCancel = () => {
    eventEmitter.emit(`closeForm`, false);
  };

  useEffect(() => {
    const clickedNode = nodes.find((node: any) => node.id === id);
    setClickedNodeData(clickedNode ? clickedNode.data : '');
    setnodeTypeSelected(clickedNode ? clickedNode.data.nodeType : null);
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
              options={nodeTypes}
              defaultValue={nodeTypes.find(option => option.key === defaultNodeType)}
              getOptionLabel={option => option.label}
              value={nodeTypes.find(option => option.key === nodeTypeSelected)}
              onChange={(_event, value) =>
                handleNodeTypeChange(value?.key || null)
              }
              renderInput={params => (
                <TextField {...params} label="Node Type*" />
              )}
            />
            {nodeTypeSelected === 'Trigger' && (
              <TriggerJobForm id={id} data={clickedNodeData} nodes={nodes} />
            )}
            {nodeTypeSelected === 'Serverless' && (
              <ClusterServerlessForm
                id={id}
                data={clickedNodeData}
                mode={'serverless'}
              />
            )}
            {nodeTypeSelected === 'Cluster' && (
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
