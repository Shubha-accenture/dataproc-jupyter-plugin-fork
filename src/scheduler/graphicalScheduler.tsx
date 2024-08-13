/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
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
import { eventEmitter } from '../utils/signalEmitter';
import * as path from 'path';
import { JupyterLab } from '@jupyterlab/application';
import { IFileBrowserFactory } from '@jupyterlab/filebrowser';
import Grid from '@mui/material/Grid';
import ConfigureForm from './configureForms';
import JobForm from './jobForm';

interface IGraphicalSchedulerProps {
  inputFileSelected: string;
  NodesChange: (updatedNodes: any) => void;
  EdgesChange: (updatedEdges: any) => void;
  app: JupyterLab;
  factory: IFileBrowserFactory;
  jobPayload: any;
  setJobPayload: any;
}
const nodeTypes = { composerNode: NotebookNode };

const GraphicalScheduler = ({
  inputFileSelected,
  NodesChange,
  EdgesChange,
  app,
  factory,
  jobPayload,
  setJobPayload
}: IGraphicalSchedulerProps) => {
  const reactFlowWrapper = useRef(null);
  const connectingNodeId = useRef<string | null>(null);

  const initialNode = [
    {
      id: '1',
      type: 'composerNode',
      position: { x: 0, y: 0 },
      data: {
        nodeType: 'Trigger',
        inputFile: inputFileSelected,
        retryCount: 0,
        retryDelay: 0,
        parameter: [],
        stopCluster: '',
        clusterName: '',
        serverless: '',
        scheduleValue: '',
        timeZone: ''
      }
    }
  ];

  let nodeId = initialNode.length + 1;
  const getNodeId = () => `${nodeId++}`;
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNode);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [isTaskFormVisible, setIsTaskFormVisible] = useState(true);
  const [clickedNodeId, setClickedNodeId] = useState<string | null>(null);
  const [clickedNodeData, setClickedNodeData] = useState<any>(null);
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
          const nodeId = getNodeId();
          const e = event as MouseEvent;
          const newNode = {
            id: nodeId,
            type: 'composerNode',
            position: screenToFlowPosition({
              x: e.clientX,
              y: e.clientY
            }),
            data: {
              nodeType: '',
              inputFile: inputFileSelected,
              retryCount: 2,
              retryDelay: 5,
              parameter: [],
              stopCluster: '',
              clusterName: '',
              serverless: '',
              scheduleValue: '',
              timeZone: ''
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

  eventEmitter.on('uploadProgress', (event: any, data: any) => {
    handleFileUpload(event, data);
  });

  const handleFileUpload = async (event: any, data: any) => {
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
          data.inputFile = newFilePath;

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

  eventEmitter.on('nodeClick', (id: string, isNodeClicked: boolean) => {
    setClickedNodeId(id);
    if (isNodeClicked) {
      setIsTaskFormVisible(true);
    }
  });

  useEffect(() => {
    NodesChange(transformedNodes);
  }, [nodes]);

  useEffect(() => {
    if (clickedNodeId) {
      const clickedNode = nodes.find(node => node.id === clickedNodeId);
      setClickedNodeData(clickedNode?.data);
      setIsTaskFormVisible(true);
    } else {
      setIsTaskFormVisible(false);
    }
  }, [clickedNodeId, nodes]);

  EdgesChange(edges);
  const transformNodeData = (nodes: any) => {
    return nodes.map((node: any) => {
      if (node.data.nodeType === 'Trigger') {
        return {
          ...node,
          data: {
            nodeType: node.data.nodeType,
            scheduleValue: node.data.scheduleValue,
            timeZone: node.data.timeZone
          }
        };
      } else if (node.data.nodeType === 'Cluster') {
        return {
          ...node,
          data: {
            nodeType: node.data.nodeType,
            inputFile: node.data.inputFile,
            retryCount: node.data.retryCount,
            retryDelay: node.data.retryDelay,
            parameter: node.data.parameter,
            stopCluster: node.data.stopCluster,
            clusterName: node.data.clusterName
          }
        };
      } else if (node.data.nodeType === 'Serverless') {
        return {
          ...node,
          data: {
            nodeType: node.data.nodeType,
            inputFile: node.data.inputFile,
            retryCount: node.data.retryCount,
            retryDelay: node.data.retryDelay,
            parameter: node.data.parameter,
            serverless: node.data.serverless
          }
        };
      }
      return node;
    });
  };

  const transformedNodes = transformNodeData(nodes);

  return (
    <>
      <Grid container spacing={0} style={{ height: '100vh' }}>
        <Grid item xs={8}>
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
        </Grid>
        {isTaskFormVisible && (
          <Grid item xs={4}>
            <ConfigureForm
              id={clickedNodeId}
              data={clickedNodeData}
              nodes={nodes}
              setTaskFormVisible={setIsTaskFormVisible}
            />
          </Grid>
        )}
        {!isTaskFormVisible && (
          <Grid item xs={4}>
            <JobForm jobPayload={jobPayload} setJobPayload={setJobPayload} />
          </Grid>
        )}
      </Grid>
    </>
  );
};

export default (props: IGraphicalSchedulerProps) => (
  <ReactFlowProvider>
    <GraphicalScheduler
      inputFileSelected={props.inputFileSelected}
      NodesChange={props.NodesChange}
      EdgesChange={props.EdgesChange}
      app={props.app}
      factory={props.factory}
      jobPayload={props.jobPayload}
      setJobPayload={props.setJobPayload}
    />
  </ReactFlowProvider>
);
