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
  Radio,
  Select,
  TextField
} from '@mui/material';
import { EditDrawer } from '../controls/EditDrawer';
import {
  EncryptionType,
  ExecutionIdentityType,
  IAutoscalingConfig,
  INetworkAndSecurityConfig,
  IRuntimeEnvironmentConfig,
  ISessionLifecycleConfig,
  NetworkSourceType,
  ProfileLabels,
  SparkProperties,
  TimeUnit
} from './runtimeProfileInterface';
import {
  CUSTOM_CONTAINERS,
  CUSTOM_CONTAINER_MESSAGE,
  CUSTOM_CONTAINER_MESSAGE_PART,
  KEY_MESSAGE,
  SECURITY_KEY,
  SHARED_VPC
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

export const DEFAULT_NETWORK_OPTIONS: string[] = ['default'];
export const DEFAULT_SUBNETWORK_OPTIONS: string[] = ['default'];
const INTERNAL_IP_DOC =
  'https://cloud.google.com/dataproc-serverless/docs/concepts/network';

export interface INetworkSecurityEditDrawerProps {
  open: boolean;
  config: INetworkAndSecurityConfig;
  networkOptions?: string[];
  subnetworkOptions?: string[];
  onClose: () => void;
  onSave: (updatedConfig: INetworkAndSecurityConfig) => void;
}

export const NetworkSecurityEditDrawer: React.FC<
  INetworkSecurityEditDrawerProps
> = ({
  open,
  config,
  networkOptions = DEFAULT_NETWORK_OPTIONS,
  subnetworkOptions = DEFAULT_SUBNETWORK_OPTIONS,
  onClose,
  onSave
}) => {
  const [networkSource, setNetworkSource] = useState<NetworkSourceType>(
    config.networkSource ?? 'project'
  );
  const [primaryNetwork, setPrimaryNetwork] = useState<string>(
    config.primaryNetwork || config.networkInThisProject || 'default'
  );
  const [subnetwork, setSubnetwork] = useState<string>(
    config.subnetwork || 'default'
  );
  const [sharedSubnetwork, setSharedSubnetwork] = useState<string>(
    config.sharedSubnetwork || ''
  );
  const [networkTagsText, setNetworkTagsText] = useState<string>(
    (config.networkTags || []).join(', ')
  );
  const [internalIpOnly, setInternalIpOnly] = useState<boolean>(
    Boolean(config.internalIpOnly)
  );
  const [executionIdentity, setExecutionIdentity] =
    useState<ExecutionIdentityType>(
      config.executionIdentity ?? 'user_account'
    );
  const [encryption, setEncryption] = useState<EncryptionType>(
    config.encryption ?? 'google_managed'
  );
  const [kmsKeyName, setKmsKeyName] = useState<string>(
    config.kmsKeyName ?? ''
  );

  useEffect(() => {
    if (open) {
      setNetworkSource(config.networkSource ?? 'project');
      setPrimaryNetwork(
        config.primaryNetwork || config.networkInThisProject || 'default'
      );
      setSubnetwork(config.subnetwork || 'default');
      setSharedSubnetwork(config.sharedSubnetwork || '');
      setNetworkTagsText((config.networkTags || []).join(', '));
      setInternalIpOnly(Boolean(config.internalIpOnly));
      setExecutionIdentity(config.executionIdentity ?? 'user_account');
      setEncryption(config.encryption ?? 'google_managed');
      setKmsKeyName(config.kmsKeyName ?? '');
    }
  }, [open, config]);

  const resolvedNetworkOptions = React.useMemo(() => {
    const base =
      networkOptions.length > 0 ? networkOptions : DEFAULT_NETWORK_OPTIONS;
    if (primaryNetwork && !base.includes(primaryNetwork)) {
      return [primaryNetwork, ...base];
    }
    return base;
  }, [networkOptions, primaryNetwork]);

  const resolvedSubnetworkOptions = React.useMemo(() => {
    const base =
      subnetworkOptions.length > 0
        ? subnetworkOptions
        : DEFAULT_SUBNETWORK_OPTIONS;
    if (subnetwork && !base.includes(subnetwork)) {
      return [subnetwork, ...base];
    }
    return base;
  }, [subnetworkOptions, subnetwork]);

  const openExternalLink = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleSave = () => {
    const parsedTags = networkTagsText
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);

    onSave({
      ...config,
      networkSource,
      primaryNetwork,
      networkInThisProject: primaryNetwork,
      subnetwork,
      sharedSubnetwork:
        networkSource === 'shared_from_host'
          ? sharedSubnetwork.trim() || undefined
          : undefined,
      networkTags: parsedTags,
      internalIpOnly,
      executionIdentity,
      encryption,
      kmsKeyName:
        encryption === 'customer_managed_key'
          ? kmsKeyName.trim() || undefined
          : undefined
    });
  };

  return (
    <EditDrawer
      open={open}
      title="Network and security"
      onClose={onClose}
      onSave={handleSave}
    >
      {/* Connect your cluster */}
      <div className="edit-drawer-field-group">
        <div className="edit-drawer-section-heading">Connect your cluster</div>
        <div className="edit-drawer-helper-text">
          Network, private-IP posture, and the identity the cluster runs as.
        </div>

        <div className="edit-drawer-radio-group">
          {/* Option 1: Network in this project */}
          <div>
            <div
              className="edit-drawer-radio-option"
              onClick={() => setNetworkSource('project')}
              role="radio"
              aria-checked={networkSource === 'project'}
              tabIndex={0}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setNetworkSource('project');
                }
              }}
            >
              <Radio
                id="edit-network-source-project"
                checked={networkSource === 'project'}
                onChange={() => setNetworkSource('project')}
                size="small"
                color="primary"
              />
              <div className="edit-drawer-option-content">
                <div className="edit-drawer-option-title">
                  Network in this project
                </div>
                <div className="edit-drawer-helper-text">
                  All incoming connections must have SSL encryption.
                </div>
              </div>
            </div>

            {networkSource === 'project' && (
              <div className="edit-drawer-nested-fields">
                <div className="edit-drawer-row">
                  <FormControl size="small" fullWidth variant="outlined">
                    <InputLabel id="edit-primary-network-label" shrink>
                      Primary network
                    </InputLabel>
                    <Select
                      labelId="edit-primary-network-label"
                      id="edit-primary-network"
                      label="Primary network"
                      notched
                      value={primaryNetwork}
                      onChange={e =>
                        setPrimaryNetwork(e.target.value as string)
                      }
                    >
                      {resolvedNetworkOptions.map(net => (
                        <MenuItem key={net} value={net}>
                          {net}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl size="small" fullWidth variant="outlined">
                    <InputLabel id="edit-subnetwork-label" shrink>
                      Subnetwork
                    </InputLabel>
                    <Select
                      labelId="edit-subnetwork-label"
                      id="edit-subnetwork"
                      label="Subnetwork"
                      notched
                      value={subnetwork}
                      onChange={e => setSubnetwork(e.target.value as string)}
                    >
                      {resolvedSubnetworkOptions.map(sub => (
                        <MenuItem key={sub} value={sub}>
                          {sub}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </div>

                <TextField
                  id="edit-network-tags"
                  label="Network tags"
                  value={networkTagsText}
                  onChange={e => setNetworkTagsText(e.target.value)}
                  variant="outlined"
                  size="small"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />

                <div
                  className="edit-drawer-radio-option"
                  onClick={() => setInternalIpOnly(prev => !prev)}
                  role="checkbox"
                  aria-checked={internalIpOnly}
                  tabIndex={0}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setInternalIpOnly(prev => !prev);
                    }
                  }}
                >
                  <Checkbox
                    id="edit-internal-ip-only"
                    checked={internalIpOnly}
                    onChange={e => setInternalIpOnly(e.target.checked)}
                    onClick={e => e.stopPropagation()}
                    size="small"
                    color="primary"
                  />
                  <div className="edit-drawer-option-content">
                    <div className="edit-drawer-option-title">
                      Internal IP only
                    </div>
                    <div className="edit-drawer-helper-text">
                      Configure all instances to have only internal IP
                      addresses.{' '}
                      <span
                        role="button"
                        tabIndex={0}
                        className="section-detail-link"
                        onClick={e => {
                          e.stopPropagation();
                          openExternalLink(INTERNAL_IP_DOC);
                        }}
                        onKeyDown={e => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            e.stopPropagation();
                            openExternalLink(INTERNAL_IP_DOC);
                          }
                        }}
                      >
                        Learn more
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Option 2: Network shared from host */}
          <div>
            <div
              className="edit-drawer-radio-option"
              onClick={() => setNetworkSource('shared_from_host')}
              role="radio"
              aria-checked={networkSource === 'shared_from_host'}
              tabIndex={0}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setNetworkSource('shared_from_host');
                }
              }}
            >
              <Radio
                id="edit-network-source-shared"
                checked={networkSource === 'shared_from_host'}
                onChange={() => setNetworkSource('shared_from_host')}
                size="small"
                color="primary"
              />
              <div className="edit-drawer-option-content">
                <div className="edit-drawer-option-title">
                  Network shared from host
                </div>
                <div className="edit-drawer-helper-text">
                  Database will only accept connections via AlloyDB Auth Proxy
                  and language connectors through the proxy process.{' '}
                  <span
                    role="button"
                    tabIndex={0}
                    className="section-detail-link"
                    onClick={e => {
                      e.stopPropagation();
                      openExternalLink(SHARED_VPC);
                    }}
                    onKeyDown={e => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        e.stopPropagation();
                        openExternalLink(SHARED_VPC);
                      }
                    }}
                  >
                    Learn more
                  </span>
                </div>
              </div>
            </div>

            {networkSource === 'shared_from_host' && (
              <div className="edit-drawer-nested-fields">
                <TextField
                  id="edit-shared-subnetwork"
                  label="Shared subnetwork"
                  value={sharedSubnetwork}
                  onChange={e => setSharedSubnetwork(e.target.value)}
                  variant="outlined"
                  size="small"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Execute notebooks with */}
      <div className="edit-drawer-field-group">
        <div className="edit-drawer-section-heading">
          Execute notebooks with
        </div>
        <div className="edit-drawer-radio-group">
          <div
            className="edit-drawer-radio-option"
            onClick={() => setExecutionIdentity('service_account')}
            role="radio"
            aria-checked={executionIdentity === 'service_account'}
            tabIndex={0}
            onKeyDown={e => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setExecutionIdentity('service_account');
              }
            }}
          >
            <Radio
              id="edit-execution-identity-service-account"
              checked={executionIdentity === 'service_account'}
              onChange={() => setExecutionIdentity('service_account')}
              size="small"
              color="primary"
            />
            <div className="edit-drawer-option-content">
              <div className="edit-drawer-option-title">Service account</div>
            </div>
          </div>

          <div
            className="edit-drawer-radio-option"
            onClick={() => setExecutionIdentity('user_account')}
            role="radio"
            aria-checked={executionIdentity === 'user_account'}
            tabIndex={0}
            onKeyDown={e => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setExecutionIdentity('user_account');
              }
            }}
          >
            <Radio
              id="edit-execution-identity-user-account"
              checked={executionIdentity === 'user_account'}
              onChange={() => setExecutionIdentity('user_account')}
              size="small"
              color="primary"
            />
            <div className="edit-drawer-option-content">
              <div className="edit-drawer-option-title">User account</div>
            </div>
          </div>
        </div>
      </div>

      {/* Encryption */}
      <div className="edit-drawer-field-group">
        <div className="edit-drawer-section-heading">Encryption</div>
        <div className="edit-drawer-helper-text">
          Encrypt cluster persistent disk data and optionally job argument data.{' '}
          <span
            role="button"
            tabIndex={0}
            className="section-detail-link"
            onClick={() => openExternalLink(SECURITY_KEY)}
            onKeyDown={e => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                openExternalLink(SECURITY_KEY);
              }
            }}
          >
            Learn more
          </span>
        </div>

        <div className="edit-drawer-radio-group">
          <div
            className="edit-drawer-radio-option"
            onClick={() => setEncryption('google_managed')}
            role="radio"
            aria-checked={encryption === 'google_managed'}
            tabIndex={0}
            onKeyDown={e => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setEncryption('google_managed');
              }
            }}
          >
            <Radio
              id="edit-encryption-google-managed"
              checked={encryption === 'google_managed'}
              onChange={() => setEncryption('google_managed')}
              size="small"
              color="primary"
            />
            <div className="edit-drawer-option-content">
              <div className="edit-drawer-option-title">
                Google-managed encryption key
              </div>
              <div className="edit-drawer-helper-text">
                Keys owned by Google
              </div>
            </div>
          </div>

          <div>
            <div
              className="edit-drawer-radio-option"
              onClick={() => setEncryption('customer_managed_key')}
              role="radio"
              aria-checked={encryption === 'customer_managed_key'}
              tabIndex={0}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setEncryption('customer_managed_key');
                }
              }}
            >
              <Radio
                id="edit-encryption-customer-managed"
                checked={encryption === 'customer_managed_key'}
                onChange={() => setEncryption('customer_managed_key')}
                size="small"
                color="primary"
              />
              <div className="edit-drawer-option-content">
                <div className="edit-drawer-option-title">Cloud KMS key</div>
                <div className="edit-drawer-helper-text">
                  Keys owned by customers
                </div>
              </div>
            </div>

            {encryption === 'customer_managed_key' && (
              <div className="edit-drawer-nested-fields">
                <TextField
                  id="edit-kms-key-name"
                  label="Cloud KMS key"
                  value={kmsKeyName}
                  onChange={e => setKmsKeyName(e.target.value)}
                  variant="outlined"
                  size="small"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
                <div className="edit-drawer-helper-text">{KEY_MESSAGE}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </EditDrawer>
  );
};

