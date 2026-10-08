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
  InputAdornment,
  InputLabel,
  MenuItem,
  Radio,
  Select,
  TextField,
  Tooltip
} from '@mui/material';
import { EditDrawer } from '../controls/EditDrawer';
import {
  EncryptionType,
  ExecutionIdentityType,
  IAutoscalingConfig,
  INetworkAndSecurityConfig,
  IRuntimeEnvironmentConfig,
  IRuntimeProfileService,
  ISessionLifecycleConfig,
  NetworkSourceType,
  ProfileLabels,
  SparkProperties,
  TimeUnit
} from './runtimeProfileInterface';
import { runtimeProfileService } from './runtimeProfileService';
import {
  CUSTOM_CONTAINERS,
  CUSTOM_CONTAINER_MESSAGE,
  CUSTOM_CONTAINER_MESSAGE_PART,
  KEY_MESSAGE,
  NETWORK_TAG_MESSAGE,
  SECURITY_KEY,
  SERVICE_ACCOUNT,
  SHARED_VPC
} from '../utils/const';
import { authApi } from '../utils/utils';

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
const KMS_KEY_REGEX =
  /^projects\/[^/]+\/locations\/[^/]+\/keyRings\/[^/]+\/cryptoKeys\/[^/]+$/;

export interface INetworkSecurityEditDrawerProps {
  open: boolean;
  config: INetworkAndSecurityConfig;
  networkOptions?: string[];
  subnetworkOptions?: string[];
  sharedSubnetworkOptions?: string[];
  keyRingOptions?: string[];
  cryptoKeyOptions?: string[];
  region?: string;
  projectId?: string;
  service?: IRuntimeProfileService;
  onClose: () => void;
  onSave: (updatedConfig: INetworkAndSecurityConfig) => void;
}

export const NetworkSecurityEditDrawer: React.FC<
  INetworkSecurityEditDrawerProps
