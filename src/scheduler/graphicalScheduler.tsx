import React, { useCallback, useRef } from "react";
import type { MouseEvent as ReactMouseEvent, TouchEvent as ReactTouchEvent } from "react";
import ReactFlow, {
  useNodesState,
  useEdgesState,
  addEdge,
  useReactFlow,
  Connection,
  OnConnectStartParams,
  Edge,
  ReactFlowProvider,
  Controls,
  Background
} from "reactflow";
import "reactflow/dist/style.css";
import NotebookNode from "./notebookNode"
import "../../style/reactFlow.css";
import "../../style/notebookNode.css";

const initialNodes = [
  {
    id: "0",
    type: "notebookNode",
    position: { x: 0, y: 0 },
    data: { value1: '' },
  }
];

const nodeTypes = { notebookNode: NotebookNode };

let id = 1;
const getId = () => `${id++}`;

const GraphicalScheduler = () => {
  const reactFlowWrapper = useRef(null);
  const connectingNodeId = useRef<string | null>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const { screenToFlowPosition } = useReactFlow();
  const onConnect = useCallback((params: Connection) => {
    // reset the start node on connections
    connectingNodeId.current = null;
    setEdges((eds) => addEdge(params, eds));
  }, []);

  const onConnectStart = useCallback((_: ReactMouseEvent | ReactTouchEvent, { nodeId }: OnConnectStartParams) => {
    connectingNodeId.current = nodeId;
  }, []);

  const onConnectEnd = useCallback(
    (event: MouseEvent | TouchEvent) => {
      if (!connectingNodeId.current) return;
      if (event.target instanceof HTMLElement) {
        const targetIsPane = event.target.classList.contains("react-flow__pane");
        if (targetIsPane) {
          // we need to remove the wrapper bounds, in order to get the correct position
          const nodeId = getId();
          const e = event as MouseEvent;
          const newNode = {
            id: nodeId,
            type: 'notebookNode',
            position: screenToFlowPosition({
              x: e.clientX,
              y: e.clientY,
            }),
            data: { value1: '' },
            origin: [0.5, 0.0],
          };
          setNodes((nds) => nds.concat(newNode));
          const newEdge: Edge = { id: nodeId, source: connectingNodeId.current, target: nodeId }
          setEdges((eds) =>
            eds.concat(newEdge)
          );
        }
      }
    },
    [screenToFlowPosition]
  );

  console.log(nodes);
  console.log(edges);

  return (
    <div className="wrapper" ref={reactFlowWrapper}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onConnectStart={onConnectStart}
        onConnectEnd={onConnectEnd}
        fitView
        fitViewOptions={{ padding: 2 }}
        nodeOrigin={[0.5, 0]}
        nodeTypes={nodeTypes}>
      <Controls />
      <Background color="#aaa" gap={6} />
      </ReactFlow>
    </div>
  )
};

// export default GraphicalScheduler;
export default () => (
  <ReactFlowProvider>
    <GraphicalScheduler />
  </ReactFlowProvider>
);