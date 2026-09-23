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
import { Controller, useForm } from 'react-hook-form';
import { JupyterLab } from '@jupyterlab/application';
import { IThemeManager, Notification } from '@jupyterlab/apputils';
import { ILauncher } from '@jupyterlab/launcher';
import { ISettingRegistry } from '@jupyterlab/settingregistry';
import { LabIcon } from '@jupyterlab/ui-components';
import {
  Checkbox,
  CircularProgress,
  FormControl,
  FormControlLabel,
  InputLabel,
  ListSubheader,
  MenuItem,
  Select,
  SelectChangeEvent,
  TextField
} from '@mui/material';

import { DataprocWidget } from '../controls/DataprocWidget';
import LeftArrowIcon from '../../style/icons/left_arrow_icon.svg';
import expandLessIcon from '../../style/icons/expand_less.svg';
import expandMoreIcon from '../../style/icons/expand_more.svg';
import { SectionDetail, ISectionProperty } from '../controls/SectionDetail';
import '../../style/runtimeProfile.css';
import {
  // DATAPROC_TIER_DOC,
  LIGHTNING_ENGINE_DOC,
  RUNTIME_PROFILE_INTRO_TEXT,
  TIER_SECTION_TITLE,
  TIER_SECTION_SUBTITLE,
  TIER_PREMIUM_TITLE,
  TIER_PREMIUM_DESC,
  TIER_STANDARD_TITLE,
  TIER_STANDARD_DESC,
  TIER_STANDARD_INFO_BANNER,
  LIGHTNING_ENGINE_CHECKBOX_LABEL,
  LIGHTNING_ENGINE_CHECKBOX_DESC,
  EXECUTOR_CONFIG_SECTION_TITLE,
  EXECUTOR_CONFIG_SECTION_SUBTITLE,
  EXECUTOR_CATEGORY_GENERAL_TITLE,
  EXECUTOR_CATEGORY_GENERAL_SUB1,
  EXECUTOR_CATEGORY_GENERAL_SUB2,
  EXECUTOR_CATEGORY_ACCELERATED_TITLE,
  EXECUTOR_CATEGORY_ACCELERATED_SUB1,
  EXECUTOR_CATEGORY_ACCELERATED_SUB2,
  EXECUTOR_CATEGORY_ACCELERATED_SUB3,
  EXECUTOR_SHAPES_SUBHEADING,
  EXECUTOR_ACCELERATED_SHAPES_SUBHEADING
} from '../utils/const';
import {
  ExecutorCategoryType,
  IAutoscalingConfig,
  ICreateRuntimeProfilePayload,
  IDriverAndExecutorConfiguration,
  IDriverConfig,
  IExecutorAndDriverConfig,
  IExecutorDiskConfig,
  IMachineTypeOption,
  IMetastoreConfig,
  INetworkAndSecurityConfig,
  IRegionOption,
  IRuntimeEnvironmentConfig,
  ISessionLifecycleConfig,
  ProfileLabels,
  SparkProperties
} from './runtimeProfileInterface';
import {
  MOCK_ACCELERATED_MACHINE_TYPES,
  MOCK_GENERAL_MACHINE_TYPES,
  RuntimeProfileService,
  runtimeProfileService
} from './runtimeProfileService';

interface IRuntimeProfileFormData {
  displayName: string;
  region: string;
  description: string;
}

const iconLeftArrow = new LabIcon({
  name: 'launcher:left-arrow-icon',
  svgstr: LeftArrowIcon
});

const iconExpandLess = new LabIcon({
  name: 'launcher:expand-less-icon',
  svgstr: expandLessIcon
});

const iconExpandMore = new LabIcon({
  name: 'launcher:expand-more-icon',
  svgstr: expandMoreIcon
});

