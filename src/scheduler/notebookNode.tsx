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
      <div className="notebook-node"onClick={handleNodeClick}>
      {/* <div className={(nodeType === 'Execute a SQL on BigQuery')?("box orange"): ("box black")}>  */}
      <div className={(nodeType === 'Trigger Node') ? "box red" : (nodeType === 'Execute a SQL on BigQuery') ? "box orange" : "box black"}>
        <Handle
          type="target"
          position={Position.Top}
          isConnectable={isConnectable}
          // style={{display:'none'}}
        />
        <div className='node-content'>
          <div>
            {(nodeType === 'Run a notebook on dataproc serverless' ||
              nodeType === 'Run a notebook on dataproc cluster') && (
              <iconCalendarRange.react
                tag="div"
                className="logo-alignment-react-flow"
              />
            )}
            {nodeType === 'Execute a SQL on BigQuery' && (
              <iconSaveToBigQuery.react
                tag="div"
                className="logo-alignment-react-flow"
              />
            )}
          </div>
          <div className="custom-node__header">
            {id}.{data.inputFile ? data.inputFile : 'Notebook'}
          </div>
          {data.inputFile && ("Trigger node")}
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
