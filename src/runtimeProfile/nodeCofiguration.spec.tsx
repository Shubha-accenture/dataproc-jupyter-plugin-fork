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

import React from 'react';
import { NodeConfiguration } from './nodeCofiguration';
import { RuntimeProfileService } from './runtimeProfileService';
import { IMachineTypeOption } from './runtimeProfileInterface';

describe('NodeConfiguration Component', () => {
  const mockMachineTypes: IMachineTypeOption[] = [
    { name: 'highmem-4', label: '4 vCPU, 32 GB RAM', category: 'standard' },
    { name: 'highmem-8', label: '8 vCPU, 64 GB RAM', category: 'standard' }
  ];

  it('should be defined and export a React component', () => {
    expect(NodeConfiguration).toBeDefined();
    expect(typeof NodeConfiguration).toBe('function');
  });

  it('should instantiate element with props correctly', () => {
    const setNodeType = jest.fn();
    const setExecutorMachineType = jest.fn();
    const setMachineTypes = jest.fn();
    const mockService = new RuntimeProfileService(true);

    const element = React.createElement(NodeConfiguration, {
      nodeType: 'standard',
      setNodeType,
      executorMachineType: 'highmem-4',
      setExecutorMachineType,
      machineTypes: mockMachineTypes,
      setMachineTypes,
      isLoadingOptions: false,
      service: mockService
    });

    expect(element).toBeDefined();
    expect(element.type).toBe(NodeConfiguration);
    expect(element.props.nodeType).toBe('standard');
    expect(element.props.executorMachineType).toBe('highmem-4');
  });
});
