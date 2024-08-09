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

  const [isSelected, setIsSelected] = useState(selected);

  useEffect(() => {
    // Update the local state if the selected prop changes
    setIsSelected(selected);
  }, [selected]);

  const nodeLabel = data.inputFile
    ? `${id}.${data.inputFile}`
    : `${id}.New Node`;
  const [nodeSubLabel, setNodeSubLabel] = useState('');

  const [status, setStatus] = useState('');
  const handleNodeClick = () => {
    setClickedNodeId(id);
    setIsNodeClicked(true);
    setIsSelected(true)//select logic
    console.log('clicked node in notebook', clickedNodeId);
    eventEmitter.emit(`nodeClick`, id, isNodeClicked);
  };

  eventEmitter.on('unselectNode', (isCancel: boolean) => {
    setIsSelected(isCancel)
  });//need to recheck this

  useEffect(() => {
    if (id === '1') {
      setNodeSubLabel(
        data.scheduleValue === '' ? 'Run Now' : 'Run on Schedule'
      );
    } else {
      setNodeSubLabel(data.nodeType || '');
    }
  }, [id, data.scheduleValue, data.nodeType]);

  useEffect(() => {
    if (!data.nodeType) {
      setStatus('');
      return;
    }
    if (data.nodeType === 'Cluster' && (!data.inputFile || !data.clusterName)) {
      setStatus('incomplete');
    } else if (
      data.nodeType === 'Serverless' &&
      (!data.inputFile || !data.serverless)
    ) {
      setStatus('incomplete');
    } else {
      setStatus('complete');
    }
  }, [data.nodeType, data.inputFile, data.clusterName, data.serverless]);

  return (
    <>
      <div onClick={handleNodeClick}>
        <div className={isSelected ? 'selected-node' : 'notebook-node'}>
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
              <div className="node-column logo-column">
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
              </div>
              <div className="node-column header-column">
                <div className="node-header">
                  {id === '1' ? `${id}.Trigger Node` : nodeLabel}
                </div>
                <div className="node-subheader">{nodeSubLabel}</div>
              </div>
              <div className="node-column empty-column"></div>
            </div>
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
