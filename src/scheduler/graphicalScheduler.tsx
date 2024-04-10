import React, { useCallback, useRef } from 'react';
import type {
  MouseEvent as ReactMouseEvent,
  TouchEvent as ReactTouchEvent
} from 'react';
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
} from 'reactflow';
import 'reactflow/dist/style.css';
import NotebookNode from './notebookNode';
import '../../style/reactFlow.css';
import '../../style/notebookNode.css';

interface IGraphicalSchedulerProps {
  inputFileSelected:string;
  NodesChange: (updatedNodes: any) => void;
  EdgesChange: (updatedEdges: any) => void;
}
const nodeTypes = { notebookNode: NotebookNode };
  
let id = 1;
const getId = () => `${id++}`;

const GraphicalScheduler = ({
  inputFileSelected,
  NodesChange,
  EdgesChange,
}: IGraphicalSchedulerProps) => {
  const reactFlowWrapper = useRef(null);
  const connectingNodeId = useRef<string | null>(null);

  const initialNodes = [
    {
      id: '0',
      type: 'notebookNode',
      position: { x: 0, y: 0 },
      data: {
        inputFile: inputFileSelected,
        retryCount: 0,
        retryDelay: 0,
        parameter: []
      }
    }
  ];
  
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const { screenToFlowPosition } = useReactFlow();
  const onConnect = useCallback((params: Connection) => {
    // reset the start node on connections
    connectingNodeId.current = null;
    setEdges((eds: any) => addEdge(params, eds));
  }, []);

  const onConnectStart = useCallback(
    (
      _: ReactMouseEvent | ReactTouchEvent,
      { nodeId }: OnConnectStartParams
    ) => {
      connectingNodeId.current = nodeId;
    },
    []
  );

  const onConnectEnd = useCallback(
    (event: MouseEvent | TouchEvent) => {
      if (!connectingNodeId.current) return;
      if (event.target instanceof HTMLElement) {
        const targetIsPane =
          event.target.classList.contains('react-flow__pane');
        if (targetIsPane) {
          // we need to remove the wrapper bounds, in order to get the correct position
          const nodeId = getId();
          const e = event as MouseEvent;
          const newNode = {
            id: nodeId,
            type: 'notebookNode',
            position: screenToFlowPosition({
              x: e.clientX,
              y: e.clientY
            }),
            data: {
              inputFile: '',
              retryCount: 0,
              retryDelay: 0,
              parameter: []
            },
            origin: [0.5, 0.0]
          };
          setNodes(nds => nds.concat(newNode));
          const newEdge: Edge = {
            id: nodeId,
            source: connectingNodeId.current,
            target: nodeId
          };
          setEdges(eds => eds.concat(newEdge));
        }
      }
    },
    [screenToFlowPosition]
  );
  NodesChange(nodes);
  EdgesChange(edges);

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
        nodeTypes={nodeTypes}
      >
        <Controls />
        <Background color="#aaa" gap={6} />
      </ReactFlow>
    </div>
  );
};

export default (props: IGraphicalSchedulerProps) => (
  <ReactFlowProvider>
    <GraphicalScheduler
      inputFileSelected={props.inputFileSelected}
      NodesChange={props.NodesChange}
      EdgesChange={props.EdgesChange} 
    />
  </ReactFlowProvider>
);
