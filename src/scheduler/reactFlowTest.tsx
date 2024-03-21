import React, { useCallback } from 'react';
import ReactFlow, {
  addEdge,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState
} from 'reactflow';

import {
  nodes as initialNodes,
  edges as initialEdges
} from './initial-element';
import CustomNode from './CustomNode';

import 'reactflow/dist/style.css';
import '../../style/overview.css';

const nodeTypes = {
  custom: CustomNode
};

const minimapStyle = {
  height: 120
};

const onInit = (reactFlowInstance: any) =>
  console.log('flow loaded:', reactFlowInstance);

const OverviewFlow = () => {
  const [nodes, , onNodesChange] = useNodesState<any>(initialNodes); // removed setNodes
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  console.log(nodes, edges)
  
  const onConnect = useCallback(
    (params: any) => setEdges((eds: any) => addEdge(params, eds)),
    []
  );

  // Explicitly define the type of `nodes` to avoid TypeScript inferring it as `never`.
  const nodesArray: any[] = nodes;

  // we are using a bit of a shortcut here to adjust the edge type
  // this could also be done with a custom edge for example
  const edgesWithUpdatedTypes = edges.map((edge: any) => {
    if (edge.sourceHandle) {
      const edgeType = nodesArray.find((node: any) => node.type === 'custom')
        .data[edge.sourceHandle];
      edge.type = edgeType;
    }

    return edge;
  });

  return (
    <div style={{ height: 800 }}>
      <ReactFlow
        nodes={nodes}
        edges={edgesWithUpdatedTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onInit={onInit}
        fitView
        attributionPosition="top-right"
        nodeTypes={nodeTypes}
      >
        <MiniMap style={minimapStyle} zoomable pannable />
        <Controls />
        <Background color="#aaa" gap={16} />
      </ReactFlow>
    </div>
  );
};

export default OverviewFlow;
