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
  ListSubheader,
  MenuItem,
  Select,
  TextField
} from '@mui/material';
import { EditDrawer } from '../controls/EditDrawer';
import {
  IExecutorAndDriverConfig,
  IMachineTypeOption,
  IRuntimeEnvironmentConfig
} from './runtimeProfileInterface';
import {
  CUSTOM_CONTAINERS,
  CUSTOM_CONTAINER_MESSAGE,
  CUSTOM_CONTAINER_MESSAGE_PART,
  DATAPROC_TIER_DOC,
  LIGHTNING_ENGINE_DOC
} from '../utils/const';
import {
  MOCK_ACCELERATED_MACHINE_TYPES,
  MOCK_GENERAL_MACHINE_TYPES
} from './runtimeProfileService';

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

export const DISK_TIER_OPTIONS: string[] = ['HDD (standard)', 'SSD (premium)'];

export const HDD_DISK_SIZES: string[] = [
  '200 GiB',
  '300 GiB',
  '400 GiB',
  '500 GiB',
  '600 GiB',
  '700 GiB',
  '800 GiB',
  '900 GiB',
  '1000 GiB',
  '1100 GiB',
  '1200 GiB',
  '1300 GiB',
  '1400 GiB',
  '1500 GiB'
];

export const SSD_DISK_SIZES: string[] = [
  '375 GiB',
  '750 GiB',
  '1500 GiB',
  '3000 GiB',
  '6000 GiB',
  '9000 GiB'
];

export const parseDiskTierAndSize = (
  diskStr?: string,
  defaultTier: string = 'HDD (standard)'
): { tier: string; size: string } => {
  if (!diskStr || diskStr.trim() === '') {
    return {
      tier: defaultTier,
      size: defaultTier === 'SSD (premium)' ? '375 GiB' : '200 GiB'
    };
  }
  const lower = diskStr.toLowerCase();
  const isSsd = lower.includes('ssd') || lower.includes('premium');
  const tier = isSsd ? 'SSD (premium)' : 'HDD (standard)';
  const match = diskStr.match(/(\d+)\s*(?:gib|gb|g)?/i);
  let size = isSsd ? '375 GiB' : '200 GiB';
  if (match) {
    const rawNum = match[1];
    const formatted = `${rawNum} GiB`;
    if (isSsd) {
      size = SSD_DISK_SIZES.includes(formatted) ? formatted : '375 GiB';
    } else {
      size = HDD_DISK_SIZES.includes(formatted) ? formatted : `${rawNum} GiB`;
    }
  }
  return { tier, size };
};

export const normalizeMachineTypeName = (
  raw?: string,
  allTypes: IMachineTypeOption[] = [
    ...MOCK_GENERAL_MACHINE_TYPES,
    ...MOCK_ACCELERATED_MACHINE_TYPES
  ]
): string => {
  if (!raw || raw.trim() === '') return 'highmem-4';
  const clean = raw.trim().toLowerCase();
  const byName = allTypes.find(m => m.name.toLowerCase() === clean);
  if (byName) return byName.name;
  const byLabel = allTypes.find(m => m.label.toLowerCase() === clean);
  if (byLabel) return byLabel.name;
  const firstWord = clean.split(' ')[0];
  const byFirstWord = allTypes.find(m => m.name.toLowerCase() === firstWord);
  if (byFirstWord) return byFirstWord.name;
  return firstWord || raw;
};

export const isAcceleratedMachine = (
  name: string,
  allTypes: IMachineTypeOption[]
): boolean => {
  const match = allTypes.find(m => m.name === name);
  if (match) {
    return match.category === 'accelerated' || Boolean(match.acceleratorType);
  }
  const clean = name.toLowerCase();
  return (
    clean.startsWith('l4-') ||
    clean.startsWith('a100-') ||
    clean.startsWith('h100-') ||
    clean.startsWith('g2-') ||
    clean.startsWith('a2-')
  );
};

export interface IExecutorAndDriverEditDrawerProps {
  open: boolean;
  config: IExecutorAndDriverConfig;
  onClose: () => void;
  onSave: (updatedConfig: IExecutorAndDriverConfig) => void;
  availableMachineTypes?: IMachineTypeOption[];
}

