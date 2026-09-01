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

/**
 * Interface representing a Region option with id and display name
 */
export interface IRegionOption {
  name: string;
  displayName: string;
}

/**
 * Executor configuration types and interface
 */
export type ExecutorType = 'standard' | 'accelerated';

export interface IExecutorConfig {
  /**
   * Executor type: standard (CPU only) or accelerated (GPUs attached)
   */
  executorType?: ExecutorType;
  /**
   * Executor machine type shape (e.g., 'highmem-4 (4 vCPU, 32 GB)')
   */
  machineType?: string;
}

/**
 * Runtime environment configuration interface
 */
export interface IRuntimeEnvironmentConfig {
  /**
   * Template runtime ID
   */
  templateRuntimeId?: string;
  /**
   * Dataproc runtime version (e.g., '2.3 LTS (Spark 3.5.1, Python 3.12, Scala 2.13)')
   */
  runtimeVersion?: string;
  /**
   * Custom Spark container image
   */
  customSparkImage?: string;
  /**
   * Cloud Storage staging bucket (e.g., 'Auto' or 'gs://...')
   */
  stagingBucket?: string;
  /**
   * Python package repository (e.g., PyPI pull-through cache)
   */
  pythonPackageRepository?: string;
  /**
   * Whether Lightning Engine is enabled
   */
  lightningEngineEnabled?: boolean;
}

/**
 * Driver configuration interface
 */
export interface IDriverConfig {
  /**
   * Driver machine type (e.g., 'standard-4 (4 vCPU, 16 GB)')
   */
  machineType?: string;
  /**
   * Driver persistent disk (e.g., 'Standard persistent disk (HDD), 100 GB')
   */
  disk?: string;
}

/**
 * 4. Executor Disk configuration interface
 */
export interface IExecutorDiskConfig {
  /**
   * Executor disk type / capacity (e.g., 'Standard persistent disk (HDD), 100 GB')
   */
  diskType?: string;
}

/**
 * 5. Autoscaling configuration interface
 */
export interface IAutoscalingConfig {
  /**
   * Whether autoscaling is enabled (on / off)
   */
  autoscalingEnabled?: boolean;
  /**
   * Initial number of executors
   */
  initialExecutors?: number;
  /**
   * Minimum number of executors
   */
  minExecutors?: number;
  /**
   * Maximum number of executors
   */
  maxExecutors?: number;
}

/**
 * 6. Metastore configuration interface
 */
export interface IMetastoreConfig {
  /**
   * Metastore name or catalog (e.g., 'Lakehouse runtime catalog')
   */
  metastore?: string;
  /**
   * Whether Hive endpoint is enabled (enabled / disabled)
   */
  hiveEndpointEnabled?: boolean;
  /**
   * Optional project ID for the Metastore instance
   */
  projectId?: string;
}

/**
 * 7. Network and Security configuration
 */
export type ExecutionIdentityType = 'user_account' | 'service_account';
export type EncryptionType = 'google_managed' | 'customer_managed_key';

export interface INetworkAndSecurityConfig {
  /**
   * Execution identity (user account / service account)
   */
  executionIdentity?: ExecutionIdentityType | string;
  /**
   * Network in this project
   */
  networkInThisProject?: string;
  /**
   * Primary network name or URI
   */
  primaryNetwork?: string;
  /**
   * Subnetwork name or URI
   */
  subnetwork?: string;
  /**
   * Network tags (list of string tags)
   */
  networkTags?: string[];
  /**
   * Internal IP only (no public IP access)
   */
  internalIpOnly?: boolean;
  /**
   * Encryption type (Google managed / Customer-managed KMS key)
   */
  encryption?: EncryptionType | string;
  /**
   * KMS key name when using customer-managed encryption
   */
  kmsKeyName?: string;
}

/**
 * 8. Session Lifecycle configuration
 */
export type TimeUnit = 'seconds' | 'minutes' | 'hours' | 'days' | 's' | 'm' | 'h' | 'd';

export interface ISessionLifecycleConfig {
  /**
   * Maximum idle time string (e.g. '60 minutes')
   */
  maxIdleTime?: string;
  /**
   * Numeric quantity for maximum idle time
   */
  maxIdleTimeQuantity?: number;
  /**
   * Unit for max idle time (e.g., 'minutes', 'hours', 'days')
   */
  maxIdleTimeUnit?: TimeUnit | string;
  /**
   * Maximum session lifetime string (e.g. '3 days')
   */
  maxSessionTime?: string;
  /**
   * Numeric quantity for maximum session lifetime
   */
  maxSessionTimeQuantity?: number;
  /**
   * Unit for max session lifetime (e.g., 'minutes', 'hours', 'days')
   */
  maxSessionTimeUnit?: TimeUnit | string;
}

/**
 * 9 & 10. Key-Value map types for Spark Properties and Labels
 */
export type SparkProperties = Record<string, string>;
export type ProfileLabels = Record<string, string>;

/**
 * Full Runtime Profile representation (matches backend model / future GCP Dataproc API)
 */
export interface IRuntimeProfile {
  name?: string; // Resource name: projects/{project}/locations/{region}/runtimeProfiles/{profile}
  id?: string;
  displayName: string;
  region: string;
  description?: string;
  createTime?: string;
  updateTime?: string;
  state?: string;
  executorConfig?: IExecutorConfig;
  runtimeEnvironmentConfig?: IRuntimeEnvironmentConfig;
  driverConfig?: IDriverConfig;
  executorDiskConfig?: IExecutorDiskConfig;
  autoscalingConfig?: IAutoscalingConfig;
  metastoreConfig?: IMetastoreConfig;
  networkAndSecurityConfig?: INetworkAndSecurityConfig;
  sessionLifecycleConfig?: ISessionLifecycleConfig;
  sparkProperties?: SparkProperties;
  labels?: ProfileLabels;
}

/**
 * Payload sent when creating a new Runtime Profile
 */
export interface ICreateRuntimeProfilePayload {
  displayName: string;
  region: string;
  description?: string;
  executorConfig?: IExecutorConfig;
  runtimeEnvironmentConfig?: IRuntimeEnvironmentConfig;
  driverConfig?: IDriverConfig;
  executorDiskConfig?: IExecutorDiskConfig;
  autoscalingConfig?: IAutoscalingConfig;
  metastoreConfig?: IMetastoreConfig;
  networkAndSecurityConfig?: INetworkAndSecurityConfig;
  sessionLifecycleConfig?: ISessionLifecycleConfig;
  sparkProperties?: SparkProperties;
  labels?: ProfileLabels;
}

/**
 * Service contract for Runtime Profile operations
 */
export interface IRuntimeProfileService {
  getRegions(projectId?: string): Promise<IRegionOption[]>;
  createRuntimeProfile(
    payload: ICreateRuntimeProfilePayload,
    projectId?: string,
    region?: string
  ): Promise<IRuntimeProfile>;
  listRuntimeProfiles(
    projectId?: string,
    region?: string
  ): Promise<IRuntimeProfile[]>;
  getRuntimeProfile(name: string): Promise<IRuntimeProfile>;
  deleteRuntimeProfile(name: string): Promise<void>;
}


