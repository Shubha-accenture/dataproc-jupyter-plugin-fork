import React, { useCallback } from "react";
import { Handle, Position, NodeProps } from "reactflow";

function NotebookNode({ data, isConnectable }: NodeProps) {
  const onChange = useCallback((evt: React.ChangeEvent<HTMLInputElement>) => {
    data.value1 = evt.target.value
  }, []);

  return (
    <div className="notebook-node">
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
      />
      <div className="custom-node__header">
        Notebook Name
      </div>
      <div className="custom-node__body">
        <div>
            <label htmlFor="text">Text:</label>
            <input id="text" name="text" onChange={onChange} className="nodrag" />
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        id="b"
        isConnectable={isConnectable}
      />
    </div>
  );
}

export default NotebookNode;
