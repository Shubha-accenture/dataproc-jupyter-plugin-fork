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

import {
  DATAPROC_LIGHTNING_ENGINE_PROPERTY,
  DATAPROC_TIER_PROPERTY
} from '../utils/const';
import {
  ICreateRuntimeProfilePayload,
  TimeUnit
} from './runtimeProfileInterface';

/**
 * Interface representing the exact Google Cloud Dataproc SessionTemplate API payload schema.
 * Endpoint: POST https://dataproc.googleapis.com/v1/projects/{project}/locations/{location}/sessionTemplates
 */
export interface ISessionTemplateApiPayload {
  name: string;
  description?: string;
  creator?: string;
  createTime?: string;
  updateTime?: string;
  jupyterSession: {
    kernel: string;
    displayName: string;
  };
  labels?: Record<string, string>;
  runtimeConfig?: {
    version?: string;
    containerImage?: string;
    properties?: Record<string, string>;
    repositoryConfig?: {
      pypiRepositoryConfig?: {
        pypiRepository?: string;
      };
    };
  };
  environmentConfig?: {
    executionConfig?: {
      serviceAccount?: string;
      networkTags?: string[];
      kmsKey?: string;
      subnetworkUri?: string;
      idleTtl?: string;
      ttl?: string;
      authentication_config?: {
        user_workload_authentication_type: string;
      };
      stagingBucket?: string;
    };
    peripheralsConfig?: {
      metastoreService?: string;
      sparkHistoryServerConfig?: {
        dataprocCluster?: string;
      };
    };
  };
}

/**
 * Extracts version code from version string.
 * Example: '2.3 LTS (Spark 3.5.1, Python 3.12)' -> '2.3'
 */
export const extractRuntimeVersion = (
  rawVersion?: string
): string | undefined => {
  if (!rawVersion || rawVersion === 'None') {
    return undefined;
  }
  const match = rawVersion.trim().match(/^([0-9]+\.[0-9]+)/);
  return match ? match[1] : rawVersion.trim();
};

/**
 * Normalizes staging bucket by removing gs:// prefix and ignoring 'Auto'
 */
