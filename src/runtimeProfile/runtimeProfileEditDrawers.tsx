/**
 * @license
 * Copyright 2026 Google LLC
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

import React, { useEffect, useState } from 'react';
import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField
} from '@mui/material';
import { EditDrawer } from '../controls/EditDrawer';
import { IRuntimeEnvironmentConfig } from './runtimeProfileInterface';
import {
  CUSTOM_CONTAINERS,
  CUSTOM_CONTAINER_MESSAGE,
  CUSTOM_CONTAINER_MESSAGE_PART
} from '../utils/const';

export const RUNTIME_VERSION_OPTIONS: string[] = [
  '2.3 LTS (Spark 3.5.1, Python 3.12)',
  '2.2 LTS (Spark 3.5, Java 17, Scala 2.13)',
  '1.2 LTS (Spark 3.5, Java 17, Scala 2.12)',
  '1.1 LTS (Spark 3.3, Java 11, Scala 2.12)'
];

export interface IRuntimeEnvironmentEditDrawerProps {
  open: boolean;
  config: IRuntimeEnvironmentConfig;
  onClose: () => void;
  onSave: (updatedConfig: IRuntimeEnvironmentConfig) => void;
}

export const RuntimeEnvironmentEditDrawer: React.FC<
  IRuntimeEnvironmentEditDrawerProps
> = ({ open, config, onClose, onSave }) => {
  const [draftConfig, setDraftConfig] =
    useState<IRuntimeEnvironmentConfig>(config);

  useEffect(() => {
    if (open) {
      setDraftConfig(config);
    }
  }, [open, config]);

  const handleFieldChange = (
    field: keyof IRuntimeEnvironmentConfig,
    value: string
  ) => {
    setDraftConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const versionOptions = React.useMemo(() => {
    const current = draftConfig.runtimeVersion;
    if (current && !RUNTIME_VERSION_OPTIONS.includes(current)) {
      return [current, ...RUNTIME_VERSION_OPTIONS];
    }
    return RUNTIME_VERSION_OPTIONS;
  }, [draftConfig.runtimeVersion]);

  const openExternalLink = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <EditDrawer
      open={open}
      title="Runtime configuration"
      onClose={onClose}
      onSave={() => onSave(draftConfig)}
    >
      <TextField
        id="edit-runtime-profile-id"
        label="Runtime Profile ID"
        value={draftConfig.runtimeProfileId ?? ''}
        onChange={e => handleFieldChange('runtimeProfileId', e.target.value)}
        variant="outlined"
        size="small"
        fullWidth
        InputLabelProps={{ shrink: true }}
      />

      <FormControl size="small" fullWidth variant="outlined">
        <InputLabel id="edit-dataproc-runtime-version-label" shrink>
          Dataproc Runtime Version
        </InputLabel>
        <Select
          labelId="edit-dataproc-runtime-version-label"
          id="edit-dataproc-runtime-version"
          label="Dataproc Runtime Version"
          notched
          value={draftConfig.runtimeVersion ?? ''}
          onChange={e =>
            handleFieldChange('runtimeVersion', e.target.value as string)
          }
        >
          {versionOptions.map(version => (
            <MenuItem key={version} value={version}>
              {version}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <div className="edit-drawer-field-group">
        <TextField
          id="edit-custom-spark-image"
          label="Custom spark image"
          value={draftConfig.customSparkImage ?? ''}
          onChange={e => handleFieldChange('customSparkImage', e.target.value)}
          variant="outlined"
          size="small"
          fullWidth
          InputLabelProps={{ shrink: true }}
        />
        <div className="edit-drawer-helper-text">
          {CUSTOM_CONTAINER_MESSAGE} {CUSTOM_CONTAINER_MESSAGE_PART} Container
          Registry or Artifact Registry.{' '}
          <span
            role="button"
            tabIndex={0}
            className="section-detail-link"
            onClick={() => openExternalLink(CUSTOM_CONTAINERS)}
            onKeyDown={e => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                openExternalLink(CUSTOM_CONTAINERS);
              }
            }}
          >
            Learn more
          </span>
        </div>
      </div>

      <div className="edit-drawer-input-with-button">
        <TextField
          id="edit-cloud-storage-staging-bucket"
          label="Cloud Storage Staging bucket"
          value={draftConfig.stagingBucket ?? ''}
          onChange={e => handleFieldChange('stagingBucket', e.target.value)}
          variant="outlined"
          size="small"
          fullWidth
          InputLabelProps={{ shrink: true }}
        />
        <button
          type="button"
          className="edit-drawer-browse-btn"
          onClick={() => {
            // TODO - add bucket browser modal interaction
          }}
        >
          Browse
        </button>
      </div>

      <div className="edit-drawer-field-group">
        <TextField
          id="edit-python-package-repository"
          label="Python package repository"
          value={draftConfig.pythonPackageRepository ?? ''}
          onChange={e =>
            handleFieldChange('pythonPackageRepository', e.target.value)
          }
          variant="outlined"
          size="small"
          fullWidth
          InputLabelProps={{ shrink: true }}
        />
        <div className="edit-drawer-helper-text">
          Enter the URI for the repository to install Python packages. By
          default packages are installed to PyPI pull-through cache on Google
          Cloud.
        </div>
      </div>
    </EditDrawer>
  );
};
