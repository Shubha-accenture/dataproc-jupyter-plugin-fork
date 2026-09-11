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

jest.mock('../handler/handler', () => ({
  requestAPI: jest.fn().mockResolvedValue({
    dataproc_url: 'https://dataproc.googleapis.com/',
    compute_url: 'https://compute.googleapis.com/compute',
    metastore_url: 'https://metastore.googleapis.com/',
    cloudkms_url: 'https://cloudkms.googleapis.com/',
    cloudresourcemanager_url: 'https://cloudresourcemanager.googleapis.com/',
    datacatalog_url: 'https://datacatalog.googleapis.com/',
    storage_url: 'https://storage.googleapis.com/'
  })
}));

import React from 'react';
import {
  CreateRuntimeProfile,
  CreateRuntimeProfileComponent,
  RuntimeEnvironmentSection,
  DriverConfigSection,
  ExecutorDiskSection,
  ExecutorAndDriverSection,
  DriverAndExecutorSection,
  AutoscalingSection,
  MetastoreSection,
  NetworkSecuritySection,
  SessionLifecycleSection,
  SparkPropertiesSection,
  ProfileLabelsSection,
  OtherCustomizationSection,
  formatRuntimeEnvironmentProperties,
  formatDriverConfigProperties,
  formatExecutorDiskProperties,
  formatExecutorAndDriverProperties,
  formatDriverAndExecutorProperties,
  formatAutoscalingProperties,
  formatMetastoreProperties,
  formatNetworkSecurityProperties,
  formatSessionLifecycleProperties,
  formatSparkProperties,
  formatProfileLabels,
  formatOtherCustomizationProperties,
  DEFAULT_RUNTIME_ENVIRONMENT_CONFIG,
  DEFAULT_DRIVER_CONFIG,
  DEFAULT_EXECUTOR_DISK_CONFIG,
  DEFAULT_DRIVER_AND_EXECUTOR_CONFIG,
  DEFAULT_AUTOSCALING_CONFIG,
  DEFAULT_METASTORE_CONFIG,
  DEFAULT_NETWORK_SECURITY_CONFIG,
  DEFAULT_SESSION_LIFECYCLE_CONFIG,
  DEFAULT_SPARK_PROPERTIES,
  DEFAULT_PROFILE_LABELS
} from './createRuntimeProfile';
import {
  MOCK_ACCELERATED_MACHINE_TYPES,
  MOCK_GENERAL_MACHINE_TYPES,
  RuntimeProfileService
} from './runtimeProfileService';
import { DATAPROC_TIER_DOC, LIGHTNING_ENGINE_DOC } from '../utils/const';