export const ExecutorAndDriverEditDrawer: React.FC<
  IExecutorAndDriverEditDrawerProps
> = ({ open, config, onClose, onSave, availableMachineTypes }) => {
  const allMachineTypes = React.useMemo(
    () =>
      availableMachineTypes && availableMachineTypes.length > 0
        ? availableMachineTypes
        : [...MOCK_GENERAL_MACHINE_TYPES, ...MOCK_ACCELERATED_MACHINE_TYPES],
    [availableMachineTypes]
  );

  const [draftConfig, setDraftConfig] = useState<{
    tier: string;
    lightningEngineEnabled: boolean;
    executorType: string;
    executorDiskTier: string;
    executorDiskSize: string;
    useDifferentDriverConfig: boolean;
    driverMachineType: string;
    driverDiskTier: string;
    driverDiskSize: string;
  }>({
    tier: 'Premium',
    lightningEngineEnabled: true,
    executorType: 'highmem-4',
    executorDiskTier: 'HDD (standard)',
    executorDiskSize: '200 GiB',
    useDifferentDriverConfig: false,
    driverMachineType: 'highmem-4',
    driverDiskTier: 'HDD (standard)',
    driverDiskSize: '200 GiB'
  });

  const [executorSearch, setExecutorSearch] = useState<string>('');
  const [driverSearch, setDriverSearch] = useState<string>('');

  useEffect(() => {
    if (open) {
      const initialTier = config.tier || 'Premium';
      const initialExecType = normalizeMachineTypeName(
        config.executorMachineType ||
          (typeof config.executorType === 'string'
            ? config.executorType
            : undefined),
        allMachineTypes
      );
      const isExecAcc = isAcceleratedMachine(initialExecType, allMachineTypes);
      const defaultExecDiskTier = isExecAcc
        ? 'SSD (premium)'
        : initialTier === 'Standard'
        ? 'HDD (standard)'
        : 'HDD (standard)';
      const parsedExecDisk = parseDiskTierAndSize(
        config.executorDisk || (config as any).diskType,
        defaultExecDiskTier
      );
      const initialDriverType = normalizeMachineTypeName(
        config.driverMachineType ||
          (config as any).machineType ||
          initialExecType,
        allMachineTypes
      );
      const isDrvAcc = isAcceleratedMachine(initialDriverType, allMachineTypes);
      const defaultDrvDiskTier = isDrvAcc
        ? 'SSD (premium)'
        : initialTier === 'Standard'
        ? 'HDD (standard)'
        : 'HDD (standard)';
      const parsedDrvDisk = parseDiskTierAndSize(
        config.driverDisk || (config as any).disk,
        defaultDrvDiskTier
      );
      const diffDriver = Boolean(config.useDifferentDriverConfig);

      const execDiskTier = isExecAcc
        ? 'SSD (premium)'
        : initialTier === 'Standard'
        ? 'HDD (standard)'
        : config.executorDiskTier || parsedExecDisk.tier;
      const execDiskSize =
        execDiskTier === 'SSD (premium)'
          ? SSD_DISK_SIZES.includes(
              config.executorDiskSize || parsedExecDisk.size
            )
            ? config.executorDiskSize || parsedExecDisk.size
            : '375 GiB'
          : config.executorDiskSize || parsedExecDisk.size;

      const drvDiskTier = diffDriver
        ? isDrvAcc
          ? 'SSD (premium)'
          : initialTier === 'Standard'
          ? 'HDD (standard)'
          : config.driverDiskTier || parsedDrvDisk.tier
        : execDiskTier;

      const drvDiskSize = diffDriver
        ? drvDiskTier === 'SSD (premium)'
          ? SSD_DISK_SIZES.includes(config.driverDiskSize || parsedDrvDisk.size)
            ? config.driverDiskSize || parsedDrvDisk.size
            : '375 GiB'
          : config.driverDiskSize || parsedDrvDisk.size
        : execDiskSize;

      setDraftConfig({
        tier: initialTier,
        lightningEngineEnabled:
          config.lightningEngineEnabled !== undefined
            ? config.lightningEngineEnabled
            : initialTier === 'Premium',
        executorType: initialExecType,
        executorDiskTier: execDiskTier,
        executorDiskSize: execDiskSize,
        useDifferentDriverConfig: diffDriver,
        driverMachineType: diffDriver ? initialDriverType : initialExecType,
        driverDiskTier: drvDiskTier,
        driverDiskSize: drvDiskSize
      });
      setExecutorSearch('');
      setDriverSearch('');
    }
  }, [open, config, allMachineTypes]);

  const handleTierChange = (selectedTier: string) => {
    setDraftConfig(prev => {
      if (selectedTier === 'Standard') {
        const fallbackExec = isAcceleratedMachine(
          prev.executorType,
          allMachineTypes
        )
          ? 'standard-4'
          : prev.executorType;
        const fallbackDriver = isAcceleratedMachine(
          prev.driverMachineType,
          allMachineTypes
        )
          ? 'standard-4'
          : prev.driverMachineType;
        return {
          ...prev,
          tier: 'Standard',
          lightningEngineEnabled: false,
          executorType: fallbackExec,
          executorDiskTier: 'HDD (standard)',
          executorDiskSize: SSD_DISK_SIZES.includes(prev.executorDiskSize)
            ? '200 GiB'
            : prev.executorDiskSize,
          driverMachineType: prev.useDifferentDriverConfig
            ? fallbackDriver
            : fallbackExec,
          driverDiskTier: 'HDD (standard)',
          driverDiskSize: SSD_DISK_SIZES.includes(prev.driverDiskSize)
            ? '200 GiB'
            : prev.driverDiskSize
        };
      } else {
        return {
          ...prev,
          tier: 'Premium',
          lightningEngineEnabled: true
        };
      }
    });
  };

  const isExecutorAccelerated = isAcceleratedMachine(
    draftConfig.executorType,
    allMachineTypes
  );
  const isDriverAccelerated = isAcceleratedMachine(
    draftConfig.driverMachineType,
    allMachineTypes
  );

  const handleExecutorTypeChange = (selectedType: string) => {
    const isAcc = isAcceleratedMachine(selectedType, allMachineTypes);
    setDraftConfig(prev => {
      const nextDiskTier = isAcc ? 'SSD (premium)' : prev.executorDiskTier;
      let nextDiskSize = prev.executorDiskSize;
      if (isAcc && !SSD_DISK_SIZES.includes(nextDiskSize)) {
        nextDiskSize = '375 GiB';
      }
      return {
        ...prev,
        executorType: selectedType,
        executorDiskTier: nextDiskTier,
        executorDiskSize: nextDiskSize,
        driverMachineType: prev.useDifferentDriverConfig
          ? prev.driverMachineType
          : selectedType,
        driverDiskTier: prev.useDifferentDriverConfig
          ? prev.driverDiskTier
          : nextDiskTier,
        driverDiskSize: prev.useDifferentDriverConfig
          ? prev.driverDiskSize
          : nextDiskSize
      };
    });
  };

  const handleExecutorDiskTierChange = (selectedTier: string) => {
    setDraftConfig(prev => {
      let nextSize = prev.executorDiskSize;
      if (
        selectedTier === 'SSD (premium)' &&
        !SSD_DISK_SIZES.includes(nextSize)
      ) {
        nextSize = '375 GiB';
      } else if (
        selectedTier === 'HDD (standard)' &&
        !HDD_DISK_SIZES.includes(nextSize)
      ) {
        nextSize = '200 GiB';
      }
      return {
        ...prev,
        executorDiskTier: selectedTier,
        executorDiskSize: nextSize,
        driverDiskTier: prev.useDifferentDriverConfig
          ? prev.driverDiskTier
          : selectedTier,
        driverDiskSize: prev.useDifferentDriverConfig
          ? prev.driverDiskSize
          : nextSize
      };
    });
  };

  const handleExecutorDiskSizeChange = (selectedSize: string) => {
    setDraftConfig(prev => ({
      ...prev,
      executorDiskSize: selectedSize,
      driverDiskSize: prev.useDifferentDriverConfig
        ? prev.driverDiskSize
        : selectedSize
    }));
  };

  const handleUseDifferentDriverConfigChange = (checked: boolean) => {
    setDraftConfig(prev => ({
      ...prev,
      useDifferentDriverConfig: checked,
      driverMachineType: checked ? prev.driverMachineType : prev.executorType,
      driverDiskTier: checked ? prev.driverDiskTier : prev.executorDiskTier,
      driverDiskSize: checked ? prev.driverDiskSize : prev.executorDiskSize
    }));
  };

  const handleDriverMachineTypeChange = (selectedType: string) => {
    const isAcc = isAcceleratedMachine(selectedType, allMachineTypes);
    setDraftConfig(prev => {
      const nextDiskTier = isAcc ? 'SSD (premium)' : prev.driverDiskTier;
      let nextDiskSize = prev.driverDiskSize;
      if (isAcc && !SSD_DISK_SIZES.includes(nextDiskSize)) {
        nextDiskSize = '375 GiB';
      }
      return {
        ...prev,
        driverMachineType: selectedType,
        driverDiskTier: nextDiskTier,
        driverDiskSize: nextDiskSize
      };
    });
  };

  const handleDriverDiskTierChange = (selectedTier: string) => {
    setDraftConfig(prev => {
      let nextSize = prev.driverDiskSize;
      if (
        selectedTier === 'SSD (premium)' &&
        !SSD_DISK_SIZES.includes(nextSize)
      ) {
        nextSize = '375 GiB';
      } else if (
        selectedTier === 'HDD (standard)' &&
        !HDD_DISK_SIZES.includes(nextSize)
      ) {
        nextSize = '200 GiB';
      }
      return {
        ...prev,
        driverDiskTier: selectedTier,
        driverDiskSize: nextSize
      };
    });
  };

  const handleDriverDiskSizeChange = (selectedSize: string) => {
    setDraftConfig(prev => ({
      ...prev,
      driverDiskSize: selectedSize
    }));
  };

  const handleSave = () => {
    const execObj = allMachineTypes.find(
      m => m.name === draftConfig.executorType
    );
    const drvObj = allMachineTypes.find(
      m => m.name === draftConfig.driverMachineType
    );

    const execLabel = execObj ? execObj.label : draftConfig.executorType;
    const drvLabel = draftConfig.useDifferentDriverConfig
      ? drvObj
        ? drvObj.label
        : draftConfig.driverMachineType
      : execLabel;

    const drvDiskTier = draftConfig.useDifferentDriverConfig
      ? draftConfig.driverDiskTier
      : draftConfig.executorDiskTier;
    const drvDiskSize = draftConfig.useDifferentDriverConfig
      ? draftConfig.driverDiskSize
      : draftConfig.executorDiskSize;

    const updated: IExecutorAndDriverConfig = {
      ...config,
      tier: draftConfig.tier,
      lightningEngineEnabled:
        draftConfig.tier === 'Premium'
          ? draftConfig.lightningEngineEnabled
          : false,
      executorCategory: isAcceleratedMachine(
        draftConfig.executorType,
        allMachineTypes
      )
        ? 'accelerated'
        : 'general',
      executorType: execLabel,
      executorMachineType: draftConfig.executorType,
      executorDiskTier: draftConfig.executorDiskTier,
      executorDiskSize: draftConfig.executorDiskSize,
      executorDisk: `${draftConfig.executorDiskTier}, ${draftConfig.executorDiskSize}`,
      useDifferentDriverConfig: draftConfig.useDifferentDriverConfig,
      driverMachineType: drvLabel,
      driverDiskTier: drvDiskTier,
      driverDiskSize: drvDiskSize,
      driverDisk: `${drvDiskTier}, ${drvDiskSize}`,
      machineType: drvLabel,
      disk: `${drvDiskTier}, ${drvDiskSize}`,
      diskType: `${draftConfig.executorDiskTier}, ${draftConfig.executorDiskSize}`
    };

    onSave(updated);
  };

  const renderMachineTypeDropdown = (
    id: string,
    label: string,
    value: string,
    onChange: (val: string) => void,
    searchQuery: string,
    onSearchChange: (q: string) => void,
    activeTier: string
  ) => {
    const allowed =
      activeTier === 'Standard'
        ? allMachineTypes.filter(m => m.category === 'general')
        : allMachineTypes;

    const filtered = searchQuery.trim()
      ? allowed.filter(
          m =>
            m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            m.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (m.subgroup &&
              m.subgroup.toLowerCase().includes(searchQuery.toLowerCase()))
        )
      : allowed;

    const groups: Record<string, IMachineTypeOption[]> = {};
    filtered.forEach(m => {
      const g =
        m.subgroup ||
        (m.category === 'accelerated' ? 'Accelerated' : 'General (Standard)');
      if (!groups[g]) {
        groups[g] = [];
      }
      groups[g].push(m);
    });

    return (
      <FormControl size="small" fullWidth variant="outlined">
        <InputLabel id={`${id}-label`} shrink>
          {label}
        </InputLabel>
        <Select
          labelId={`${id}-label`}
          id={id}
          label={label}
          notched
          value={value}
          onChange={e => onChange(e.target.value as string)}
          MenuProps={{
            autoFocus: false,
            PaperProps: {
              style: { maxHeight: 380 }
            }
          }}
        >
          <div
            style={{
              padding: '6px 12px',
              position: 'sticky',
              top: 0,
              background: 'var(--jp-layout-color1, #fff)',
              zIndex: 10,
              borderBottom: '1px solid var(--jp-border-color2, #e0e0e0)'
            }}
            onClick={e => e.stopPropagation()}
            onKeyDown={e => e.stopPropagation()}
          >
            <TextField
              size="small"
              placeholder="Filter machine types..."
              fullWidth
              value={searchQuery}
              onChange={e => onSearchChange(e.target.value)}
              onClick={e => e.stopPropagation()}
              onKeyDown={e => e.stopPropagation()}
              variant="outlined"
              inputProps={{ style: { fontSize: 12, padding: '5px 8px' } }}
            />
          </div>
          {Object.entries(groups).map(([groupTitle, items]) => [
            <ListSubheader
              key={`header-${groupTitle}`}
              style={{
                lineHeight: '26px',
                fontWeight: 600,
                fontSize: 11,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                color: 'var(--jp-ui-font-color2, #5f6368)',
                backgroundColor: 'var(--jp-layout-color2, #f1f3f4)'
              }}
            >
              {groupTitle}
            </ListSubheader>,
            ...items.map(m => (
              <MenuItem key={m.name} value={m.name} style={{ fontSize: 13 }}>
                {m.label}
              </MenuItem>
            ))
          ])}
        </Select>
      </FormControl>
    );
  };

  const getExecutorHelperText = () => {
    if (draftConfig.tier === 'Standard') {
      return 'HDD (standard) is used for batch workloads on standard tier.';
    }
    if (isExecutorAccelerated) {
      return 'SSD (premium) is used for accelerated machine types.';
    }
    return 'HDD (standard) suits most workloads. SSD (premium) costs more and pays off on shuffle-heavy or spill-heavy jobs.';
  };

  const getDriverHelperText = () => {
    if (draftConfig.tier === 'Standard') {
      return 'HDD (standard) is used for batch workloads on standard tier.';
    }
    if (isDriverAccelerated) {
      return 'SSD (premium) is used for accelerated machine types.';
    }
    return 'HDD (standard) suits most workloads. SSD (premium) costs more and pays off on shuffle-heavy or spill-heavy jobs.';
  };

  return (
    <EditDrawer
      open={open}
      title="Executor and driver configuration"
      subtitle="Customize compute tier, driver, and executor configuration for your workloads."
      onClose={onClose}
      onSave={handleSave}
    >
      {/* Tier Section */}
      <div className="edit-drawer-field-group">
        <div className="runtime-profile-section-title" style={{ fontSize: 14 }}>
          Tier
        </div>
        <div className="edit-drawer-helper-text">
          Managed Service for Apache Spark offers two tiers for workload
          execution. Use premium tier for accelerated machine types and faster
          workload execution.{' '}
          <span
            role="button"
            tabIndex={0}
            className="section-detail-link"
            onClick={() => window.open(DATAPROC_TIER_DOC, '_blank')}
            onKeyDown={e => {
              if (e.key === 'Enter' || e.key === ' ') {
                window.open(DATAPROC_TIER_DOC, '_blank');
              }
            }}
          >
            Learn more
          </span>
        </div>

        <div
          className="node-config-cards-container"
          style={{
            marginBottom: 12,
            marginTop: 4,
            width: '100%',
            maxWidth: '100%'
          }}
        >
          <div
            className={`node-config-card ${
              draftConfig.tier === 'Premium' ? 'selected' : ''
            }`}
            style={{ width: '50%' }}
            onClick={() => handleTierChange('Premium')}
            role="button"
            tabIndex={0}
            aria-pressed={draftConfig.tier === 'Premium'}
            onKeyDown={e => {
              if (e.key === 'Enter' || e.key === ' ') {
                handleTierChange('Premium');
              }
            }}
          >
            <div className="node-config-card-title">Premium</div>
            <div className="node-config-card-desc">
              Optimized for complex or latency-sensitive queries with
              acceleration engines.
            </div>
          </div>

          <div
            className={`node-config-card ${
              draftConfig.tier === 'Standard' ? 'selected' : ''
            }`}
            style={{ width: '50%' }}
            onClick={() => handleTierChange('Standard')}
            role="button"
            tabIndex={0}
            aria-pressed={draftConfig.tier === 'Standard'}
            onKeyDown={e => {
              if (e.key === 'Enter' || e.key === ' ') {
                handleTierChange('Standard');
              }
            }}
          >
            <div className="node-config-card-title">Standard</div>
            <div className="node-config-card-desc">
              Standard Spark execution environment for routine data processing.
            </div>
          </div>
        </div>

        {draftConfig.tier === 'Standard' && (
          <div className="runtime-profile-info-banner">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="currentColor"
              style={{ flexShrink: 0, marginRight: 8 }}
            >
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
            </svg>
            <span>
              Standard tier will only affect batch execution. Interactive
              sessions always execute on premium tier.
            </span>
          </div>
        )}

        {draftConfig.tier === 'Premium' && (
          <div
            className="runtime-profile-checkbox-section"
            style={{ marginTop: 0, marginBottom: 8 }}
          >
            <FormControlLabel
              control={
                <Checkbox
                  size="small"
                  checked={draftConfig.lightningEngineEnabled}
                  onChange={e =>
                    setDraftConfig(prev => ({
                      ...prev,
                      lightningEngineEnabled: e.target.checked
                    }))
                  }
                  color="primary"
                />
              }
              label={
                <span className="runtime-profile-checkbox-title">
                  Enable Lightning Engine to accelerate performance
                </span>
              }
            />
            <div className="runtime-profile-checkbox-desc">
              Turn on to accelerate your Spark jobs with Lightning Engine.{' '}
              <span
                role="button"
                tabIndex={0}
                className="section-detail-link"
                onClick={() => window.open(LIGHTNING_ENGINE_DOC, '_blank')}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    window.open(LIGHTNING_ENGINE_DOC, '_blank');
                  }
                }}
              >
                Learn more
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Executor Configuration Section */}
      <div className="edit-drawer-field-group">
        <div className="runtime-profile-section-title" style={{ fontSize: 14 }}>
          {draftConfig.useDifferentDriverConfig
            ? 'Executor configuration'
            : 'Executor and driver configuration'}
        </div>
        <div className="edit-drawer-subtitle">
          {draftConfig.useDifferentDriverConfig
            ? 'Executors run your tasks.'
            : 'The driver and executors will share the same machine type and disk configuration.'}
        </div>

        {renderMachineTypeDropdown(
          'edit-executor-machine-type',
          'Executor type',
          draftConfig.executorType,
          handleExecutorTypeChange,
          executorSearch,
          setExecutorSearch,
          draftConfig.tier
        )}

        <FormControl size="small" fullWidth variant="outlined">
          <InputLabel id="edit-executor-disk-tier-label" shrink>
            {draftConfig.useDifferentDriverConfig
              ? 'Executor disk tier'
              : 'Disk tier'}
          </InputLabel>
          <Select
            labelId="edit-executor-disk-tier-label"
            id="edit-executor-disk-tier"
            label={
              draftConfig.useDifferentDriverConfig
                ? 'Executor disk tier'
                : 'Disk tier'
            }
            notched
            value={draftConfig.executorDiskTier}
            disabled={isExecutorAccelerated || draftConfig.tier === 'Standard'}
            onChange={e =>
              handleExecutorDiskTierChange(e.target.value as string)
            }
          >
            {DISK_TIER_OPTIONS.map(opt => (
              <MenuItem key={opt} value={opt}>
                {opt}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" fullWidth variant="outlined">
          <InputLabel id="edit-executor-disk-size-label" shrink>
            {draftConfig.useDifferentDriverConfig
              ? 'Executor disk size'
              : 'Disk size'}
          </InputLabel>
          <Select
            labelId="edit-executor-disk-size-label"
            id="edit-executor-disk-size"
            label={
              draftConfig.useDifferentDriverConfig
                ? 'Executor disk size'
                : 'Disk size'
            }
            notched
            value={draftConfig.executorDiskSize}
            onChange={e =>
              handleExecutorDiskSizeChange(e.target.value as string)
            }
          >
            {(draftConfig.executorDiskTier === 'SSD (premium)'
              ? SSD_DISK_SIZES
              : HDD_DISK_SIZES
            ).map(size => (
              <MenuItem key={size} value={size}>
                {size}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <div className="edit-drawer-helper-text">{getExecutorHelperText()}</div>
      </div>

      {/* Different configuration for driver checkbox */}
      <div className="edit-drawer-field-group" style={{ marginTop: -4 }}>
        <FormControlLabel
          control={
            <Checkbox
              size="small"
              checked={draftConfig.useDifferentDriverConfig}
              onChange={e =>
                handleUseDifferentDriverConfigChange(e.target.checked)
              }
              color="primary"
            />
          }
          label={
            <span className="runtime-profile-checkbox-title">
              Use different configuration for driver
            </span>
          }
        />
        <div
          className="edit-drawer-helper-text"
          style={{ marginLeft: 28, marginTop: -6 }}
        >
          Driver will match executor settings unless checked.
        </div>
      </div>

      {/* Driver Configuration Sub-panel */}
      {draftConfig.useDifferentDriverConfig && (
        <div
          className="edit-drawer-field-group"
          style={{
            paddingTop: 12,
            borderTop: '1px solid var(--jp-border-color2, #e0e0e0)'
          }}
        >
          <div
            className="runtime-profile-section-title"
            style={{ fontSize: 14 }}
          >
            Driver configuration
          </div>
          <div className="edit-drawer-subtitle">
            The driver coordinates your executors and manages metadata.
          </div>

          {renderMachineTypeDropdown(
            'edit-driver-machine-type',
            'Driver machine type',
            draftConfig.driverMachineType,
            handleDriverMachineTypeChange,
            driverSearch,
            setDriverSearch,
            draftConfig.tier
          )}

          <FormControl size="small" fullWidth variant="outlined">
            <InputLabel id="edit-driver-disk-tier-label" shrink>
              Driver disk tier
            </InputLabel>
            <Select
              labelId="edit-driver-disk-tier-label"
              id="edit-driver-disk-tier"
              label="Driver disk tier"
              notched
              value={draftConfig.driverDiskTier}
              disabled={isDriverAccelerated || draftConfig.tier === 'Standard'}
              onChange={e =>
                handleDriverDiskTierChange(e.target.value as string)
              }
            >
              {DISK_TIER_OPTIONS.map(opt => (
                <MenuItem key={opt} value={opt}>
                  {opt}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" fullWidth variant="outlined">
            <InputLabel id="edit-driver-disk-size-label" shrink>
              Driver disk size
            </InputLabel>
            <Select
              labelId="edit-driver-disk-size-label"
              id="edit-driver-disk-size"
              label="Driver disk size"
              notched
              value={draftConfig.driverDiskSize}
              onChange={e =>
                handleDriverDiskSizeChange(e.target.value as string)
              }
            >
              {(draftConfig.driverDiskTier === 'SSD (premium)'
                ? SSD_DISK_SIZES
                : HDD_DISK_SIZES
              ).map(size => (
                <MenuItem key={size} value={size}>
                  {size}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <div className="edit-drawer-helper-text">{getDriverHelperText()}</div>
        </div>
      )}
    </EditDrawer>
  );
};
