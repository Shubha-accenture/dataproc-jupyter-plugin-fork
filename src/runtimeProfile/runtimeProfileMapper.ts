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
  if (!stagingBucket || stagingBucket.trim() === '' || stagingBucket === 'Auto') {
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

/**
 * Generates a clean session template ID from profile display name or ID
 */
export const sanitizeSessionTemplateId = (
  displayName: string,
  preferredId?: string
): string => {
  const source = preferredId || displayName;
  const sanitized = source
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return sanitized || 'runtime-profile';
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
    NonNullable<ISessionTemplateApiPayload['environmentConfig']>['executionConfig']
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
    payload.metastoreConfig.metastore !== 'None'
      ? payload.metastoreConfig.metastore
      : undefined;

  const peripheralsConfig: NonNullable<
    NonNullable<ISessionTemplateApiPayload['environmentConfig']>['peripheralsConfig']
  > = {
    ...(metastoreService && { metastoreService })
  };

  const environmentConfig: ISessionTemplateApiPayload['environmentConfig'] = {
    ...(Object.keys(executionConfig).length > 0 && { executionConfig }),
    ...(Object.keys(peripheralsConfig).length > 0 && { peripheralsConfig })
  };

  const templatePayload: ISessionTemplateApiPayload = {
    name: `projects/${projectId}/locations/${targetRegion}/sessionTemplates/${templateId}`,
    description: payload.description,
    creator: creatorEmail,
    jupyterSession: {
      kernel: 'PYTHON',
      displayName: payload.displayName
    },
    ...(payload.labels &&
      Object.keys(payload.labels).length > 0 && { labels: payload.labels }),
    ...(Object.keys(runtimeConfig).length > 0 && { runtimeConfig }),
    ...(Object.keys(environmentConfig).length > 0 && { environmentConfig })
  };

  return templatePayload;
}