describe('CreateRuntimeProfile Component & Service', () => {
  let mockService: RuntimeProfileService;

  beforeEach(() => {
    mockService = new RuntimeProfileService(true);
  });

  it('should export CreateRuntimeProfileComponent, CreateRuntimeProfile, and RuntimeProfileService', () => {
    expect(CreateRuntimeProfileComponent).toBeDefined();
    expect(typeof CreateRuntimeProfileComponent).toBe('function');
    expect(CreateRuntimeProfile).toBeDefined();
    expect(typeof CreateRuntimeProfile).toBe('function');
    expect(mockService).toBeDefined();
  });

  it('should load regions from service', async () => {
    const regions = await mockService.getRegions();
    expect(regions.length).toBeGreaterThan(0);
    expect(regions.some(r => r.name === 'us-central1')).toBe(true);
    expect(regions.find(r => r.name === 'us-central1')?.displayName).toBe(
      'us-central1 (Iowa)'
    );
  });

  it('should allow creating a profile in mock mode', async () => {
    const profile = await mockService.createRuntimeProfile({
      displayName: 'test-profile',
      region: 'us-central1',
      description: 'Test runtime profile description'
    });

    expect(profile.displayName).toBe('test-profile');
    expect(profile.region).toBe('us-central1');
    expect(profile.description).toBe('Test runtime profile description');
    expect(profile.state).toBe('ACTIVE');
  });

  it('should create profile with custom region and project', async () => {
    const service = new RuntimeProfileService(true);
    const profile = await service.createRuntimeProfile(
      {
        displayName: 'custom-profile',
        region: 'us-east1',
        description: 'Profile with custom region'
      },
      'test-project',
      'us-east1'
    );
    expect(profile.displayName).toBe('custom-profile');
    expect(profile.region).toBe('us-east1');
    expect(profile.name).toBe(
      'projects/test-project/locations/us-east1/runtimeProfiles/custom-profile'
    );
  });

  it('should format runtime environment config according to IRuntimeEnvironmentConfig interface', () => {
    expect(RuntimeEnvironmentSection).toBeDefined();
    expect(DriverConfigSection).toBeDefined();

    const formatted = formatRuntimeEnvironmentProperties(
      DEFAULT_RUNTIME_ENVIRONMENT_CONFIG
    );
    expect(formatted).toHaveLength(5);
    expect(formatted.find(p => p.label === 'Runtime Profile ID')?.value).toBe(
      'Name of the runtime profile'
    );
    expect(
      formatted.find(p => p.label === 'Dataproc Runtime Version')?.value
    ).toBe('2.3 LTS (Spark 3.5.1, Python 3.12)');

    const emptyFormatted = formatRuntimeEnvironmentProperties(undefined);
    expect(emptyFormatted).toEqual([]);
  });

  it('should format driver config according to IDriverConfig interface', () => {
    const formatted = formatDriverConfigProperties(DEFAULT_DRIVER_CONFIG);
    expect(formatted).toHaveLength(2);
    expect(formatted.find(p => p.label === 'Machine type')?.value).toBe(
      'Standard-4'
    );
    expect(formatted.find(p => p.label === 'Disk')?.value).toBe(
      'standard persistent disk'
    );

    const emptyFormatted = formatDriverConfigProperties(undefined);
    expect(emptyFormatted).toEqual([]);
  });

  it('should format executor disk config according to IExecutorDiskConfig interface', () => {
    expect(ExecutorDiskSection).toBeDefined();
    const formatted = formatExecutorDiskProperties(
      DEFAULT_EXECUTOR_DISK_CONFIG
    );
    expect(formatted).toHaveLength(1);
    expect(formatted.find(p => p.label === 'Disk type')?.value).toBe(
      'Standard persistent disk (HDD), 100 GB'
    );

    expect(formatExecutorDiskProperties(undefined)).toEqual([]);
  });

  it('should format autoscaling config according to IAutoscalingConfig interface', () => {
    expect(AutoscalingSection).toBeDefined();
    const formatted = formatAutoscalingProperties(DEFAULT_AUTOSCALING_CONFIG);
    expect(formatted).toHaveLength(4);
    expect(formatted.find(p => p.label === 'Autoscaling')?.value).toBe(
      'Enabled'
    );
    expect(formatted.find(p => p.label === 'Initial executors')?.value).toBe(2);
    expect(formatted.find(p => p.label === 'Minimum executors')?.value).toBe(2);
    expect(formatted.find(p => p.label === 'Maximum executors')?.value).toBe(10);

    expect(formatAutoscalingProperties(undefined)).toEqual([]);
  });

  it('should format metastore config according to IMetastoreConfig interface', () => {
    expect(MetastoreSection).toBeDefined();
    const formatted = formatMetastoreProperties(DEFAULT_METASTORE_CONFIG);
    expect(formatted).toHaveLength(2);
    expect(formatted.find(p => p.label === 'Metastore')?.value).toBe(
      'Lakehouse runtime catalog'
    );
    expect(formatted.find(p => p.label === 'Hive endpoint')?.value).toBe(
      'Disabled'
    );

    expect(formatMetastoreProperties(undefined)).toEqual([]);
  });

  it('should format network and security config according to INetworkAndSecurityConfig interface', () => {
    expect(NetworkSecuritySection).toBeDefined();
    const formatted = formatNetworkSecurityProperties(
      DEFAULT_NETWORK_SECURITY_CONFIG
    );
    expect(formatted).toHaveLength(3);
    expect(formatted.find(p => p.label === 'Execution identity')?.value).toBe(
      'Service account'
    );
    expect(
      formatted.find(p => p.label === 'Network in this project')?.value
    ).toBe('default');
    expect(formatted.find(p => p.label === 'Encryption')?.value).toBe(
      'Google-managed key'
    );

    expect(formatNetworkSecurityProperties(undefined)).toEqual([]);
  });

  it('should format session lifecycle config according to ISessionLifecycleConfig interface', () => {
    expect(SessionLifecycleSection).toBeDefined();
    const formatted = formatSessionLifecycleProperties(
      DEFAULT_SESSION_LIFECYCLE_CONFIG
    );
    expect(formatted).toHaveLength(2);
    expect(formatted.find(p => p.label === 'Maximum idle time')?.value).toBe(
      '60 minutes'
    );
    expect(formatted.find(p => p.label === 'Maximum session time')?.value).toBe(
      '3 days'
    );

    expect(formatSessionLifecycleProperties(undefined)).toEqual([]);
  });

  it('should format spark properties and labels according to key-value maps', () => {
    expect(SparkPropertiesSection).toBeDefined();
    expect(ProfileLabelsSection).toBeDefined();

    const emptySpark = formatSparkProperties(DEFAULT_SPARK_PROPERTIES);
    expect(emptySpark).toEqual([
      { label: 'Spark properties', value: 'None' }
    ]);

    const customSpark = formatSparkProperties({ 'spark.driver.memory': '4g' });
    expect(customSpark).toEqual([
      { label: 'spark.driver.memory', value: '4g' }
    ]);

    const emptyLabels = formatProfileLabels(DEFAULT_PROFILE_LABELS);
    expect(emptyLabels).toEqual([{ label: 'Labels', value: 'None' }]);

    const customLabels = formatProfileLabels({ env: 'prod' });
    expect(customLabels).toEqual([{ label: 'env', value: 'prod' }]);
  });

  it('should format merged executor & driver configuration according to IDriverAndExecutorConfiguration interface', () => {
    expect(ExecutorAndDriverSection).toBeDefined();
    expect(DriverAndExecutorSection).toBeDefined();

    const formatted = formatExecutorAndDriverProperties(
      DEFAULT_DRIVER_AND_EXECUTOR_CONFIG
    );
    expect(formatted).toHaveLength(5);
    expect(formatted.find(p => p.label === 'Tier')?.value).toBe('Standard');
    expect(formatted.find(p => p.label === 'Driver machine type')?.value).toBe(
      'Standard-4'
    );
    expect(formatted.find(p => p.label === 'Driver disk')?.value).toBe(
      'standard persistent disk'
    );
    expect(formatted.find(p => p.label === 'Executor type')?.value).toBe(
      'standard'
    );
    expect(formatted.find(p => p.label === 'Executor disk')?.value).toBe(
      'Standard persistent disk (HDD), 100 GB'
    );

    expect(formatDriverAndExecutorProperties(undefined)).toEqual([]);
    expect(formatExecutorAndDriverProperties(undefined)).toEqual([]);
  });

  it('should format other customization section with spark properties and labels merged', () => {
    expect(OtherCustomizationSection).toBeDefined();

    const emptyCustomization = formatOtherCustomizationProperties(
      DEFAULT_SPARK_PROPERTIES,
      DEFAULT_PROFILE_LABELS
    );
    expect(emptyCustomization).toHaveLength(2);
    expect(
      emptyCustomization.find(p => p.label === 'Spark properties')?.value
    ).toBe('None');
    expect(emptyCustomization.find(p => p.label === 'Labels')?.value).toBe(
      'None'
    );

    const customProps = formatOtherCustomizationProperties(
      { 'spark.driver.memory': '4g', 'spark.executor.cores': '2' },
      { env: 'prod', team: 'data' }
    );
    expect(customProps).toHaveLength(2);
    expect(customProps.find(p => p.label === 'Spark properties')?.value).toBe(
      'spark.driver.memory: 4g, spark.executor.cores: 2'
    );
    expect(customProps.find(p => p.label === 'Labels')?.value).toBe(
      'env: prod, team: data'
    );
  });

  it('should export valid machine type mock collections and documentation URLs', () => {
    expect(MOCK_GENERAL_MACHINE_TYPES.length).toBeGreaterThan(0);
    expect(MOCK_GENERAL_MACHINE_TYPES[0].name).toBe('highmem-4');
    expect(MOCK_GENERAL_MACHINE_TYPES[0].label).toBe(
      'highmem-4 (4 vCPU, 32 GB)'
    );
    expect(MOCK_GENERAL_MACHINE_TYPES[0].category).toBe('general');

    expect(MOCK_ACCELERATED_MACHINE_TYPES.length).toBeGreaterThan(0);
    expect(MOCK_ACCELERATED_MACHINE_TYPES[0].name).toBe('g2-standard-4');
    expect(MOCK_ACCELERATED_MACHINE_TYPES[0].category).toBe('accelerated');

    expect(DATAPROC_TIER_DOC).toBe(
      'https://cloud.google.com/dataproc-serverless/docs/concepts/pricing'
    );
    expect(LIGHTNING_ENGINE_DOC).toBe(
      'https://cloud.google.com/dataproc-serverless/docs/guides/lightning-engine'
    );
  });

  it('should retrieve machine types based on category from RuntimeProfileService', async () => {
    const generalTypes = await mockService.getMachineTypes('general');
    expect(generalTypes.length).toBeGreaterThan(0);
    expect(generalTypes.some(m => m.name === 'highmem-4')).toBe(true);

    const acceleratedTypes = await mockService.getMachineTypes('accelerated');
    expect(acceleratedTypes.length).toBeGreaterThan(0);
    expect(acceleratedTypes.some(m => m.name === 'g2-standard-4')).toBe(true);
  });

  it('should create a runtime profile with tier, lightningEngineEnabled, and executorConfig', async () => {
    const profile = await mockService.createRuntimeProfile({
      displayName: 'custom-tier-profile',
      region: 'us-central1',
      description: 'Profile with Tier and Executor configuration',
      tier: 'Premium',
      lightningEngineEnabled: true,
      executorConfig: {
        executorType: 'general',
        machineType: 'highmem-4'
      }
    });

    expect(profile.displayName).toBe('custom-tier-profile');
    expect(profile.tier).toBe('Premium');
    expect(profile.lightningEngineEnabled).toBe(true);
    expect(profile.executorConfig?.executorType).toBe('general');
    expect(profile.executorConfig?.machineType).toBe('highmem-4');
  });

  it('should instantiate CreateRuntimeProfileComponent with initial tier and executor props', () => {
    const element = React.createElement(CreateRuntimeProfileComponent, {
      initialTier: 'Premium',
      initialLightningEngineEnabled: true,
      initialExecutorCategory: 'general',
      initialExecutorType: 'highmem-4'
    });

    expect(element).toBeDefined();
    expect(element.type).toBe(CreateRuntimeProfileComponent);
    expect(element.props.initialTier).toBe('Premium');
    expect(element.props.initialLightningEngineEnabled).toBe(true);
    expect(element.props.initialExecutorCategory).toBe('general');
    expect(element.props.initialExecutorType).toBe('highmem-4');
  });

  it('should support clean normalized payload without redundant driverConfig or executorDiskConfig', async () => {
    const cleanPayload = {
      displayName: 'clean-normalized-profile',
      region: 'us-central1',
      tier: 'Premium',
      lightningEngineEnabled: true,
      executorConfig: {
        executorType: 'accelerated',
        machineType: 'g2-standard-4'
      },
      driverAndExecutorConfiguration: {
        driverMachineType: 'Standard-4',
        driverDisk: 'standard persistent disk',
        executorDisk: 'Standard persistent disk (HDD), 100 GB'
      }
    };

    expect(cleanPayload).not.toHaveProperty('driverConfig');
    expect(cleanPayload).not.toHaveProperty('executorDiskConfig');

    const created = await mockService.createRuntimeProfile(cleanPayload);
    expect(created.displayName).toBe('clean-normalized-profile');
    expect(created.tier).toBe('Premium');
    expect(created.executorConfig?.executorType).toBe('accelerated');
    expect(created.executorConfig?.machineType).toBe('g2-standard-4');
    expect(created.driverAndExecutorConfiguration?.driverMachineType).toBe('Standard-4');
    expect(created.driverAndExecutorConfiguration?.driverDisk).toBe('standard persistent disk');
    expect(created.driverAndExecutorConfiguration?.executorDisk).toBe('Standard persistent disk (HDD), 100 GB');
  });
});