> = ({
  open,
  config,
  networkOptions,
  subnetworkOptions,
  sharedSubnetworkOptions,
  keyRingOptions,
  cryptoKeyOptions,
  region,
  projectId,
  service = runtimeProfileService,
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
  const [hostProjectId, setHostProjectId] = useState<string>(
    config.hostProjectId || ''
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
  const [serviceAccount, setServiceAccount] = useState<string>(
    config.serviceAccount || ''
  );
  const [encryption, setEncryption] = useState<EncryptionType>(
    config.encryption ?? 'google_managed'
  );
  const [kmsKeySelectionMode, setKmsKeySelectionMode] = useState<
    'select' | 'manual'
  >(
    config.kmsKeySelectionMode ??
      (config.kmsKeyName && !config.keyRing ? 'manual' : 'select')
  );
  const [keyRing, setKeyRing] = useState<string>(config.keyRing || '');
  const [cryptoKey, setCryptoKey] = useState<string>(config.cryptoKey || '');
  const [kmsKeyName, setKmsKeyName] = useState<string>(
    config.kmsKeyName ?? ''
  );
  const [isValidManualKey, setIsValidManualKey] = useState<boolean>(true);

  const [fetchedNetworks, setFetchedNetworks] = useState<string[]>([]);
  const [fetchedSubnetworks, setFetchedSubnetworks] = useState<string[]>([]);
  const [fetchedSharedSubnetworks, setFetchedSharedSubnetworks] = useState<
    string[]
  >([]);
  const [fetchedKeyRings, setFetchedKeyRings] = useState<string[]>([]);
  const [fetchedCryptoKeys, setFetchedCryptoKeys] = useState<string[]>([]);

  const [isLoadingNetworks, setIsLoadingNetworks] = useState<boolean>(false);
  const [isLoadingSubnetworks, setIsLoadingSubnetworks] =
    useState<boolean>(false);
  const [isLoadingSharedSubnetworks, setIsLoadingSharedSubnetworks] =
    useState<boolean>(false);
  const [hasFetchedSubnetworks, setHasFetchedSubnetworks] =
    useState<boolean>(false);
  const [hasFetchedSharedSubnetworks, setHasFetchedSharedSubnetworks] =
    useState<boolean>(false);
  const [resolvedProject, setResolvedProject] = useState<string>(
    projectId || ''
  );
  const [resolvedRegion, setResolvedRegion] = useState<string>(region || '');

  useEffect(() => {
    if (open) {
      const extractSubnetName = (val?: string) => {
        if (!val) {
          return '';
        }
        return (
          /projects\/(?<project>[\w-]+)\/regions\/(?<region>[\w-]+)\/subnetworks\/(?<subnetwork>[\w-]+)/.exec(
            val
          )?.groups?.['subnetwork'] || val
        );
      };

      setNetworkSource(config.networkSource ?? 'project');
      setPrimaryNetwork(
        config.primaryNetwork || config.networkInThisProject || 'default'
      );
      setSubnetwork(extractSubnetName(config.subnetwork) || 'default');
      setSharedSubnetwork(extractSubnetName(config.sharedSubnetwork) || '');
      setHostProjectId(config.hostProjectId || '');
      setNetworkTagsText((config.networkTags || []).join(', '));
      setInternalIpOnly(Boolean(config.internalIpOnly));
      setExecutionIdentity(config.executionIdentity ?? 'user_account');
      setServiceAccount(config.serviceAccount || '');
      setEncryption(config.encryption ?? 'google_managed');

      // Extract keyRing and cryptoKey from kmsKeyName if formatted and not explicitly stored
      let initialKeyRing = config.keyRing || '';
      let initialCryptoKey = config.cryptoKey || '';
      if (!initialKeyRing && config.kmsKeyName) {
        const parts = config.kmsKeyName.split('/');
        if (
          parts.length === 8 &&
          parts[0] === 'projects' &&
          parts[2] === 'locations' &&
          parts[4] === 'keyRings' &&
          parts[6] === 'cryptoKeys'
        ) {
          initialKeyRing = parts[5] || '';
          initialCryptoKey = parts[7] || '';
        }
      }
      setKeyRing(initialKeyRing);
      setCryptoKey(initialCryptoKey);
      setKmsKeySelectionMode(
        config.kmsKeySelectionMode ??
          (config.kmsKeyName && !config.keyRing ? 'manual' : 'select')
      );
      setKmsKeyName(config.kmsKeyName ?? '');
      setIsValidManualKey(
        !config.kmsKeyName || KMS_KEY_REGEX.test(config.kmsKeyName)
      );
    }
  }, [open, config]);

  // Load primary networks when drawer opens and 'project' network source is selected
  useEffect(() => {
    if (!open || networkSource !== 'project') {
      return;
    }
    let isMounted = true;

    const fetchProjectNetworks = async () => {
      const credentials = await authApi().catch(() => undefined);
      const targetProject = projectId || credentials?.project_id || '';
      const targetRegion = region || credentials?.region_id || '';

      if (isMounted) {
        setResolvedProject(targetProject);
        setResolvedRegion(targetRegion);
      }

      if (service?.getNetworks && !networkOptions) {
        setIsLoadingNetworks(true);
        try {
          const networks = await service.getNetworks(targetProject);
          if (isMounted && Array.isArray(networks) && networks.length > 0) {
            setFetchedNetworks(networks);
            const currentNet =
              config.primaryNetwork || config.networkInThisProject || 'default';
            if (!networks.includes(currentNet)) {
              setPrimaryNetwork(networks[0]);
            }
          }
        } catch (error) {
          console.error('Failed to load networks:', error);
        } finally {
          if (isMounted) {
            setIsLoadingNetworks(false);
          }
        }
      }
    };

    fetchProjectNetworks();

    return () => {
      isMounted = false;
    };
  }, [
    open,
    networkSource,
    projectId,
    region,
    service,
    networkOptions,
    config.primaryNetwork,
    config.networkInThisProject
  ]);

  // Load Shared VPC subnetworks when drawer opens or when 'shared_from_host' is selected
  useEffect(() => {
    if (!open || sharedSubnetworkOptions || !service?.getSharedVpcSubnetworks) {
      return;
    }
    let isMounted = true;

    const fetchSharedVpcResources = async () => {
      setIsLoadingSharedSubnetworks(true);
      try {
        const credentials = await authApi().catch(() => undefined);
        const targetProject = projectId || credentials?.project_id || '';
        const targetRegion = region || credentials?.region_id || '';

        if (isMounted) {
          setResolvedProject(targetProject);
          setResolvedRegion(targetRegion);
        }

        const sharedResult = await service.getSharedVpcSubnetworks!(
          targetProject,
          targetRegion
        );
        if (isMounted && sharedResult) {
          const subs = sharedResult.subnetworks || [];
          setFetchedSharedSubnetworks(subs);
          if (sharedResult.hostProjectId !== undefined) {
            setHostProjectId(sharedResult.hostProjectId);
          }
          if (subs.length > 0) {
            setSharedSubnetwork(prev =>
              prev && subs.includes(prev) ? prev : subs[0]
            );
          } else {
            setSharedSubnetwork('');
          }
          setHasFetchedSharedSubnetworks(true);
        }
      } catch (error) {
        console.error('Failed to load shared VPC subnetworks:', error);
        if (isMounted) {
          setHasFetchedSharedSubnetworks(true);
        }
      } finally {
        if (isMounted) {
          setIsLoadingSharedSubnetworks(false);
        }
      }
    };

    fetchSharedVpcResources();

    return () => {
      isMounted = false;
    };
  }, [
    open,
    networkSource,
    projectId,
    region,
    service,
    sharedSubnetworkOptions
  ]);

  // Load KMS Key Rings only when 'customer_managed_key' radio option is selected
  useEffect(() => {
    if (
      !open ||
      encryption !== 'customer_managed_key' ||
      keyRingOptions ||
      !service?.getKeyRings
    ) {
      return;
    }
    let isMounted = true;

    const fetchKeyRings = async () => {
      try {
        const credentials = await authApi().catch(() => undefined);
        const targetProject = projectId || credentials?.project_id || '';
        const targetRegion = region || credentials?.region_id || '';

        if (isMounted) {
          setResolvedProject(targetProject);
          setResolvedRegion(targetRegion);
        }

        const rings = await service.getKeyRings!(targetProject, targetRegion);
        if (isMounted && Array.isArray(rings)) {
          setFetchedKeyRings(rings);
        }
      } catch (error) {
        console.error('Failed to load KMS key rings:', error);
      }
    };

    fetchKeyRings();

    return () => {
      isMounted = false;
    };
  }, [open, encryption, projectId, region, service, keyRingOptions]);

  // Load subnetworks whenever primaryNetwork changes while drawer is open
  useEffect(() => {
    if (
      !open ||
      networkSource !== 'project' ||
      !primaryNetwork ||
      subnetworkOptions ||
      !service?.getSubnetworks
    ) {
      return;
    }
    let isMounted = true;

    const fetchSubnetworksForNetwork = async () => {
      setIsLoadingSubnetworks(true);
      try {
        const credentials = await authApi().catch(() => undefined);
        const targetProject = projectId || credentials?.project_id || '';
        const targetRegion = region || credentials?.region_id || '';

        const subs = await service.getSubnetworks!(
          primaryNetwork,
          targetProject,
          targetRegion
        );
        if (isMounted && Array.isArray(subs)) {
          setFetchedSubnetworks(subs);
          setHasFetchedSubnetworks(true);
          if (subs.length > 0) {
            setSubnetwork(prev => (prev && subs.includes(prev) ? prev : subs[0]));
          } else {
            setSubnetwork('');
          }
        }
      } catch (error) {
        console.error('Failed to load subnetworks:', error);
      } finally {
        if (isMounted) {
          setIsLoadingSubnetworks(false);
        }
      }
    };

    fetchSubnetworksForNetwork();

    return () => {
      isMounted = false;
    };
  }, [
    open,
    networkSource,
    primaryNetwork,
    projectId,
    region,
    service,
    subnetworkOptions
  ]);

  // Load KMS CryptoKeys whenever keyRing changes while drawer is open
  useEffect(() => {
    if (
      !open ||
      encryption !== 'customer_managed_key' ||
      !keyRing ||
      cryptoKeyOptions ||
      !service?.getCryptoKeys
    ) {
      return;
    }
    let isMounted = true;

    const fetchKeysForRing = async () => {
      try {
        const credentials = await authApi().catch(() => undefined);
        const targetProject = projectId || credentials?.project_id || '';
        const targetRegion = region || credentials?.region_id || '';

        const keys = await service.getCryptoKeys!(
          keyRing,
          targetProject,
          targetRegion
        );
        if (isMounted && Array.isArray(keys)) {
          setFetchedCryptoKeys(keys);
          if (keys.length > 0) {
            setCryptoKey(prev => (prev && keys.includes(prev) ? prev : keys[0]));
          } else {
            setCryptoKey('');
          }
        }
      } catch (error) {
        console.error('Failed to load KMS crypto keys:', error);
      }
    };

    fetchKeysForRing();

    return () => {
      isMounted = false;
    };
  }, [
    open,
    encryption,
    keyRing,
    projectId,
    region,
    service,
    cryptoKeyOptions
  ]);

  const resolvedNetworkOptions = React.useMemo(() => {
    const source =
      networkOptions && networkOptions.length > 0
        ? networkOptions
        : fetchedNetworks.length > 0
        ? fetchedNetworks
        : DEFAULT_NETWORK_OPTIONS;
    if (primaryNetwork && !source.includes(primaryNetwork)) {
      return [primaryNetwork, ...source];
    }
    return source;
  }, [networkOptions, fetchedNetworks, primaryNetwork]);

  const resolvedSubnetworkOptions = React.useMemo(() => {
    const source =
      subnetworkOptions && subnetworkOptions.length > 0
        ? subnetworkOptions
        : hasFetchedSubnetworks
        ? fetchedSubnetworks
        : fetchedSubnetworks.length > 0
        ? fetchedSubnetworks
        : DEFAULT_SUBNETWORK_OPTIONS;
    if (subnetwork && !hasFetchedSubnetworks && !source.includes(subnetwork)) {
      return [subnetwork, ...source];
    }
    return source;
  }, [
    subnetworkOptions,
    fetchedSubnetworks,
    hasFetchedSubnetworks,
    subnetwork
  ]);

  const resolvedSharedSubnetworkOptions = React.useMemo(() => {
    const source =
      sharedSubnetworkOptions && sharedSubnetworkOptions.length > 0
        ? sharedSubnetworkOptions
        : fetchedSharedSubnetworks;
    if (sharedSubnetwork && !source.includes(sharedSubnetwork)) {
      return [sharedSubnetwork, ...source];
    }
    return source;
  }, [sharedSubnetworkOptions, fetchedSharedSubnetworks, sharedSubnetwork]);

  const hasNoSubnetworks =
    !isLoadingNetworks &&
    !isLoadingSubnetworks &&
    hasFetchedSubnetworks &&
    resolvedSubnetworkOptions.length === 0;

  const hasNoSharedSubnetworks =
    !isLoadingSharedSubnetworks &&
    (hasFetchedSharedSubnetworks || Boolean(sharedSubnetworkOptions)) &&
    resolvedSharedSubnetworkOptions.length === 0;

  const resolvedKeyRingOptions = React.useMemo(() => {
    const source =
      keyRingOptions && keyRingOptions.length > 0
        ? keyRingOptions
        : fetchedKeyRings;
    if (keyRing && !source.includes(keyRing)) {
      return [keyRing, ...source];
    }
    return source;
  }, [keyRingOptions, fetchedKeyRings, keyRing]);

  const resolvedCryptoKeyOptions = React.useMemo(() => {
    const source =
      cryptoKeyOptions && cryptoKeyOptions.length > 0
        ? cryptoKeyOptions
        : fetchedCryptoKeys;
    if (cryptoKey && !source.includes(cryptoKey)) {
      return [cryptoKey, ...source];
    }
    return source;
  }, [cryptoKeyOptions, fetchedCryptoKeys, cryptoKey]);

  const openExternalLink = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const renderExternalLinkIcon = () => (
    <svg
      className="edit-drawer-external-link-icon"
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M19 19H5V5h7V3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z" />
    </svg>
  );

  const renderFieldHelpIcon = (tooltipText: string) => (
    <InputAdornment
      position="end"
      className="edit-drawer-select-help"
      onMouseDown={e => e.stopPropagation()}
      onClick={e => e.stopPropagation()}
    >
      <Tooltip title={tooltipText}>
        <span className="edit-drawer-help-icon" role="img" aria-label={tooltipText}>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M11 18h2v-2h-2v2zm1-16C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-2.21 0-4 1.79-4 4h2c0-1.1.9-2 2-2s2 .9 2 2c0 2-3 1.75-3 5h2c0-2.25 3-2.5 3-5 0-2.21-1.79-4-4-4z" />
          </svg>
        </span>
      </Tooltip>
    </InputAdornment>
  );

  const handleManualKmsKeyChange = (value: string) => {
    setKmsKeySelectionMode('manual');
    setKmsKeyName(value);
    setIsValidManualKey(value === '' || KMS_KEY_REGEX.test(value.trim()));
  };

  const handleSave = () => {
    const parsedTags = networkTagsText
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);

    let finalKmsKeyName: string | undefined;
    if (encryption === 'customer_managed_key') {
      if (kmsKeySelectionMode === 'select' && keyRing && cryptoKey) {
        const proj = projectId || resolvedProject;
        const reg = region || resolvedRegion;
        finalKmsKeyName =
          proj && reg
            ? `projects/${proj}/locations/${reg}/keyRings/${keyRing}/cryptoKeys/${cryptoKey}`
            : kmsKeyName.trim() || undefined;
      } else {
        finalKmsKeyName = kmsKeyName.trim() || undefined;
      }
    }

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
      hostProjectId:
        networkSource === 'shared_from_host'
          ? hostProjectId || undefined
          : undefined,
      networkTags: parsedTags,
      internalIpOnly,
      executionIdentity,
      serviceAccount: serviceAccount.trim() || undefined,
      encryption,
      kmsKeySelectionMode:
        encryption === 'customer_managed_key' ? kmsKeySelectionMode : undefined,
      keyRing:
        encryption === 'customer_managed_key' &&
        kmsKeySelectionMode === 'select'
          ? keyRing || undefined
          : undefined,
      cryptoKey:
        encryption === 'customer_managed_key' &&
        kmsKeySelectionMode === 'select'
          ? cryptoKey || undefined
          : undefined,
      kmsKeyName: finalKmsKeyName
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
          Establishes connectivity for the VM instances in this cluster.
        </div>

        <div className="edit-drawer-radio-group">
          {/* Option 1: Networks in this project */}
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
                  Networks in this project
                </div>
                <div className="edit-drawer-helper-text">
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
                    {renderExternalLinkIcon()}
                  </span>
                </div>
              </div>
            </div>

            {networkSource === 'project' && (
              <div className="edit-drawer-nested-fields">
                <div className="edit-drawer-row">
                  <FormControl
                    size="small"
                    fullWidth
                    variant="outlined"
                    className="edit-drawer-select-with-help"
                  >
                    <InputLabel id="edit-primary-network-label" shrink>
                      Primary network *
                    </InputLabel>
                    <Select
                      labelId="edit-primary-network-label"
                      id="edit-primary-network"
                      label="Primary network *"
                      notched
                      disabled={isLoadingNetworks}
                      value={primaryNetwork}
                      endAdornment={renderFieldHelpIcon(
                        'The Compute Engine network for the cluster VMs.'
                      )}
                      onChange={e => {
                        setPrimaryNetwork(e.target.value as string);
                        setSubnetwork('');
                      }}
                    >
                      {resolvedNetworkOptions.map(net => (
                        <MenuItem key={net} value={net}>
                          {net}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl
                    size="small"
                    fullWidth
                    variant="outlined"
                    error={hasNoSubnetworks}
                    className="edit-drawer-select-with-help"
                  >
                    <InputLabel
                      id="edit-subnetwork-label"
                      shrink
                      error={hasNoSubnetworks}
                    >
                      Subnetwork
                    </InputLabel>
                    <Select
                      labelId="edit-subnetwork-label"
                      id="edit-subnetwork"
                      label="Subnetwork"
                      notched
                      error={hasNoSubnetworks}
                      disabled={isLoadingSubnetworks}
                      value={
                        resolvedSubnetworkOptions.includes(subnetwork)
                          ? subnetwork
                          : ''
                      }
                      endAdornment={renderFieldHelpIcon(
                        'The Compute Engine subnetwork with Private Google Access enabled.'
                      )}
                      onChange={e => setSubnetwork(e.target.value as string)}
                    >
                      {resolvedSubnetworkOptions.length === 0 ? (
                        <MenuItem value="" disabled>
                          No subnetworks available
                        </MenuItem>
                      ) : (
                        resolvedSubnetworkOptions.map(sub => (
                          <MenuItem key={sub} value={sub}>
                            {sub}
                          </MenuItem>
                        ))
                      )}
                    </Select>
                  </FormControl>
                </div>

                {hasNoSubnetworks && (
                  <div className="edit-drawer-error-text">
                    Please select a valid network and subnetwork.
                  </div>
                )}

                <div className="edit-drawer-field-group">
                  <TextField
                    id="edit-network-tags"
                    label="Network tags"
                    placeholder="Network tags"
                    value={networkTagsText}
                    onChange={e => setNetworkTagsText(e.target.value)}
                    variant="outlined"
                    size="small"
                    fullWidth
                  />
                  <div className="edit-drawer-helper-text">
                    {NETWORK_TAG_MESSAGE}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Option 2: Networks shared from host project */}
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
                  {`Networks shared from host project: "${hostProjectId}"`}
                </div>
                <div className="edit-drawer-helper-text">
                  Choose a shared VPC network from project that is different
                  from this cluster&apos;s project.
                  <div>
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
                      {renderExternalLinkIcon()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {networkSource === 'shared_from_host' && (
              <div className="edit-drawer-nested-fields">
                <FormControl
                  size="small"
                  fullWidth
                  variant="outlined"
                  error={hasNoSharedSubnetworks}
                >
                  <InputLabel
                    id="edit-shared-subnetwork-label"
                    shrink
                    error={hasNoSharedSubnetworks}
                  >
                    Shared subnetwork
                  </InputLabel>
                  <Select
                    labelId="edit-shared-subnetwork-label"
                    id="edit-shared-subnetwork"
                    label="Shared subnetwork"
                    notched
                    error={hasNoSharedSubnetworks}
                    disabled={isLoadingSharedSubnetworks}
                    displayEmpty
                    value={
                      resolvedSharedSubnetworkOptions.includes(sharedSubnetwork)
                        ? sharedSubnetwork
                        : ''
                    }
                    onChange={e =>
                      setSharedSubnetwork(e.target.value as string)
                    }
                  >
                    {resolvedSharedSubnetworkOptions.length === 0 ? (
                      <MenuItem value="" disabled>
                        No shared subnetworks available
                      </MenuItem>
                    ) : (
                      resolvedSharedSubnetworkOptions.map(sub => (
                        <MenuItem key={sub} value={sub}>
                          {sub}
                        </MenuItem>
                      ))
                    )}
                  </Select>
                </FormControl>
                {hasNoSharedSubnetworks && (
                  <div className="edit-drawer-error-text">
                    No shared subnetworks are available in this region.
                  </div>
                )}
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
              <div className="edit-drawer-option-title">User Account</div>
            </div>
          </div>

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
              <div className="edit-drawer-option-title">Service Account</div>
            </div>
          </div>

          {executionIdentity === 'service_account' && (
            <div className="edit-drawer-nested-fields">
              <TextField
                id="edit-service-account"
                label="Service account"
                value={serviceAccount}
                onChange={e => setServiceAccount(e.target.value)}
                variant="outlined"
                size="small"
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
              <div className="edit-drawer-helper-text">
                If not provided, the default GCE service account will be used.{' '}
                <span
                  role="button"
                  tabIndex={0}
                  className="section-detail-link"
                  onClick={() => openExternalLink(SERVICE_ACCOUNT)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      openExternalLink(SERVICE_ACCOUNT);
                    }
                  }}
                >
                  Learn more
                </span>
              </div>
            </div>
          )}
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
                <div className="edit-drawer-radio-option">
                  <Radio
                    id="edit-kms-mode-select"
                    checked={kmsKeySelectionMode === 'select'}
                    onChange={() => setKmsKeySelectionMode('select')}
                    size="small"
                    color="primary"
                  />
                  <div
                    className="edit-drawer-row"
                    style={{ flex: 1, width: '100%' }}
                  >
                    <FormControl size="small" fullWidth variant="outlined">
                      <InputLabel id="edit-kms-keyring-label" shrink>
                        Key rings
                      </InputLabel>
                      <Select
                        labelId="edit-kms-keyring-label"
                        id="edit-kms-keyring"
                        label="Key rings"
                        notched
                        value={keyRing}
                        onChange={e => {
                          setKmsKeySelectionMode('select');
                          setKeyRing(e.target.value as string);
                        }}
                      >
                        {resolvedKeyRingOptions.map(ring => (
                          <MenuItem key={ring} value={ring}>
                            {ring}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    <FormControl size="small" fullWidth variant="outlined">
                      <InputLabel id="edit-kms-key-label" shrink>
                        Keys
                      </InputLabel>
                      <Select
                        labelId="edit-kms-key-label"
                        id="edit-kms-key"
                        label="Keys"
                        notched
                        value={cryptoKey}
                        onChange={e => {
                          setKmsKeySelectionMode('select');
                          setCryptoKey(e.target.value as string);
                        }}
                      >
                        {resolvedCryptoKeyOptions.map(key => (
                          <MenuItem key={key} value={key}>
                            {key}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </div>
                </div>

                <div className="edit-drawer-radio-option">
                  <Radio
                    id="edit-kms-mode-manual"
                    checked={kmsKeySelectionMode === 'manual'}
                    onChange={() => setKmsKeySelectionMode('manual')}
                    size="small"
                    color="primary"
                  />
                  <div style={{ flex: 1, width: '100%' }}>
                    <TextField
                      id="edit-kms-key-name"
                      label="Cloud KMS key"
                      placeholder="Enter key manually"
                      value={kmsKeyName}
                      onChange={e => handleManualKmsKeyChange(e.target.value)}
                      error={
                        kmsKeySelectionMode === 'manual' && !isValidManualKey
                      }
                      variant="outlined"
                      size="small"
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                    />
                  </div>
                </div>
                <div className="edit-drawer-helper-text">{KEY_MESSAGE}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </EditDrawer>
  );
};

