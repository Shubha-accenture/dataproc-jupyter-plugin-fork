import React, { useState } from 'react';
import { Handle, NodeProps, Position } from 'reactflow';

import { eventEmitter } from '../utils/signalEmitter';

function NotebookNode({ id, data, isConnectable}: NodeProps) {
  const [isNodeClicked, setIsNodeClicked] = useState('');
  const handleNodeClick = () => {
    setIsNodeClicked(id);
    eventEmitter.emit(`nodeClick`,id,isNodeClicked)
  };
  return (
    <>
      <div className="notebook-node" onClick={handleNodeClick}>
        <Handle
          type="target"
          position={Position.Top}
          isConnectable={isConnectable}
        />
        <div className="custom-node__header">
          {data.inputFile
            ? data.inputFile
            : 'Notebook:'}{id}
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
