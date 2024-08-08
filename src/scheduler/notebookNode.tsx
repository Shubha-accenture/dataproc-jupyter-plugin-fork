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

function NotebookNode({ id, data, selected,isConnectable }: NodeProps) {
  const [clickedNodeId, setClickedNodeId]=useState('');
  const [isNodeClicked, setIsNodeClicked] = useState(false);
  const nodeLabel = data.inputFile ? `${id}.${data.inputFile}` : `${id}.${data.nodeType} Node`;

  // const [status, setStatus] = useState('');

  //console.log(data)
  const handleNodeClick = () => {
    setClickedNodeId(id)
    setIsNodeClicked(true);
    console.log("clicked node in notebook",clickedNodeId)
    eventEmitter.emit(`nodeClick`, id, isNodeClicked);
  };

  // eventEmitter.on('color coding', value: string, id:string) => {
  //   console.log(status,id);
  //   setStatus(value);
  // });
  // eventEmitter.on('nodeType', (value: string, nid: string) => {
  //   if (id === nid) {
  //     setNodeType(value);
  //   }
  // }); 

  return (
    <>
    <div  onClick={handleNodeClick}>
      <div className={selected ? "selected-node":"notebook-node"}>
        <div
          className= "box black" 
          // {`box ${
          //   status === 'complete'
          //     ? 'green'
          //     : status === 'incomplete'
          //     ? 'orange'
          //     : 'black'
          // }`}
        />
        <Handle
          type="target"
          id="a"
          position={Position.Top}
          isConnectable={false}
        />
        <div className="node-content">
          <div>
            {(data.nodeType === 'Serverless' || data.nodeType === 'Cluster') && (
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
          <div className="custom-node__header">
            {id === '0' ? 'Trigger Node ' : nodeLabel}
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