export const normalizeStagingBucket = (
  stagingBucket?: string
): string | undefined => {
  if (
    !stagingBucket ||
    stagingBucket.trim() === '' ||
    stagingBucket === 'Auto'
  ) {
    return undefined;
  }
  return stagingBucket.trim().replace(/^gs:\/\//, '');
};

/**
 * Converts quantity and time unit into standard Dataproc TTL duration format (e.g. '3600s').
 */
export const convertToTtlSeconds = (
  quantity?: number,
  unit?: TimeUnit | string,
  rawString?: string
): string | undefined => {
  if (quantity !== undefined && quantity > 0) {
    let multiplier = 1;
    switch (unit) {
      case 'm':
      case 'minutes':
        multiplier = 60;
        break;
      case 'h':
      case 'hours':
        multiplier = 3600;
        break;
      case 'd':
      case 'days':
        multiplier = 86400;
        break;
      case 's':
      case 'seconds':
      default:
        multiplier = 1;
        break;
    }
    return `${quantity * multiplier}s`;
  }

  if (rawString && rawString.trim() !== '') {
    const trimmed = rawString.trim();
    if (/^\d+s$/.test(trimmed)) {
      return trimmed;
    }
    const match = trimmed.match(/^(\d+)\s*([a-zA-Z]+)?$/);
    if (match) {
      const q = parseInt(match[1], 10);
      const u = match[2] || 's';
      return convertToTtlSeconds(q, u);
    }
  }

  return undefined;
};

export interface IMachineSpec {
  cores: number;
  memoryGb: number;
  acceleratorType?: string;
}

export const KNOWN_MACHINE_SPECS: Record<string, IMachineSpec> = {
  'standard-4': { cores: 4, memoryGb: 16 },
  'highmem-4': { cores: 4, memoryGb: 32 },
  'highcpu-4': { cores: 4, memoryGb: 8 },
  'standard-8': { cores: 8, memoryGb: 32 },
  'highmem-8': { cores: 8, memoryGb: 64 },
  'highcpu-8': { cores: 8, memoryGb: 16 },
  'standard-16': { cores: 16, memoryGb: 64 },
  'highmem-16': { cores: 16, memoryGb: 128 },
  'l4-4': { cores: 4, memoryGb: 16, acceleratorType: 'l4' },
  'l4-8': { cores: 8, memoryGb: 32, acceleratorType: 'l4' },
  'l4-24': { cores: 24, memoryGb: 96, acceleratorType: 'l4' },
  'l4-48': { cores: 48, memoryGb: 192, acceleratorType: 'l4' },
  'a100-40-12': {
    cores: 12,
    memoryGb: 85,
    acceleratorType: 'nvidia-tesla-a100'
  },
  'a100-40-24': {
    cores: 24,
    memoryGb: 170,
    acceleratorType: 'nvidia-tesla-a100'
  },
  'a100-40-48': {
    cores: 48,
    memoryGb: 340,
    acceleratorType: 'nvidia-tesla-a100'
  },
  'a100-40-96': {
    cores: 96,
    memoryGb: 680,
    acceleratorType: 'nvidia-tesla-a100'
  },
  'a100-80-12': {
    cores: 12,
    memoryGb: 170,
    acceleratorType: 'nvidia-tesla-a100'
  },
  'a100-80-24': {
    cores: 24,
    memoryGb: 340,
    acceleratorType: 'nvidia-tesla-a100'
  },
  'a100-80-48': {
    cores: 48,
    memoryGb: 680,
    acceleratorType: 'nvidia-tesla-a100'
  },
  'h100-26': { cores: 26, memoryGb: 234, acceleratorType: 'nvidia-h100-80gb' },
  'h100-208': {
    cores: 208,
    memoryGb: 1872,
    acceleratorType: 'nvidia-h100-80gb'
  },
  'g2-standard-4': { cores: 4, memoryGb: 16, acceleratorType: 'l4' },
  'g2-standard-8': { cores: 8, memoryGb: 32, acceleratorType: 'l4' },
  'g2-standard-16': { cores: 16, memoryGb: 64, acceleratorType: 'l4' },
  'a2-highgpu-1g': {
    cores: 12,
    memoryGb: 85,
    acceleratorType: 'nvidia-tesla-a100'
  }
};

/**
 * Parses machine type name into CPU cores, memory (GB), and optional accelerator
 */
export const parseMachineTypeSpec = (
  machineTypeName?: string
): IMachineSpec | undefined => {
  if (!machineTypeName || machineTypeName.trim() === '') {
    return undefined;
  }
  const cleanName = machineTypeName.trim().toLowerCase().split(' ')[0];
  if (KNOWN_MACHINE_SPECS[cleanName]) {
    return KNOWN_MACHINE_SPECS[cleanName];
  }
  const numMatch = cleanName.match(/-(\d+)$/) || cleanName.match(/(\d+)$/);
  if (numMatch) {
    const cores = parseInt(numMatch[1], 10);
    let multiplier = 4;
    if (cleanName.includes('highmem')) multiplier = 8;
    if (cleanName.includes('highcpu')) multiplier = 2;
    return { cores, memoryGb: cores * multiplier };
  }
  return undefined;
};

/**
 * Parses disk specification string into disk tier ('standard' | 'premium') and size (e.g. '400g').
 * Dataproc Serverless requires a minimum disk size of 250 GB.
 */
export const parseDiskSpec = (
  diskStr?: string,
  defaultSize = '400g'
): { tier?: string; size?: string } => {
  if (!diskStr || diskStr.trim() === '') {
    return {};
  }
  const lower = diskStr.toLowerCase();
  const tier =
    lower.includes('ssd') || lower.includes('premium') ? 'premium' : 'standard';

  const sizeMatch = lower.match(/(\d+)\s*(?:gb|gib|g)?/i);
  let size = defaultSize;
  if (sizeMatch) {
    const parsedNum = parseInt(sizeMatch[1], 10);
    // Dataproc Serverless enforces a minimum disk size of 250 GB
    const clampedNum = parsedNum < 250 ? 250 : parsedNum;
    size = `${clampedNum}g`;
  }
  return { tier, size };
};

/**
 * Generates a clean session template ID from profile display name or ID
 */
export const sanitizeSessionTemplateId = (
  displayName: string,
  preferredId?: string
): string => {
  if (
    preferredId &&
    preferredId.trim() !== '' &&
    preferredId !== 'Name of the runtime profile'
  ) {
    const sanitized = preferredId
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    if (sanitized) {
      return sanitized;
    }
  }

  if (displayName && displayName.trim() !== '') {
    const sanitized = displayName
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    if (sanitized) {
      return sanitized;
    }
  }

  // Generate random 12-char hex matching createRunTime.tsx
  try {
    const cryptoObj: any =
      typeof window !== 'undefined'
        ? window.crypto || (window as any).Crypto
        : undefined;
    if (cryptoObj && typeof cryptoObj.getRandomValues === 'function') {
      const array = new Uint32Array(1);
      cryptoObj.getRandomValues(array);
      const hex = array[0].toString(16).padStart(12, '0');
      return 'runtime-' + hex;
    }
  } catch (e) {
    // ignore
  }

  const randomHex = Math.floor(Math.random() * 0xffffffffffff)
    .toString(16)
    .padStart(12, '0');
  return 'runtime-' + randomHex;
};

/**
 * Maps ICreateRuntimeProfilePayload to Dataproc SessionTemplate API payload schema
 */
export function mapRuntimeProfileToSessionTemplate(
  payload: ICreateRuntimeProfilePayload,
  projectId: string,
  region: string,
  creatorEmail?: string
): ISessionTemplateApiPayload {
  const templateId = sanitizeSessionTemplateId(
    payload.displayName,
    payload.runtimeEnvironmentConfig?.runtimeProfileId
  );

  const targetRegion = payload.region || region;

  // Build spark / runtime properties
  const properties: Record<string, string> = {
    ...(payload.sparkProperties || {})
  };

  // Compute tier (standard vs premium)
  const tier = payload.tier || payload.driverAndExecutorConfiguration?.tier;
  if (tier) {
    properties[DATAPROC_TIER_PROPERTY] = tier.toLowerCase();
  }

  // Lightning Engine
  if (
    (payload as any).lightningEngineEnabled ||
    (payload.runtimeEnvironmentConfig as any)?.lightningEngineEnabled
  ) {
    properties[DATAPROC_LIGHTNING_ENGINE_PROPERTY] = 'lightningEngine';
  }

  // Autoscaling / Dynamic allocation properties
  if (payload.autoscalingConfig) {
    if (payload.autoscalingConfig.autoscalingEnabled !== undefined) {
      properties['spark.dynamicAllocation.enabled'] = String(
        payload.autoscalingConfig.autoscalingEnabled
      );
    }
    if (payload.autoscalingConfig.initialExecutors !== undefined) {
      properties['spark.dynamicAllocation.initialExecutors'] = String(
        payload.autoscalingConfig.initialExecutors
      );
    }
    if (payload.autoscalingConfig.minExecutors !== undefined) {
      properties['spark.dynamicAllocation.minExecutors'] = String(
        payload.autoscalingConfig.minExecutors
      );
    }
    if (payload.autoscalingConfig.maxExecutors !== undefined) {
      properties['spark.dynamicAllocation.maxExecutors'] = String(
        payload.autoscalingConfig.maxExecutors
      );
    }
  }

  // Driver machine type & disk properties
  const driverMachineType =
    payload.driverAndExecutorConfiguration?.driverMachineType ||
    (payload.driverAndExecutorConfiguration as any)?.machineType;
  const driverMachine = parseMachineTypeSpec(driverMachineType);
  if (driverMachine) {
    if (!properties['spark.driver.cores']) {
      properties['spark.driver.cores'] = String(driverMachine.cores);
    }
    if (!properties['spark.driver.memory']) {
      properties['spark.driver.memory'] = `${driverMachine.memoryGb}g`;
    }
  }

  const driverDisk = parseDiskSpec(
    payload.driverAndExecutorConfiguration?.driverDisk ||
      (payload.driverAndExecutorConfiguration as any)?.disk,
    '400g'
  );
  if (driverDisk.tier && !properties['spark.dataproc.driver.disk.tier']) {
    properties['spark.dataproc.driver.disk.tier'] = driverDisk.tier;
    if (
      driverDisk.tier === 'premium' &&
      !properties['spark.dataproc.driver.compute.tier']
    ) {
      properties['spark.dataproc.driver.compute.tier'] = 'premium';
    }
  }
  if (driverDisk.size && !properties['spark.dataproc.driver.disk.size']) {
    properties['spark.dataproc.driver.disk.size'] = driverDisk.size;
  }

  // Executor machine type & accelerator properties
  const executorMachineType =
    payload.executorConfig?.machineType ||
    (typeof payload.driverAndExecutorConfiguration?.executorType === 'string' &&
    payload.driverAndExecutorConfiguration.executorType !== 'standard' &&
    payload.driverAndExecutorConfiguration.executorType !== 'accelerated'
      ? payload.driverAndExecutorConfiguration.executorType
      : undefined);

  const executorMachine = parseMachineTypeSpec(executorMachineType);
  if (executorMachine) {
    if (!properties['spark.executor.cores']) {
      properties['spark.executor.cores'] = String(executorMachine.cores);
    }
    if (!properties['spark.executor.memory']) {
      properties['spark.executor.memory'] = `${executorMachine.memoryGb}g`;
    }
    // High-memory shapes (e.g. highmem-4 with 32 GB RAM for 4 cores = 8 GB/core) exceed the
    // Standard compute tier memory limit of 7,424 MB per core (including 40% memoryOverhead).
    // Dataproc Serverless requires 'premium' compute tier for highmem executor shapes.
    const isHighmemShape =
      executorMachineType?.toLowerCase().includes('highmem') ||
      (executorMachine.cores > 0 &&
        (executorMachine.memoryGb * 1024 * 1.4) / executorMachine.cores > 7424);

    if (
      (isHighmemShape || executorMachine.acceleratorType) &&
      !properties['spark.dataproc.executor.compute.tier']
    ) {
      properties['spark.dataproc.executor.compute.tier'] = 'premium';
    }

    if (executorMachine.acceleratorType) {
      if (!properties['spark.dataproc.executor.resource.accelerator.type']) {
        properties['spark.dataproc.executor.resource.accelerator.type'] =
          executorMachine.acceleratorType;
      }
    }
  }

  if (payload.executorConfig?.executorType === 'accelerated') {
    if (!properties['spark.dataproc.executor.compute.tier']) {
      properties['spark.dataproc.executor.compute.tier'] = 'premium';
    }
    if (!properties['spark.dataproc.executor.resource.accelerator.type']) {
      properties['spark.dataproc.executor.resource.accelerator.type'] = 'l4';
    }
  }

  // Executor disk properties
  const executorDisk = parseDiskSpec(
    payload.driverAndExecutorConfiguration?.executorDisk ||
      (payload.driverAndExecutorConfiguration as any)?.diskType,
    '400g'
  );
  if (executorDisk.tier && !properties['spark.dataproc.executor.disk.tier']) {
    properties['spark.dataproc.executor.disk.tier'] = executorDisk.tier;
  }
  if (executorDisk.size && !properties['spark.dataproc.executor.disk.size']) {
    properties['spark.dataproc.executor.disk.size'] = executorDisk.size;
  }

  // BigLake / Lakehouse Metastore properties (matching createRunTime.tsx)
  if (
    payload.metastoreConfig?.metastore === 'Lakehouse runtime catalog' ||
    payload.metastoreConfig?.metastore === 'biglake'
  ) {
    properties['spark.sql.catalog.biglake'] =
      'org.apache.iceberg.spark.SparkCatalog';
    properties['spark.sql.catalog.biglake.type'] = 'hadoop';
  }

  // Runtime Config
  const runtimeVersion = extractRuntimeVersion(
    payload.runtimeEnvironmentConfig?.runtimeVersion
  );
  const customImage =
    payload.runtimeEnvironmentConfig?.customSparkImage &&
    payload.runtimeEnvironmentConfig.customSparkImage !== 'None'
      ? payload.runtimeEnvironmentConfig.customSparkImage
      : undefined;

  const pythonRepo =
    payload.runtimeEnvironmentConfig?.pythonPackageRepository &&
    payload.runtimeEnvironmentConfig.pythonPackageRepository !==
      'Google Managed PyPI pull through cache'
      ? payload.runtimeEnvironmentConfig.pythonPackageRepository
      : undefined;

  const runtimeConfig: ISessionTemplateApiPayload['runtimeConfig'] = {
    ...(runtimeVersion && { version: runtimeVersion }),
    ...(customImage && { containerImage: customImage }),
    ...(Object.keys(properties).length > 0 && { properties }),
    ...(pythonRepo && {
      repositoryConfig: {
        pypiRepositoryConfig: {
          pypiRepository: pythonRepo
        }
      }
    })
  };

  // Execution Config
  const stagingBucket = normalizeStagingBucket(
    payload.runtimeEnvironmentConfig?.stagingBucket
  );

  const subnetworkUri =
    payload.networkAndSecurityConfig?.subnetwork || undefined;

  const networkTags =
    payload.networkAndSecurityConfig?.networkTags &&
    payload.networkAndSecurityConfig.networkTags.length > 0
      ? payload.networkAndSecurityConfig.networkTags
      : undefined;

  const kmsKey =
    payload.networkAndSecurityConfig?.encryption === 'customer_managed_key'
      ? payload.networkAndSecurityConfig.kmsKeyName
      : undefined;

  const idleTtl = convertToTtlSeconds(
    payload.sessionLifecycleConfig?.maxIdleTimeQuantity,
    payload.sessionLifecycleConfig?.maxIdleTimeUnit,
    payload.sessionLifecycleConfig?.maxIdleTime
  );

  const ttl = convertToTtlSeconds(
    payload.sessionLifecycleConfig?.maxSessionTimeQuantity,
    payload.sessionLifecycleConfig?.maxSessionTimeUnit,
    payload.sessionLifecycleConfig?.maxSessionTime
  );

  const isUserAccount =
    payload.networkAndSecurityConfig?.executionIdentity === 'user_account';

  const executionConfig: NonNullable<
    NonNullable<
      ISessionTemplateApiPayload['environmentConfig']
    >['executionConfig']
  > = {
    ...(subnetworkUri && { subnetworkUri }),
    ...(networkTags && { networkTags }),
    ...(kmsKey && { kmsKey }),
    ...(stagingBucket && { stagingBucket }),
    ...(idleTtl && { idleTtl }),
    ...(ttl && { ttl }),
    ...(isUserAccount && {
      authentication_config: {
        user_workload_authentication_type: 'END_USER_CREDENTIALS'
      }
    })
  };

  // Peripherals Config (Metastore)
  const metastoreService =
    payload.metastoreConfig?.metastore &&
    payload.metastoreConfig.metastore !== 'None' &&
    payload.metastoreConfig.metastore !== 'Lakehouse runtime catalog' &&
    payload.metastoreConfig.metastore !== 'biglake'
      ? payload.metastoreConfig.metastore
      : undefined;

  const peripheralsConfig: NonNullable<
    NonNullable<
      ISessionTemplateApiPayload['environmentConfig']
    >['peripheralsConfig']
  > = {
    ...(metastoreService && { metastoreService })
  };

  const environmentConfig: ISessionTemplateApiPayload['environmentConfig'] = {
    executionConfig,
    peripheralsConfig
  };

  const templatePayload: ISessionTemplateApiPayload = {
    name: `projects/${projectId}/locations/${targetRegion}/sessionTemplates/${templateId}`,
    description: payload.description,
    creator: creatorEmail,
    jupyterSession: {
      kernel: 'PYTHON',
      displayName: payload.displayName
    },
    labels: payload.labels || {},
    runtimeConfig,
    environmentConfig
  };

  return templatePayload;
}
