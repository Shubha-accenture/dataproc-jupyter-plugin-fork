import React, { useState } from 'react';
import { Handle, NodeProps, Position } from 'reactflow';

import { eventEmitter } from '../utils/signalEmitter';
import { LabIcon } from '@jupyterlab/ui-components';
import calendarRangeIcon from '../../style/icons/calendar-range.svg';

const iconCalendarRange = new LabIcon({
  name: 'launcher:calendar-range-icon',
  svgstr: calendarRangeIcon
});

function NotebookNode({ id, data, isConnectable }: NodeProps) {
  const [isNodeClicked, setIsNodeClicked] = useState('');

  const handleNodeClick = () => {
    setIsNodeClicked(id);
    console.log('event emitter from notebooknode for id', id);
    eventEmitter.emit(`nodeClick`, id, isNodeClicked);
  };

  return (
    <>
      <div className="notebook-node" onClick={handleNodeClick}>
        <Handle
          type="target"
          position={Position.Top}
          isConnectable={isConnectable}
          style={{}}
        />
        <div>
          //html for rectangle with class
          <iconCalendarRange.react
            tag="div"
            className="logo-alignment-react-flow"
          />
          <div className="custom-node__header">
            {id}.{data.inputFile ? data.inputFile : 'Notebook'}
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