const InfoCircleIcon: React.FC<{ size?: number }> = ({ size = 20 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"
      fill="#1a73e8"
    />
  </svg>
);

export const DEFAULT_RUNTIME_ENVIRONMENT_CONFIG: IRuntimeEnvironmentConfig = {
  runtimeProfileId: 'Name of the runtime profile',
  runtimeVersion: '2.3 LTS (Spark 3.5.1, Python 3.12)',
  customSparkImage: 'None',
  stagingBucket: 'Auto',
  pythonPackageRepository: 'Google Managed PyPI pull through cache'
};

export const DEFAULT_EXECUTOR_AND_DRIVER_CONFIG: IExecutorAndDriverConfig = {
  tier: 'Standard',
  driverMachineType: 'Standard-4',
  driverDisk: 'standard persistent disk',
  executorType: 'standard',
  executorDisk: 'Standard persistent disk (HDD), 100 GB'
};

export const DEFAULT_DRIVER_AND_EXECUTOR_CONFIG: IDriverAndExecutorConfiguration =
  DEFAULT_EXECUTOR_AND_DRIVER_CONFIG;

export const DEFAULT_AUTOSCALING_CONFIG: IAutoscalingConfig = {
  autoscalingEnabled: true,
  initialExecutors: 2,
  minExecutors: 2,
  maxExecutors: 10
};

export const DEFAULT_METASTORE_CONFIG: IMetastoreConfig = {
  metastore: 'Lakehouse runtime catalog',
  hiveEndpointEnabled: false
};

export const DEFAULT_NETWORK_SECURITY_CONFIG: INetworkAndSecurityConfig = {
  executionIdentity: 'service_account',
  networkInThisProject: 'default',
  encryption: 'google_managed'
};

export const DEFAULT_SESSION_LIFECYCLE_CONFIG: ISessionLifecycleConfig = {
  maxIdleTime: '60 minutes',
  maxSessionTime: '3 days'
};

export const DEFAULT_SPARK_PROPERTIES: SparkProperties = {};

export const DEFAULT_PROFILE_LABELS: ProfileLabels = {};

export const formatRuntimeEnvironmentProperties = (
  config?: IRuntimeEnvironmentConfig
): ISectionProperty[] => {
  if (!config) {
    return [];
  }
  return [
    {
      label: 'Runtime Profile ID',
      value: config.runtimeProfileId || 'Name of the runtime profile'
    },
    {
      label: 'Dataproc Runtime Version',
      value: config.runtimeVersion || '2.3 LTS (Spark 3.5.1, Python 3.12)'
    },
    {
      label: 'Custom spark image',
      value: config.customSparkImage || 'None'
    },
    {
      label: 'Cloud Storage Staging bucket',
      value: config.stagingBucket || 'Auto'
    },
    {
      label: 'Python package repository',
      value:
        config.pythonPackageRepository ||
        'Google Managed PyPI pull through cache'
    }
  ];
};

export const formatExecutorAndDriverProperties = (
  config?: IExecutorAndDriverConfig
): ISectionProperty[] => {
  if (!config) {
    return [];
  }
  return [
    {
      label: 'Tier',
      value: config.tier || 'Standard'
    },
    {
      label: 'Driver machine type',
      value: config.driverMachineType || 'Standard-4'
    },
    {
      label: 'Driver disk',
      value: config.driverDisk || 'standard persistent disk'
    },
    {
      label: 'Executor type',
      value: config.executorType || 'standard'
    },
    {
      label: 'Executor disk',
      value: config.executorDisk || 'Standard persistent disk (HDD), 100 GB'
    }
  ];
};

export const formatDriverAndExecutorProperties =
  formatExecutorAndDriverProperties;

export const formatAutoscalingProperties = (
  config?: IAutoscalingConfig
): ISectionProperty[] => {
  if (!config) {
    return [];
  }
  return [
    {
      label: 'Autoscaling',
      value:
        config.autoscalingEnabled !== undefined
          ? config.autoscalingEnabled
            ? 'Enabled'
            : 'Disabled'
          : 'Enabled'
    },
    {
      label: 'Initial executors',
      value: config.initialExecutors ?? 2
    },
    {
      label: 'Minimum executors',
      value: config.minExecutors ?? 2
    },
    {
      label: 'Maximum executors',
      value: config.maxExecutors ?? 10
    }
  ];
};

export const formatMetastoreProperties = (
  config?: IMetastoreConfig
): ISectionProperty[] => {
  if (!config) {
    return [];
  }
  return [
    {
      label: 'Metastore',
      value: config.metastore || 'None'
    },
    {
      label: 'Hive endpoint',
      value:
        config.hiveEndpointEnabled !== undefined
          ? config.hiveEndpointEnabled
            ? 'Enabled'
            : 'Disabled'
          : 'Disabled'
    }
  ];
};

export const formatNetworkSecurityProperties = (
  config?: INetworkAndSecurityConfig
): ISectionProperty[] => {
  if (!config) {
    return [];
  }
  const executionIdentityDisplayMap: Record<string, string> = {
    service_account: 'Service account',
    user_account: 'User account'
  };
  const encryptionDisplayMap: Record<string, string> = {
    google_managed: 'Google-managed key',
    customer_managed_key: 'Customer-managed key'
  };
  return [
    {
      label: 'Execution identity',
      value:
        (config.executionIdentity &&
          executionIdentityDisplayMap[config.executionIdentity]) ||
        config.executionIdentity ||
        'Service account'
    },
    {
      label: 'Network in this project',
      value: config.networkInThisProject || 'default'
    },
    {
      label: 'Encryption',
      value:
        (config.encryption && encryptionDisplayMap[config.encryption]) ||
        config.encryption ||
        'Google-managed key'
    }
  ];
};

export const formatSessionLifecycleProperties = (
  config?: ISessionLifecycleConfig
): ISectionProperty[] => {
  if (!config) {
    return [];
  }
  return [
    {
      label: 'Maximum idle time',
      value: config.maxIdleTime || '60 minutes'
    },
    {
      label: 'Maximum session time',
      value: config.maxSessionTime || '3 days'
    }
  ];
};

export const formatSparkProperties = (
  properties?: SparkProperties
): ISectionProperty[] => {
  if (!properties || Object.keys(properties).length === 0) {
    return [
      {
        label: 'Spark properties',
        value: 'None'
      }
    ];
  }
  return Object.entries(properties).map(([key, value]) => ({
    label: key,
    value
  }));
};

export const formatOtherCustomizationProperties = (
  sparkProperties?: SparkProperties,
  labels?: ProfileLabels
): ISectionProperty[] => {
  const sparkEntries = sparkProperties ? Object.entries(sparkProperties) : [];
  const labelEntries = labels ? Object.entries(labels) : [];

  return [
    {
      label: 'Spark properties',
      value:
        sparkEntries.length === 0
          ? 'None'
          : sparkEntries.map(([k, v]) => `${k}: ${v}`).join(', ')
    },
    {
      label: 'Labels',
      value:
        labelEntries.length === 0
          ? 'None'
          : labelEntries.map(([k, v]) => `${k}: ${v}`).join(', ')
    }
  ];
};

export const formatProfileLabels = (
  labels?: ProfileLabels
): ISectionProperty[] => {
  if (!labels || Object.keys(labels).length === 0) {
    return [
      {
        label: 'Labels',
        value: 'None'
      }
    ];
  }
  return Object.entries(labels).map(([key, value]) => ({
    label: key,
    value
  }));
};

export interface IRuntimeEnvironmentSectionProps {
  config?: IRuntimeEnvironmentConfig;
  onEdit?: () => void;
  showEdit?: boolean;
  isEditDisabled?: boolean;
}

export const RuntimeEnvironmentSection: React.FC<
  IRuntimeEnvironmentSectionProps
> = ({ config, onEdit, showEdit = true, isEditDisabled = true }) => {
  const properties = React.useMemo(
    () => formatRuntimeEnvironmentProperties(config),
    [config]
  );
  return (
    <SectionDetail
      title="Runtime configuration"
      properties={properties}
      onEdit={onEdit}
      showEdit={showEdit}
      isEditDisabled={isEditDisabled}
    />
  );
};

export interface IExecutorAndDriverSectionProps {
  config?: IExecutorAndDriverConfig;
  onEdit?: () => void;
  showEdit?: boolean;
  isEditDisabled?: boolean;
}

export const ExecutorAndDriverSection: React.FC<
  IExecutorAndDriverSectionProps
> = ({ config, onEdit, showEdit = true, isEditDisabled = true }) => {
  const properties = React.useMemo(
    () => formatExecutorAndDriverProperties(config),
    [config]
  );
  return (
    <SectionDetail
      title="Executor and driver configuration"
      properties={properties}
      onEdit={onEdit}
      showEdit={showEdit}
      isEditDisabled={isEditDisabled}
    />
  );
};

export const DriverAndExecutorSection = ExecutorAndDriverSection;

export interface IAutoscalingSectionProps {
  config?: IAutoscalingConfig;
  onEdit?: () => void;
  showEdit?: boolean;
  isEditDisabled?: boolean;
}

export const AutoscalingSection: React.FC<IAutoscalingSectionProps> = ({
  config,
  onEdit,
  showEdit = true,
  isEditDisabled = true
}) => {
  const properties = React.useMemo(
    () => formatAutoscalingProperties(config),
    [config]
  );
  return (
    <SectionDetail
      title="Autoscaling"
      properties={properties}
      onEdit={onEdit}
      showEdit={showEdit}
      isEditDisabled={isEditDisabled}
    />
  );
};

export interface IMetastoreSectionProps {
  config?: IMetastoreConfig;
  onEdit?: () => void;
  showEdit?: boolean;
  isEditDisabled?: boolean;
}

export const MetastoreSection: React.FC<IMetastoreSectionProps> = ({
  config,
  onEdit,
  showEdit = true,
  isEditDisabled = true
}) => {
  const properties = React.useMemo(
    () => formatMetastoreProperties(config),
    [config]
  );
  return (
    <SectionDetail
      title="Metastore configuration"
      properties={properties}
      onEdit={onEdit}
      showEdit={showEdit}
      isEditDisabled={isEditDisabled}
    />
  );
};

export interface INetworkSecuritySectionProps {
  config?: INetworkAndSecurityConfig;
  onEdit?: () => void;
  showEdit?: boolean;
  isEditDisabled?: boolean;
}

export const NetworkSecuritySection: React.FC<INetworkSecuritySectionProps> = ({
  config,
  onEdit,
  showEdit = true,
  isEditDisabled = true
}) => {
  const properties = React.useMemo(
    () => formatNetworkSecurityProperties(config),
    [config]
  );
  return (
    <SectionDetail
      title="Network and security"
      properties={properties}
      onEdit={onEdit}
      showEdit={showEdit}
      isEditDisabled={isEditDisabled}
    />
  );
};

export interface ISessionLifecycleSectionProps {
  config?: ISessionLifecycleConfig;
  onEdit?: () => void;
  showEdit?: boolean;
  isEditDisabled?: boolean;
}

export const SessionLifecycleSection: React.FC<
  ISessionLifecycleSectionProps
> = ({ config, onEdit, showEdit = true, isEditDisabled = true }) => {
  const properties = React.useMemo(
    () => formatSessionLifecycleProperties(config),
    [config]
  );
  return (
    <SectionDetail
      title="Session lifecycle"
      properties={properties}
      onEdit={onEdit}
      showEdit={showEdit}
      isEditDisabled={isEditDisabled}
    />
  );
};

export interface ISparkPropertiesSectionProps {
  properties?: SparkProperties;
  onEdit?: () => void;
  showEdit?: boolean;
  isEditDisabled?: boolean;
}

export const SparkPropertiesSection: React.FC<ISparkPropertiesSectionProps> = ({
  properties,
  onEdit,
  showEdit = true,
  isEditDisabled = true
}) => {
  const sectionProperties = React.useMemo(
    () => formatSparkProperties(properties),
    [properties]
  );
  return (
    <SectionDetail
      title="Spark Properties"
      properties={sectionProperties}
      onEdit={onEdit}
      showEdit={showEdit}
      isEditDisabled={isEditDisabled}
    />
  );
};

export interface IOtherCustomizationSectionProps {
  sparkProperties?: SparkProperties;
  labels?: ProfileLabels;
  onEdit?: () => void;
  showEdit?: boolean;
  isEditDisabled?: boolean;
}

export const OtherCustomizationSection: React.FC<
  IOtherCustomizationSectionProps
> = ({
  sparkProperties,
  labels,
  onEdit,
  showEdit = true,
  isEditDisabled = true
}) => {
  const properties = React.useMemo(
    () => formatOtherCustomizationProperties(sparkProperties, labels),
    [sparkProperties, labels]
  );
  return (
    <SectionDetail
      title="Other customizations"
      properties={properties}
      onEdit={onEdit}
      showEdit={showEdit}
      isEditDisabled={isEditDisabled}
    />
  );
};

export interface IProfileLabelsSectionProps {
  labels?: ProfileLabels;
  onEdit?: () => void;
  showEdit?: boolean;
  isEditDisabled?: boolean;
}

export const ProfileLabelsSection: React.FC<IProfileLabelsSectionProps> = ({
  labels,
  onEdit,
  showEdit = true,
  isEditDisabled = true
}) => {
  const properties = React.useMemo(() => formatProfileLabels(labels), [labels]);
  return (
    <SectionDetail
      title="Labels"
      properties={properties}
      onEdit={onEdit}
      showEdit={showEdit}
      isEditDisabled={isEditDisabled}
    />
  );
};

export interface ICreateRuntimeProfileComponentProps {
  app?: JupyterLab;
  launcher?: ILauncher;
  themeManager?: IThemeManager;
  settingRegistry?: ISettingRegistry;
  service?: RuntimeProfileService;
  onBack?: () => void;
  onSuccess?: () => void;
  initialRuntimeEnvironmentConfig?: IRuntimeEnvironmentConfig;
  initialExecutorAndDriverConfig?: IExecutorAndDriverConfig;
  initialDriverAndExecutorConfiguration?: IDriverAndExecutorConfiguration;
  initialDriverConfig?: IDriverConfig;
  initialExecutorDiskConfig?: IExecutorDiskConfig;
  initialAutoscalingConfig?: IAutoscalingConfig;
  initialMetastoreConfig?: IMetastoreConfig;
  initialNetworkAndSecurityConfig?: INetworkAndSecurityConfig;
  initialSessionLifecycleConfig?: ISessionLifecycleConfig;
  initialSparkProperties?: SparkProperties;
  initialLabels?: ProfileLabels;
  initialTier?: string;
  initialLightningEngineEnabled?: boolean;
  initialExecutorCategory?: ExecutorCategoryType;
  initialExecutorType?: string;
}

export const CreateRuntimeProfileComponent: React.FC<
  ICreateRuntimeProfileComponentProps
> = ({
  app,
  service = runtimeProfileService,
  onBack,
  onSuccess,
  initialRuntimeEnvironmentConfig,
  initialExecutorAndDriverConfig,
  initialDriverAndExecutorConfiguration,
  initialDriverConfig,
  initialExecutorDiskConfig,
  initialAutoscalingConfig,
  initialMetastoreConfig,
  initialNetworkAndSecurityConfig,
  initialSessionLifecycleConfig,
  initialSparkProperties,
  initialLabels,
  initialTier,
  initialLightningEngineEnabled,
  initialExecutorCategory,
  initialExecutorType
}): React.JSX.Element => {
  // Options & Data State
  const [regions, setRegions] = useState<IRegionOption[]>([]);
  const [isLoadingOptions, setIsLoadingOptions] = useState<boolean>(true);
  const [expandAdditionalConfig, setExpandAdditionalConfig] =
    useState<boolean>(true);

  // Tier, Lightning Engine, and Executor configuration state
  const [tier, setTier] = useState<string>(
    initialTier ||
      initialExecutorAndDriverConfig?.tier ||
      initialDriverAndExecutorConfiguration?.tier ||
      'Premium'
  );
  const [lightningEngineEnabled, setLightningEngineEnabled] = useState<boolean>(
    initialLightningEngineEnabled !== undefined
      ? initialLightningEngineEnabled
      : initialRuntimeEnvironmentConfig?.lightningEngineEnabled !== undefined
      ? initialRuntimeEnvironmentConfig.lightningEngineEnabled
      : true
  );
  const [executorCategory, setExecutorCategory] =
    useState<ExecutorCategoryType>(initialExecutorCategory || 'general');
  const [executorType, setExecutorType] = useState<string>(
    initialExecutorType || 'highmem-4'
  );
  const [machineTypes, setMachineTypes] = useState<IMachineTypeOption[]>(
    MOCK_GENERAL_MACHINE_TYPES
  );

  // Configuration states using domain interfaces
  const [runtimeEnvironmentConfig] = useState<IRuntimeEnvironmentConfig>(
    initialRuntimeEnvironmentConfig || DEFAULT_RUNTIME_ENVIRONMENT_CONFIG
  );
  const [driverAndExecutorConfiguration] =
    useState<IDriverAndExecutorConfiguration>(
      initialExecutorAndDriverConfig ||
        initialDriverAndExecutorConfiguration || {
          ...DEFAULT_DRIVER_AND_EXECUTOR_CONFIG,
          ...(initialDriverConfig || {}),
          ...(initialExecutorDiskConfig || {})
        }
    );
  const [autoscalingConfig] = useState<IAutoscalingConfig>(
    initialAutoscalingConfig || DEFAULT_AUTOSCALING_CONFIG
  );
  const [metastoreConfig] = useState<IMetastoreConfig>(
    initialMetastoreConfig || DEFAULT_METASTORE_CONFIG
  );
  const [networkAndSecurityConfig] = useState<INetworkAndSecurityConfig>(
    initialNetworkAndSecurityConfig || DEFAULT_NETWORK_SECURITY_CONFIG
  );
  const [sessionLifecycleConfig] = useState<ISessionLifecycleConfig>(
    initialSessionLifecycleConfig || DEFAULT_SESSION_LIFECYCLE_CONFIG
  );
  const [sparkProperties] = useState<SparkProperties>(
    initialSparkProperties || DEFAULT_SPARK_PROPERTIES
  );
  const [labels] = useState<ProfileLabels>(
    initialLabels || DEFAULT_PROFILE_LABELS
  );

  // Synchronized driver & executor configuration for Additional configuration section
  const activeDriverAndExecutorConfig: IDriverAndExecutorConfiguration =
    React.useMemo(() => {
      const allTypes = [
        ...MOCK_GENERAL_MACHINE_TYPES,
        ...MOCK_ACCELERATED_MACHINE_TYPES
      ];
      const selectedMachine = allTypes.find(m => m.name === executorType);
      return {
        ...driverAndExecutorConfiguration,
        tier,
        executorType: selectedMachine ? selectedMachine.label : executorType
      };
    }, [driverAndExecutorConfiguration, tier, executorType]);

  const handleTierChange = (selectedTier: string) => {
    setTier(selectedTier);
    if (selectedTier === 'Standard') {
      if (executorCategory === 'accelerated') {
        setExecutorCategory('general');
        setExecutorType('highmem-4');
      }
    }
  };

  const handleExecutorCategoryChange = (category: ExecutorCategoryType) => {
    if (tier === 'Standard' && category === 'accelerated') {
      return;
    }
    setExecutorCategory(category);
    if (category === 'general') {
      setExecutorType('highmem-4');
    } else if (category === 'accelerated') {
      setExecutorType('l4-4');
    }
  };

  // Load machine types when executorCategory changes
  useEffect(() => {
    let isMounted = true;
    const loadMachineTypes = async () => {
      if (service?.getMachineTypes) {
        try {
          const types = await service.getMachineTypes(executorCategory);
          if (isMounted && types && types.length > 0) {
            setMachineTypes(types);
            return;
          }
        } catch (error) {
          console.error(
            'Failed to load machine types for ' + executorCategory,
            error
          );
        }
      }
      if (isMounted) {
        setMachineTypes(
          executorCategory === 'accelerated'
            ? MOCK_ACCELERATED_MACHINE_TYPES
            : MOCK_GENERAL_MACHINE_TYPES
        );
      }
    };

    loadMachineTypes();
    return () => {
      isMounted = false;
    };
  }, [executorCategory, service]);

  // React Hook Form initialization
  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<IRuntimeProfileFormData>({
    mode: 'onChange',
    defaultValues: {
      displayName: '',
      region: '',
      description: ''
    }
  });

  // Load Regions from service
  useEffect(() => {
    let isMounted = true;
    const loadInitialData = async () => {
      setIsLoadingOptions(true);
      try {
        const loadedRegions = await service.getRegions();

        if (isMounted) {
          setRegions(loadedRegions);

          if (loadedRegions.length > 0) {
            setValue('region', loadedRegions[0].name, { shouldValidate: true });
          }
        }
      } catch (error) {
        console.error('Failed to load runtime profile initial data', error);
      } finally {
        if (isMounted) {
          setIsLoadingOptions(false);
        }
      }
    };

    loadInitialData();

    return () => {
      isMounted = false;
    };
  }, [service, setValue]);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (app?.shell?.activeWidget) {
      app.shell.activeWidget.close();
    }
  };

  const onSubmit = async (data: IRuntimeProfileFormData) => {
    try {
      const isLightningEngineActive =
        tier === 'Premium' && Boolean(lightningEngineEnabled);
      const payload: ICreateRuntimeProfilePayload = {
        displayName: data.displayName.trim(),
        region: data.region,
        description: data.description.trim() || undefined,
        tier,
        lightningEngineEnabled: isLightningEngineActive,
        executorConfig: {
          executorType: executorCategory,
          machineType: executorType
        },
        runtimeEnvironmentConfig: {
          ...runtimeEnvironmentConfig,
          lightningEngineEnabled: isLightningEngineActive
        },
        executorAndDriverConfig: activeDriverAndExecutorConfig,
        driverAndExecutorConfiguration: activeDriverAndExecutorConfig,
        driverConfig: activeDriverAndExecutorConfig,
        executorDiskConfig: activeDriverAndExecutorConfig,
        autoscalingConfig,
        metastoreConfig,
        networkAndSecurityConfig,
        sessionLifecycleConfig,
        sparkProperties,
        labels
      };

      await service.createRuntimeProfile(payload, undefined, data.region);

      Notification.emit(
        `Runtime profile "${data.displayName}" created successfully.`,
        'success',
        { autoClose: 5000 }
      );

      if (onSuccess) {
        onSuccess();
      } else {
        handleBack();
      }
    } catch (error: any) {
      const errorMessage =
        error?.message || 'Failed to create runtime profile.';
      Notification.emit(errorMessage, 'error', { autoClose: 5000 });
    }
  };

  return (
    <div className="runtime-profile-main-wrapper">
      <div className="cluster-details-header">
        <div
          className="back-arrow-icon"
          onClick={handleBack}
          onKeyDown={event => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              handleBack();
            }
          }}
          role="button"
          tabIndex={0}
          aria-label="Back"
        >
          <iconLeftArrow.react
            tag="div"
            className="icon-white logo-alignment-style"
          />
        </div>
        <div className="cluster-details-title">Create a runtime profile</div>
      </div>

      <div className="runtime-profile-container">
        <div className="runtime-profile-intro-text">
          {RUNTIME_PROFILE_INTRO_TEXT}
        </div>

        <form
          className="runtime-profile-form"
          onSubmit={handleSubmit(onSubmit)}
        >
          {/* Row 1: Display name & Region */}
          <div className="runtime-profile-row">
            <div className="runtime-profile-col">
              <Controller
                name="displayName"
                control={control}
                rules={{
                  required: 'Display name is required',
                  validate: value =>
                    value.trim().length > 0 || 'Display name is required'
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    id="runtime-profile-display-name"
                    label="Display name"
                    placeholder="e.g. my-runtime-profile"
                    variant="outlined"
                    size="small"
                    fullWidth
                    error={Boolean(errors.displayName)}
                    helperText={errors.displayName?.message}
                    InputLabelProps={{ shrink: true }}
                  />
                )}
              />
            </div>
            <div className="runtime-profile-col">
              <FormControl size="small" fullWidth variant="outlined">
                <InputLabel id="runtime-profile-region-label" shrink>
                  Region *
                </InputLabel>
                <Controller
                  name="region"
                  control={control}
                  rules={{ required: 'Region is required' }}
                  render={({ field }) => (
                    <Select
                      {...field}
                      labelId="runtime-profile-region-label"
                      id="runtime-profile-region"
                      label="Region *"
                      notched
                      disabled={isLoadingOptions}
                    >
                      {regions.map(r => (
                        <MenuItem key={r.name} value={r.name}>
                          {r.displayName}
                        </MenuItem>
                      ))}
                    </Select>
                  )}
                />
              </FormControl>
            </div>
          </div>

          {/* Row 2: Description */}
          <div className="runtime-profile-full-row">
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  id="runtime-profile-description"
                  label="Description"
                  placeholder="Optional description"
                  variant="outlined"
                  size="small"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
              )}
            />
          </div>
          {/* Section: Tier */}
          <div className="runtime-profile-section">
            <div className="runtime-profile-section-title">
              {TIER_SECTION_TITLE}
            </div>
            <div className="runtime-profile-section-subtitle">
              {TIER_SECTION_SUBTITLE}
            </div>

            {/* Tier Cards: Premium & Standard */}
            <div className="node-config-cards-container">
              <div
                className={`node-config-card ${
                  tier === 'Premium' ? 'selected' : ''
                }`}
                onClick={() => handleTierChange('Premium')}
                role="button"
                tabIndex={0}
                aria-pressed={tier === 'Premium'}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    handleTierChange('Premium');
                  }
                }}
              >
                <div className="node-config-card-title">
                  {TIER_PREMIUM_TITLE}
                </div>
                <div className="node-config-card-desc">{TIER_PREMIUM_DESC}</div>
              </div>

              <div
                className={`node-config-card ${
                  tier === 'Standard' ? 'selected' : ''
                }`}
                onClick={() => handleTierChange('Standard')}
                role="button"
                tabIndex={0}
                aria-pressed={tier === 'Standard'}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    handleTierChange('Standard');
                  }
                }}
              >
                <div className="node-config-card-title">
                  {TIER_STANDARD_TITLE}
                </div>
                <div className="node-config-card-desc">
                  {TIER_STANDARD_DESC}
                </div>
              </div>
            </div>

            {/* Premium: Enable Lightning Engine Checkbox / Standard: Info Banner */}
            {tier === 'Premium' ? (
              <div className="runtime-profile-checkbox-section">
                <FormControlLabel
                  control={
                    <Checkbox
                      size="small"
                      checked={lightningEngineEnabled}
                      onChange={e =>
                        setLightningEngineEnabled(e.target.checked)
                      }
                      name="lightningEngine"
                      color="primary"
                    />
                  }
                  label={
                    <span className="runtime-profile-checkbox-title">
                      {LIGHTNING_ENGINE_CHECKBOX_LABEL}
                    </span>
                  }
                />
                <div className="runtime-profile-checkbox-desc">
                  {LIGHTNING_ENGINE_CHECKBOX_DESC}{' '}
                  <span
                    className="runtime-profile-learn-more"
                    onClick={e => {
                      e.preventDefault();
                      window.open(LIGHTNING_ENGINE_DOC, '_blank');
                    }}
                    role="button"
                    tabIndex={0}
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
            ) : (
              <div className="runtime-profile-tier-info-banner">
                <div className="runtime-profile-tier-info-icon">
                  <InfoCircleIcon size={20} />
                </div>
                <div className="runtime-profile-tier-info-text">
                  {TIER_STANDARD_INFO_BANNER}
                </div>
              </div>
            )}
          </div>

          {/* Section: Executor configuration */}
          <div className="runtime-profile-section">
            <div className="runtime-profile-section-title">
              {EXECUTOR_CONFIG_SECTION_TITLE}
            </div>
            <div className="runtime-profile-section-subtitle">
              {EXECUTOR_CONFIG_SECTION_SUBTITLE}
            </div>

            {/* Executor Cards: General & Accelerated */}
            <div className="node-config-cards-container">
              <div
                className={`node-config-card ${
                  executorCategory === 'general' ? 'selected' : ''
                }`}
                onClick={() => handleExecutorCategoryChange('general')}
                role="button"
                tabIndex={0}
                aria-pressed={executorCategory === 'general'}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    handleExecutorCategoryChange('general');
                  }
                }}
              >
                <div className="node-config-card-title">
                  {EXECUTOR_CATEGORY_GENERAL_TITLE}
                </div>
                <div className="node-config-card-sub1">
                  {EXECUTOR_CATEGORY_GENERAL_SUB1}
                </div>
                <div className="node-config-card-sub2">
                  {EXECUTOR_CATEGORY_GENERAL_SUB2}
                </div>
              </div>

              <div
                className={`node-config-card ${
                  executorCategory === 'accelerated' ? 'selected' : ''
                } ${tier === 'Standard' ? 'disabled' : ''}`}
                onClick={() => {
                  if (tier !== 'Standard') {
                    handleExecutorCategoryChange('accelerated');
                  }
                }}
                role="button"
                tabIndex={tier === 'Standard' ? -1 : 0}
                aria-disabled={tier === 'Standard'}
                aria-pressed={executorCategory === 'accelerated'}
                onKeyDown={e => {
                  if (
                    tier !== 'Standard' &&
                    (e.key === 'Enter' || e.key === ' ')
                  ) {
                    handleExecutorCategoryChange('accelerated');
                  }
                }}
              >
                <div className="node-config-card-title">
                  {EXECUTOR_CATEGORY_ACCELERATED_TITLE}
                </div>
                <div className="node-config-card-sub1">
                  {EXECUTOR_CATEGORY_ACCELERATED_SUB1}
                </div>
                <div className="node-config-card-sub2">
                  {EXECUTOR_CATEGORY_ACCELERATED_SUB2}
                </div>
                <div className="node-config-card-sub3">
                  {EXECUTOR_CATEGORY_ACCELERATED_SUB3}
                </div>
              </div>
            </div>

            {/* Machine Type Subheading & Select */}
            <div className="machine-type-subheading">
              {executorCategory === 'accelerated'
                ? EXECUTOR_ACCELERATED_SHAPES_SUBHEADING
                : EXECUTOR_SHAPES_SUBHEADING}
            </div>
            <div className="machine-type-select-wrapper">
              <FormControl size="small" fullWidth variant="outlined">
                <InputLabel id="runtime-profile-executor-type-label" shrink>
                  Executor type
                </InputLabel>
                <Select
                  labelId="runtime-profile-executor-type-label"
                  id="runtime-profile-executor-type"
                  value={executorType}
                  label="Executor type"
                  onChange={(e: SelectChangeEvent) =>
                    setExecutorType(e.target.value as string)
                  }
                  notched
                >
                  {executorCategory === 'accelerated'
                    ? (() => {
                        const l4Types = machineTypes.filter(
                          m =>
                            m.acceleratorType === 'l4' ||
                            m.name.toLowerCase().startsWith('l4')
                        );
                        const a100Types = machineTypes.filter(
                          m =>
                            m.acceleratorType?.startsWith('a100') ||
                            m.name.toLowerCase().startsWith('a100')
                        );
                        const otherTypes = machineTypes.filter(
                          m => !l4Types.includes(m) && !a100Types.includes(m)
                        );
                        const items: React.JSX.Element[] = [];

                        if (l4Types.length > 0) {
                          items.push(
                            <ListSubheader
                              key="header-l4"
                              className="machine-type-group-header"
                              disableSticky
                            >
                              L4
                            </ListSubheader>
                          );
                          l4Types.forEach(m => {
                            items.push(
                              <MenuItem key={m.name} value={m.name}>
                                {m.label}
                              </MenuItem>
                            );
                          });
                        }

                        if (a100Types.length > 0) {
                          items.push(
                            <ListSubheader
                              key="header-a100"
                              className="machine-type-group-header"
                              disableSticky
                            >
                              A100
                            </ListSubheader>
                          );
                          a100Types.forEach(m => {
                            items.push(
                              <MenuItem key={m.name} value={m.name}>
                                {m.label}
                              </MenuItem>
                            );
                          });
                        }

                        if (otherTypes.length > 0) {
                          items.push(
                            <ListSubheader
                              key="header-other"
                              className="machine-type-group-header"
                              disableSticky
                            >
                              Other
                            </ListSubheader>
                          );
                          otherTypes.forEach(m => {
                            items.push(
                              <MenuItem key={m.name} value={m.name}>
                                {m.label}
                              </MenuItem>
                            );
                          });
                        }

                        return items;
                      })()
                    : machineTypes.map(m => (
                        <MenuItem key={m.name} value={m.name}>
                          {m.label}
                        </MenuItem>
                      ))}
                </Select>
              </FormControl>
            </div>
          </div>
          {/* Additional configuration (70% width) */}
          <div className="additional-config-section">
            <div
              className="additional-config-header-container"
              style={{
                marginBottom: expandAdditionalConfig ? '16px' : '0px'
              }}
              onClick={() => setExpandAdditionalConfig(!expandAdditionalConfig)}
              onKeyDown={event => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  setExpandAdditionalConfig(!expandAdditionalConfig);
                }
              }}
              role="button"
              tabIndex={0}
              aria-expanded={expandAdditionalConfig}
            >
              <div className="additional-config-header">
                Additional configuration
              </div>
              <div
                className="expand-icon"
                style={{ display: 'flex', alignItems: 'center' }}
              >
                {expandAdditionalConfig ? (
                  <iconExpandLess.react
                    tag="div"
                    className="logo-alignment-style"
                  />
                ) : (
                  <iconExpandMore.react
                    tag="div"
                    className="logo-alignment-style"
                  />
                )}
              </div>
            </div>

            {expandAdditionalConfig && (
              <div className="additional-config-content">
                {/* Section 1: Runtime environment */}
                <RuntimeEnvironmentSection
                  config={runtimeEnvironmentConfig}
                  isEditDisabled={true}
                  onEdit={() => {
                    // TODO - add the edit functionality for this section
                  }}
                />

                {/* Section 2: Executor & Driver Configuration */}
                <ExecutorAndDriverSection
                  config={activeDriverAndExecutorConfig}
                  isEditDisabled={true}
                  onEdit={() => {
                    // TODO - add the edit functionality for this section
                  }}
                />

                {/* Section 3: Autoscaling */}
                <AutoscalingSection
                  config={autoscalingConfig}
                  isEditDisabled={true}
                  onEdit={() => {
                    // TODO - add the edit functionality for this section
                  }}
                />

                {/* Section 4: Metastore */}
                <MetastoreSection
                  config={metastoreConfig}
                  isEditDisabled={true}
                  onEdit={() => {
                    // TODO - add the edit functionality for this section
                  }}
                />

                {/* Section 5: Network and Security */}
                <NetworkSecuritySection
                  config={networkAndSecurityConfig}
                  isEditDisabled={true}
                  onEdit={() => {
                    // TODO - add the edit functionality for this section
                  }}
                />

                {/* Section 6: Session Lifecycle */}
                <SessionLifecycleSection
                  config={sessionLifecycleConfig}
                  isEditDisabled={true}
                  onEdit={() => {
                    // TODO - add the edit functionality for this section
                  }}
                />

                {/* Section 7: Other Customization */}
                <OtherCustomizationSection
                  sparkProperties={sparkProperties}
                  labels={labels}
                  isEditDisabled={true}
                  onEdit={() => {
                    // TODO - add the edit functionality for this section
                  }}
                />
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="runtime-profile-buttons">
            {/* TODO - create functionality to be enabled during API integration process */}
            <button
              type="submit"
              disabled={true}
              className="submit-button-disable-style"
            >
              {isSubmitting ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                'Create a runtime profile'
              )}
            </button>
            <button
              type="button"
              className="job-cancel-button-style"
              onClick={handleBack}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export class CreateRuntimeProfile extends DataprocWidget {
  app: JupyterLab;
  launcher: ILauncher;
  settingRegistry: ISettingRegistry;

  constructor(
    app: JupyterLab,
    launcher: ILauncher,
    themeManager: IThemeManager,
    settingRegistry: ISettingRegistry
  ) {
    super(themeManager);
    this.app = app;
    this.launcher = launcher;
    this.settingRegistry = settingRegistry;
  }

  renderInternal(): React.JSX.Element {
    return (
      <CreateRuntimeProfileComponent
        app={this.app}
        launcher={this.launcher}
        themeManager={this.themeManager}
        settingRegistry={this.settingRegistry}
      />
    );
  }
}

export { SectionDetail };
