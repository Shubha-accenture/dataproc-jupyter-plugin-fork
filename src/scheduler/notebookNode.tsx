import React, { useEffect, useState } from 'react';
import { Handle, NodeProps, Position } from 'reactflow';

import { eventEmitter } from '../utils/signalEmitter';
import { LabIcon } from '@jupyterlab/ui-components';
import calendarRangeIcon from '../../style/icons/calendar-range.svg';
import saveToBigQueryIcon from '../../style/icons/save_to_bigQuery.svg';

const iconCalendarRange = new LabIcon({
  name: 'launcher:calendar-range-icon',
  svgstr: calendarRangeIcon
});

const iconSaveToBigQuery = new LabIcon({
  name: 'launcher:save-to-bigQuery-icon',
  svgstr: saveToBigQueryIcon
});

function NotebookNode({ id, data, selected, isConnectable }: NodeProps) {
  const [clickedNodeId, setClickedNodeId] = useState('');
  const [isNodeClicked, setIsNodeClicked] = useState(false);
  const nodeLabel = data.inputFile
    ? `${id}.${data.inputFile}`
    : `${id}.New Node`;
  const nodeSubLabel =
    id === '0'
      ? data.scheduleValue === ''
        ? 'Run Now'
        : 'Run on Schedule' //here
      : data.nodeType || '';

  const [status, setStatus] = useState('');
  const handleNodeClick = () => {
    setClickedNodeId(id);
    setIsNodeClicked(true);
    console.log('clicked node in notebook', clickedNodeId);
    eventEmitter.emit(`nodeClick`, id, isNodeClicked);
  };

  useEffect(() => {
    if (
      data &&
      data.nodeType === 'Cluster' &&
      data.inputFile !== '' &&
      data.clusterName !== ''
    ) {
      setStatus('complete');
    }
  }, []);

  return (
    <>
      <div onClick={handleNodeClick}>
        <div className={selected ? 'selected-node' : 'notebook-node'}>
          <div
            className={`box ${
              status === 'complete'
                ? 'green'
                : status === 'incomplete'
                ? 'orange'
                : 'black'
            }`}
          />
          <Handle
            type="target"
            id="a"
            position={Position.Top}
            isConnectable={false}
          />
          <div className="node-content">
            <div className="node-parent">
              <div className="node-logo">
                {(data.nodeType === 'Serverless' ||
                  data.nodeType === 'Cluster') && (
                  <iconCalendarRange.react
                    tag="div"
                    className="logo-alignment-react-flow"
                  />
                )}
                {data.nodeType === 'sql' && (
                  <iconSaveToBigQuery.react
                    tag="div"
                    className="logo-alignment-react-flow"
                  />
                )}
              </div>
              <div className="node-header">
                {id === '0' ? 'Trigger Node ' : nodeLabel}
              </div>
            </div>
            <div className="node-subheader">{nodeSubLabel}</div>
          </div>
          <Handle
            type="source"
            position={Position.Bottom}
            id="b"
            isConnectable={isConnectable}
          />
        </div>
      </div>
    </>
  );
}

export default NotebookNode;
