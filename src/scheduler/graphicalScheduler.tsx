import React, { useCallback, useEffect, useRef } from 'react';
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
import { eventEmitter } from '../utils/signalEmitter';
import * as path from 'path';
import { JupyterLab } from '@jupyterlab/application';
import { IFileBrowserFactory } from '@jupyterlab/filebrowser';

interface IGraphicalSchedulerProps {
  inputFileSelected: string;
  NodesChange: (updatedNodes: any) => void;
  EdgesChange: (updatedEdges: any) => void;
  NodesOrderChange: (nodesOrder: any) => void;
  app: JupyterLab;
  factory: IFileBrowserFactory;
}
const nodeTypes = { notebookNode: NotebookNode };

const GraphicalScheduler = ({
  inputFileSelected,
  NodesChange,
  EdgesChange,
  NodesOrderChange,
  app,
  factory
}: IGraphicalSchedulerProps) => {
  const reactFlowWrapper = useRef(null);
  const connectingNodeId = useRef<string | null>(null);
  const nodesOrderRef = useRef<any[]>([]);
let id = 1;
const getId = () => `${id++}`;

  const initialNode = [
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

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNode);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  // const findRootNode = (nodes: any[], edges: any[], deletedNodeId: string) => {
  //   if (deletedNodeId === '0') {
  //     const incomingNodes = new Set(edges.map(edge => edge.target));
  //     for (const node of nodes) {
  //       if (!incomingNodes.has(node.id)) {
  //         return node.id;
  //       }
  //     }
  //   }
  //   return '0';
  // };

  // const deletedNodeId = '0';
  // // const rootId = findRootNode(nodes, edges, deletedNodeId);
  // // console.log('Root Node Id:', rootId);

  const createNodeOrder = (nodes: any[], edges: any[]) => {
    const priorityNodes = ['0'];
    const remainingNodes = new Set();
    for (const edge of edges) {
      // for level 1
      if (edge.source === '0') {
        priorityNodes.push(edge.target);
      } else {
        remainingNodes.add(edge.target);
      }
    }
    //for next level
    for (const edge of edges) {
      if (!priorityNodes.includes(edge.target)) {
        priorityNodes.push(edge.target);
      }
    }
    const sortedNodes = priorityNodes
      .map((nodeId: any) => nodes.find(node => node.id === nodeId))
      .filter(Boolean);
    return sortedNodes;
  };

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

  eventEmitter.on(
    'uploadProgress',
    (event: any, data: any, setInputFileSelected: any) => {
      handleFileUpload(event, data, setInputFileSelected);
    }
  );

  const handleFileUpload = async (
    event: any,
    data: any,
    setInputFileSelected: any
  ) => {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files || []);
    if (files && files.length > 0) {
      files.forEach((fileData: any) => {
        const file = fileData;
        const reader = new FileReader();
        // Read the file as text
        reader.onloadend = async () => {
          const contentsManager = app.serviceManager.contents;
          const { tracker } = factory;
          // Get the current active widget in the file browser
          const widget = tracker.currentWidget;
          if (!widget) {
            console.error('No active file browser widget found.');
            return;
          }
          // Define the path to the 'notebookTemplateDownload' folder within the local application directory
          const notebookTemplateDownloadFolderPath = widget.model.path.includes(
            'gs:'
          )
            ? ''
            : widget.model.path;
          // const urlParts = file.name
          const filePath = `${notebookTemplateDownloadFolderPath}${path.sep}${file.name}`;
          const newFilePath = filePath.startsWith('/')
            ? filePath.substring(1)
            : filePath;
          setInputFileSelected(newFilePath);
          data.inputFile = newFilePath;

          // const fileExtension = filePath.split('.').pop(); // Get the file extension
          // if (fileExtension && fileExtension.toLowerCase() !== 'ipynb') {
          //   // If the file extension is not 'ipynb', display an error message or handle it as required
          //   console.error('Only .ipynb files are allowed.');
          //   // Additional handling if necessary
          // }
          // Save the file to the workspace
          await contentsManager.save(filePath, {
            type: 'file',
            format: 'text',
            content: reader.result as string
          });

          // Refresh the file fileBrowser to reflect the new file
          app.shell.currentWidget?.update();
        };
        reader.readAsText(file);
      });
    }
  };

  useEffect(() => {
    const nodePriority = createNodeOrder(nodes, edges);
    nodesOrderRef.current = nodePriority;
  }, [edges]);
  
  useEffect(() => {
    NodesChange(nodes);
  }, [nodes]);

  EdgesChange(edges);
  NodesOrderChange(nodesOrderRef.current);

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
        //deleteKeyCode={null : 'Delete'}
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
      NodesOrderChange={props.NodesOrderChange}
      app={props.app}
      factory={props.factory}
    />
  </ReactFlowProvider>
);
