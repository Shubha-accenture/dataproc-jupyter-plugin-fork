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
  Checkbox,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  TextField
} from '@mui/material';
import { EditDrawer } from '../controls/EditDrawer';
import {
  IAutoscalingConfig,
  IRuntimeEnvironmentConfig,
  ISessionLifecycleConfig,
  ProfileLabels,
  SparkProperties,
  TimeUnit
} from './runtimeProfileInterface';
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

export const TIME_UNIT_OPTIONS: { value: TimeUnit; label: string }[] = [
  { value: 'minutes', label: 'minutes' },
  { value: 'hours', label: 'hours' },
  { value: 'days', label: 'days' },
  { value: 'seconds', label: 'seconds' }
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

export interface IAutoscalingEditDrawerProps {
  open: boolean;
  config: IAutoscalingConfig;
  onClose: () => void;
  onSave: (updatedConfig: IAutoscalingConfig) => void;
}

export const AutoscalingEditDrawer: React.FC<IAutoscalingEditDrawerProps> = ({
  open,
  config,
  onClose,
  onSave
}) => {
  const [draftConfig, setDraftConfig] = useState<IAutoscalingConfig>(config);

  useEffect(() => {
    if (open) {
      setDraftConfig(config);
    }
  }, [open, config]);

  const isAutoscalingEnabled = draftConfig.autoscalingEnabled ?? true;

  const handleNumberChange = (
    field: 'initialExecutors' | 'minExecutors' | 'maxExecutors',
    rawVal: string
  ) => {
    const parsed = rawVal === '' ? 0 : parseInt(rawVal, 10);
    setDraftConfig(prev => ({
      ...prev,
      [field]: Number.isNaN(parsed) ? 0 : Math.max(0, parsed)
    }));
  };

  return (
    <EditDrawer
      open={open}
      title="Autoscaling"
      onClose={onClose}
      onSave={() => onSave(draftConfig)}
    >
      <FormControlLabel
        control={
          <Checkbox
            id="edit-autoscaling-enabled"
            checked={isAutoscalingEnabled}
            onChange={e =>
              setDraftConfig(prev => ({
                ...prev,
                autoscalingEnabled: e.target.checked
              }))
            }
            size="small"
          />
        }
        label="Enabled"
      />

      <div className="edit-drawer-field-group">
        <TextField
          id="edit-initial-executors"
          label="Initial executors"
          type="number"
          value={draftConfig.initialExecutors ?? 2}
          onChange={e => handleNumberChange('initialExecutors', e.target.value)}
          variant="outlined"
          size="small"
          fullWidth
          inputProps={{ min: 2 }}
          InputLabelProps={{ shrink: true }}
        />
        <div className="edit-drawer-helper-text">Minimum value is 2</div>
      </div>

      <div className="edit-drawer-field-group">
        <TextField
          id="edit-minimum-executors"
          label="Minimum executors"
          type="number"
          value={draftConfig.minExecutors ?? 2}
          onChange={e => handleNumberChange('minExecutors', e.target.value)}
          variant="outlined"
          size="small"
          fullWidth
          inputProps={{ min: 2 }}
          InputLabelProps={{ shrink: true }}
        />
        <div className="edit-drawer-helper-text">Minimum value is 2</div>
      </div>

      <div className="edit-drawer-field-group">
        <TextField
          id="edit-maximum-executors"
          label="Maximum executors"
          type="number"
          value={draftConfig.maxExecutors ?? 1000}
          onChange={e => handleNumberChange('maxExecutors', e.target.value)}
          variant="outlined"
          size="small"
          fullWidth
          inputProps={{ min: 2, max: 2000 }}
          InputLabelProps={{ shrink: true }}
        />
        <div className="edit-drawer-helper-text">Maximum value is 2000</div>
      </div>
    </EditDrawer>
  );
};

const parseDurationString = (
  rawString: string | undefined,
  defaultQty: number,
  defaultUnit: TimeUnit
): { quantity: number; unit: TimeUnit } => {
  if (!rawString) {
    return { quantity: defaultQty, unit: defaultUnit };
  }
  const match = rawString.trim().match(/^(\d+)\s*([a-zA-Z]+)?$/);
  if (!match) {
    return { quantity: defaultQty, unit: defaultUnit };
  }
  const quantity = parseInt(match[1], 10);
  const rawUnit = (match[2] || '').toLowerCase();
  let unit: TimeUnit = defaultUnit;
  if (rawUnit.startsWith('m')) {
    unit = 'minutes';
  } else if (rawUnit.startsWith('h')) {
    unit = 'hours';
  } else if (rawUnit.startsWith('d')) {
    unit = 'days';
  } else if (rawUnit.startsWith('s')) {
    unit = 'seconds';
  }
  return { quantity: Number.isNaN(quantity) ? defaultQty : quantity, unit };
};

export interface ISessionLifecycleEditDrawerProps {
  open: boolean;
  config: ISessionLifecycleConfig;
  onClose: () => void;
  onSave: (updatedConfig: ISessionLifecycleConfig) => void;
}

export const SessionLifecycleEditDrawer: React.FC<
  ISessionLifecycleEditDrawerProps
> = ({ open, config, onClose, onSave }) => {
  const [idleQuantity, setIdleQuantity] = useState<number>(60);
  const [idleUnit, setIdleUnit] = useState<TimeUnit>('minutes');
  const [sessionQuantity, setSessionQuantity] = useState<number>(3);
  const [sessionUnit, setSessionUnit] = useState<TimeUnit>('days');

  useEffect(() => {
    if (open) {
      const parsedIdle = parseDurationString(
        config.maxIdleTime,
        config.maxIdleTimeQuantity ?? 60,
        config.maxIdleTimeUnit ?? 'minutes'
      );
      const parsedSession = parseDurationString(
        config.maxSessionTime,
        config.maxSessionTimeQuantity ?? 3,
        config.maxSessionTimeUnit ?? 'days'
      );
      setIdleQuantity(config.maxIdleTimeQuantity ?? parsedIdle.quantity);
      setIdleUnit(config.maxIdleTimeUnit ?? parsedIdle.unit);
      setSessionQuantity(
        config.maxSessionTimeQuantity ?? parsedSession.quantity
      );
      setSessionUnit(config.maxSessionTimeUnit ?? parsedSession.unit);
    }
  }, [open, config]);

  const handleSave = () => {
    const safeIdleQty = Math.max(1, idleQuantity || 1);
    const safeSessionQty = Math.max(1, sessionQuantity || 1);
    onSave({
      ...config,
      maxIdleTimeQuantity: safeIdleQty,
      maxIdleTimeUnit: idleUnit,
      maxIdleTime: `${safeIdleQty} ${idleUnit}`,
      maxSessionTimeQuantity: safeSessionQty,
      maxSessionTimeUnit: sessionUnit,
      maxSessionTime: `${safeSessionQty} ${sessionUnit}`
    });
  };

  return (
    <EditDrawer
      open={open}
      title="Session lifecycle"
      onClose={onClose}
      onSave={handleSave}
    >
      <div className="edit-drawer-field-group">
        <div className="edit-drawer-section-heading">Max idle time</div>
        <div className="edit-drawer-helper-text">
          Max notebook idle time before the session is auto-terminated.
          Can be anywhere between 10 minutes to 330 hours.
        </div>

        <div className="edit-drawer-row">
          <TextField
            id="edit-max-idle-time-quantity"
            label="Max idle time quantity"
            type="number"
            value={idleQuantity}
            onChange={e =>
              setIdleQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))
            }
            variant="outlined"
            size="small"
            fullWidth
            inputProps={{ min: 1 }}
            InputLabelProps={{ shrink: true }}
          />
          <FormControl size="small" fullWidth variant="outlined">
            <InputLabel id="edit-max-idle-time-unit-label" shrink>
              Max idle time unit
            </InputLabel>
            <Select
              labelId="edit-max-idle-time-unit-label"
              id="edit-max-idle-time-unit"
              label="Max idle time unit"
              notched
              value={idleUnit}
              onChange={e => setIdleUnit(e.target.value as TimeUnit)}
            >
              {TIME_UNIT_OPTIONS.map(opt => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </div>
      </div>

      <div className="edit-drawer-field-group">
        <div className="edit-drawer-section-heading">Max session time</div>
        <div className="edit-drawer-helper-text">
          Max lifetime of a session. Can be anywhere from 10 minutes to 14 days.
        </div>

        <div className="edit-drawer-row">
          <TextField
            id="edit-max-session-time-quantity"
            label="Max session time quantity"
            type="number"
            value={sessionQuantity}
            onChange={e =>
              setSessionQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))
            }
            variant="outlined"
            size="small"
            fullWidth
            inputProps={{ min: 1 }}
            InputLabelProps={{ shrink: true }}
          />
          <FormControl size="small" fullWidth variant="outlined">
            <InputLabel id="edit-max-session-time-unit-label" shrink>
              Max session time unit
            </InputLabel>
            <Select
              labelId="edit-max-session-time-unit-label"
              id="edit-max-session-time-unit"
              label="Max session time unit"
              notched
              value={sessionUnit}
              onChange={e => setSessionUnit(e.target.value as TimeUnit)}
            >
              {TIME_UNIT_OPTIONS.map(opt => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </div>
      </div>
    </EditDrawer>
  );
};

interface IKeyValueEntry {
  key: string;
  value: string;
}

const recordToEntries = (record?: Record<string, string>): IKeyValueEntry[] => {
  if (!record || Object.keys(record).length === 0) {
    return [];
  }
  return Object.entries(record).map(([key, value]) => ({ key, value }));
};

const entriesToRecord = (entries: IKeyValueEntry[]): Record<string, string> => {
  const result: Record<string, string> = {};
  entries.forEach(({ key, value }) => {
    const trimmedKey = key.trim();
    if (trimmedKey) {
      result[trimmedKey] = value.trim();
    }
  });
  return result;
};

export interface IOtherCustomizationEditDrawerProps {
  open: boolean;
  sparkProperties: SparkProperties;
  labels: ProfileLabels;
  onClose: () => void;
  onSave: (
    updatedSparkProperties: SparkProperties,
    updatedLabels: ProfileLabels
  ) => void;
}

export const OtherCustomizationEditDrawer: React.FC<
  IOtherCustomizationEditDrawerProps
> = ({ open, sparkProperties, labels, onClose, onSave }) => {
  const [sparkEntries, setSparkEntries] = useState<IKeyValueEntry[]>([]);
  const [labelEntries, setLabelEntries] = useState<IKeyValueEntry[]>([]);

  useEffect(() => {
    if (open) {
      setSparkEntries(recordToEntries(sparkProperties));
      setLabelEntries(recordToEntries(labels));
    }
  }, [open, sparkProperties, labels]);

  const handleEntryChange = (
    list: IKeyValueEntry[],
    setList: React.Dispatch<React.SetStateAction<IKeyValueEntry[]>>,
    index: number,
    field: 'key' | 'value',
    newVal: string
  ) => {
    const updated = [...list];
    updated[index] = { ...updated[index], [field]: newVal };
    setList(updated);
  };

  const handleAddEntry = (
    setList: React.Dispatch<React.SetStateAction<IKeyValueEntry[]>>
  ) => {
    setList(prev => [...prev, { key: '', value: '' }]);
  };

  const handleRemoveEntry = (
    setList: React.Dispatch<React.SetStateAction<IKeyValueEntry[]>>,
    index: number
  ) => {
    setList(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <EditDrawer
      open={open}
      title="Other customizations"
      onClose={onClose}
      onSave={() =>
        onSave(entriesToRecord(sparkEntries), entriesToRecord(labelEntries))
      }
    >
      {/* Spark Properties Section */}
      <div className="edit-drawer-field-group">
        <div className="edit-drawer-section-heading">Spark properties</div>
        <div className="edit-drawer-helper-text">
          Custom Spark properties applied to every workload that runs on this profile, for example
          spark.executor.memory.
        </div>
        <div className="edit-drawer-kv-list">
          {sparkEntries.map((entry, idx) => (
            <div key={`spark-prop-${idx}`} className="edit-drawer-kv-row">
              <TextField
                id={`edit-spark-property-key-${idx}`}
                label="Key"
                value={entry.key}
                onChange={e =>
                  handleEntryChange(
                    sparkEntries,
                    setSparkEntries,
                    idx,
                    'key',
                    e.target.value
                  )
                }
                variant="outlined"
                size="small"
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                id={`edit-spark-property-value-${idx}`}
                label="Value"
                value={entry.value}
                onChange={e =>
                  handleEntryChange(
                    sparkEntries,
                    setSparkEntries,
                    idx,
                    'value',
                    e.target.value
                  )
                }
                variant="outlined"
                size="small"
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
              <button
                type="button"
                className="edit-drawer-remove-btn"
                aria-label={`Remove Spark property ${idx + 1}`}
                onClick={() => handleRemoveEntry(setSparkEntries, idx)}
              >
                &#x2715;
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          className="edit-drawer-add-btn"
          onClick={() => handleAddEntry(setSparkEntries)}
        >
          + Add property
        </button>
      </div>

      {/* <hr className="edit-drawer-divider" /> */}

      {/* Labels Section */}
      <div className="edit-drawer-field-group">
        <div className="edit-drawer-section-heading">Labels</div>
        <div className="edit-drawer-helper-text">
          A list of key:value pairs to attach to the cluster for tracking.
        </div>
        <div className="edit-drawer-kv-list">
          {labelEntries.map((entry, idx) => (
            <div key={`label-entry-${idx}`} className="edit-drawer-kv-row">
              <TextField
                id={`edit-label-key-${idx}`}
                label="Key"
                value={entry.key}
                onChange={e =>
                  handleEntryChange(
                    labelEntries,
                    setLabelEntries,
                    idx,
                    'key',
                    e.target.value
                  )
                }
                variant="outlined"
                size="small"
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                id={`edit-label-value-${idx}`}
                label="Value"
                value={entry.value}
                onChange={e =>
                  handleEntryChange(
                    labelEntries,
                    setLabelEntries,
                    idx,
                    'value',
                    e.target.value
                  )
                }
                variant="outlined"
                size="small"
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
              <button
                type="button"
                className="edit-drawer-remove-btn"
                aria-label={`Remove label ${idx + 1}`}
                onClick={() => handleRemoveEntry(setLabelEntries, idx)}
              >
                &#x2715;
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          className="edit-drawer-add-btn"
          onClick={() => handleAddEntry(setLabelEntries)}
        >
          + Add label
        </button>
      </div>
    </EditDrawer>
  );
};
