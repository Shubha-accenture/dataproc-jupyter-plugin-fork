// import React from 'react';
import { MarkerType } from 'reactflow';

export let nodes = [
  {
    id: '1',
    data: {
      label: 'Default Node',
    },
    position: { x: 400, y: 325 },
  },
  {
    id: '2',
    type: 'custom',
    position: { x: 100, y: 200 },
    data: {
        inputFile: "",
        retryCount: 0,
        retryDelay: 0,
    },
  },
];

export let edges = [
  { id: 'e1-2', source: '1', target: '2', label: 'this is an edge label' },
  { id: 'e1-3', source: '1', target: '3', animated: true },
  {
    id: 'e4-5',
    source: '4',
    target: '5',
    type: 'smoothstep',
    sourceHandle: 'handle-0',
    data: {
      selectIndex: 0,
    },
    markerEnd: {
      type: MarkerType.ArrowClosed,
    },
  },
  {
    id: 'e4-6',
    source: '4',
    target: '6',
    type: 'smoothstep',
    sourceHandle: 'handle-1',
    data: {
      selectIndex: 1,
    },
    markerEnd: {
      type: MarkerType.ArrowClosed,
    },
  },
];

