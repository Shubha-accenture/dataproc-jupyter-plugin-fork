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
import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent
} from '@mui/material';

import '../../style/runtimeProfile.css';
import {
  IMachineTypeOption,
  NodeConfigurationType
} from './runtimeProfileInterface';
import {
  RuntimeProfileService,
  runtimeProfileService
} from './runtimeProfileService';

export interface INodeConfigurationProps {
  nodeType: NodeConfigurationType;
  setNodeType: (type: NodeConfigurationType) => void;
  executorMachineType: string;
  setExecutorMachineType: (machineType: string) => void;
  machineTypes: IMachineTypeOption[];
  setMachineTypes?: (types: IMachineTypeOption[]) => void;
  isLoadingOptions?: boolean;
  service?: RuntimeProfileService;
  handleNodeTypeChange?: (type: NodeConfigurationType) => void;
}

export const NodeConfiguration: React.FC<INodeConfigurationProps> = ({
  nodeType,
  setNodeType,
  executorMachineType,
  setExecutorMachineType,
  machineTypes,
  setMachineTypes,
  isLoadingOptions = false,
  service = runtimeProfileService,
  handleNodeTypeChange
}): React.JSX.Element => {
  const onNodeTypeChange = async (type: NodeConfigurationType) => {
    if (handleNodeTypeChange) {
      handleNodeTypeChange(type);
      return;
    }
    setNodeType(type);
    if (service && setMachineTypes) {
      try {
        const types = await service.getMachineTypes(type);
        setMachineTypes(types);
        if (types.length > 0) {
          setExecutorMachineType(types[0].name);
        }
      } catch (error) {
        console.error('Failed to fetch machine types for ' + type, error);
      }
    }
  };

  return (
    <div className="runtime-profile-section">
      <div className="runtime-profile-section-title">Node configuration</div>
      <div className="runtime-profile-section-subtitle">
        The size and configuration of the executors that run your workload. The
        driver is sized to match them unless you change it under driver
        configuration.
      </div>

      {/* Standard & Accelerated Cards */}
      <div className="node-config-cards-container">
        <div
          className={`node-config-card ${
            nodeType === 'standard' ? 'selected' : ''
          }`}
          onClick={() => onNodeTypeChange('standard')}
          role="button"
          tabIndex={0}
        >
          <div className="node-config-card-title">Standard</div>
          <div className="node-config-card-sub1">CPU only</div>
          <div className="node-config-card-sub2">
            For most ETL, SQL, and batch processing.
          </div>
        </div>

        <div
          className={`node-config-card ${
            nodeType === 'accelerated' ? 'selected' : ''
          }`}
          onClick={() => onNodeTypeChange('accelerated')}
          role="button"
          tabIndex={0}
        >
          <div className="node-config-card-title">Accelerated</div>
          <div className="node-config-card-sub1">GPUs attached</div>
          <div className="node-config-card-sub2">
            For model training and inference.
          </div>
        </div>
      </div>

      {/* Machine Type Subheading & Select */}
      <div className="machine-type-subheading">
        Shapes for common workloads, optimized for cost and flexibility
      </div>
      <div className="machine-type-select-wrapper">
        <FormControl size="small" fullWidth variant="outlined">
          <InputLabel id="runtime-profile-executor-machine-type-label" shrink>
            Executor machine type
          </InputLabel>
          <Select
            labelId="runtime-profile-executor-machine-type-label"
            id="runtime-profile-executor-machine-type"
            value={executorMachineType}
            label="Executor machine type"
            onChange={(e: SelectChangeEvent) =>
              setExecutorMachineType(e.target.value as string)
            }
            notched
            disabled={isLoadingOptions}
          >
            {machineTypes.map(m => (
              <MenuItem key={m.name} value={m.name}>
                {m.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </div>
    </div>
  );
};

export default NodeConfiguration;
