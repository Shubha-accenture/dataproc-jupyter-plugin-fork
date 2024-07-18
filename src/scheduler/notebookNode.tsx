import React, { useState } from 'react';
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

function NotebookNode({ id, data, isConnectable }: NodeProps) {
  const [isNodeClicked, setIsNodeClicked] = useState('');
  const [nodeType, setNodeType] = useState('');

  const handleNodeClick = () => {
    setIsNodeClicked(id);
    eventEmitter.emit(`nodeClick`, id, isNodeClicked);
  };

  eventEmitter.on('nodeType', (value: string, nid: string) => {
    if (id === nid) {
      setNodeType(value);
    }
  });

  return (
    <>
      <div className="notebook-node" onClick={handleNodeClick}>
        <div className="box black" />
        <Handle
          type="target"
          id="a"
          position={Position.Top}
          isConnectable={false}
        />
        <div className="node-content">
          <div>
            {(nodeType === 'serverless' ||
              nodeType === 'cluster') && (
              <iconCalendarRange.react
                tag="div"
                className="logo-alignment-react-flow"
              />
            )}
            {nodeType === 'sql' && (
              <iconSaveToBigQuery.react
                tag="div"
                className="logo-alignment-react-flow"
              />
            )}
          </div>
          <div className="custom-node__header">
            {id}.{'Notebook'}
          </div>
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
