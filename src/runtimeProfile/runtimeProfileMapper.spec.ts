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
  extractRuntimeVersion,
  normalizeStagingBucket,
  convertToTtlSeconds,
  sanitizeSessionTemplateId,
  parseMachineTypeSpec,
  parseDiskSpec,
  mapRuntimeProfileToSessionTemplate
} from './runtimeProfileMapper';
import { ICreateRuntimeProfilePayload } from './runtimeProfileInterface';
import {
  DATAPROC_LIGHTNING_ENGINE_PROPERTY,
  DATAPROC_TIER_PROPERTY
} from '../utils/const';

describe('runtimeProfileMapper', () => {
  describe('extractRuntimeVersion', () => {
    it('should extract major.minor version from complex version label', () => {
      expect(
        extractRuntimeVersion('2.3 LTS (Spark 3.5.1, Python 3.12, Scala 2.13)')
      ).toBe('2.3');
      expect(extractRuntimeVersion('2.1')).toBe('2.1');
    });

    it('should return undefined for empty or None', () => {
      expect(extractRuntimeVersion('')).toBeUndefined();
      expect(extractRuntimeVersion('None')).toBeUndefined();
      expect(extractRuntimeVersion(undefined)).toBeUndefined();
    });
  });

  describe('normalizeStagingBucket', () => {
    it('should remove gs:// prefix and trim whitespace', () => {
      expect(normalizeStagingBucket('gs://my-staging-bucket')).toBe(
        'my-staging-bucket'
      );
      expect(normalizeStagingBucket('  gs://my-bucket/path  ')).toBe(
        'my-bucket/path'
      );
    });

    it('should return undefined for Auto or empty string', () => {
      expect(normalizeStagingBucket('Auto')).toBeUndefined();
      expect(normalizeStagingBucket('')).toBeUndefined();
      expect(normalizeStagingBucket(undefined)).toBeUndefined();
    });
  });

  describe('convertToTtlSeconds', () => {
    it('should convert quantities with various units to seconds string', () => {
      expect(convertToTtlSeconds(30, 'minutes')).toBe('1800s');
      expect(convertToTtlSeconds(2, 'hours')).toBe('7200s');
      expect(convertToTtlSeconds(3, 'days')).toBe('259200s');
      expect(convertToTtlSeconds(60, 'seconds')).toBe('60s');
      expect(convertToTtlSeconds(10, 'm')).toBe('600s');
      expect(convertToTtlSeconds(1, 'h')).toBe('3600s');
      expect(convertToTtlSeconds(1, 'd')).toBe('86400s');
    });

    it('should parse raw duration strings', () => {
      expect(convertToTtlSeconds(undefined, undefined, '3600s')).toBe('3600s');
      expect(convertToTtlSeconds(undefined, undefined, '60 minutes')).toBe(
        '3600s'
      );
      expect(convertToTtlSeconds(undefined, undefined, '2 hours')).toBe(
        '7200s'
      );
      expect(convertToTtlSeconds(undefined, undefined, '')).toBeUndefined();
    });
  });

  describe('sanitizeSessionTemplateId', () => {
    it('should generate lower-case hyphenated ids', () => {
      expect(sanitizeSessionTemplateId('My Custom Profile!')).toBe(
        'my-custom-profile'
      );
      expect(sanitizeSessionTemplateId('', 'preferred-id-123')).toBe(
        'preferred-id-123'
      );
    });
  });

  describe('parseMachineTypeSpec', () => {
    it('should parse known machine types', () => {
      expect(parseMachineTypeSpec('standard-4')).toEqual({
        cores: 4,
        memoryGb: 16
      });
      expect(parseMachineTypeSpec('Highmem-8')).toEqual({
        cores: 8,
        memoryGb: 64
      });
      expect(parseMachineTypeSpec('g2-standard-4')).toEqual({
        cores: 4,
        memoryGb: 16,
        acceleratorType: 'l4'
      });
    });

    it('should parse dynamic machine types', () => {
      expect(parseMachineTypeSpec('n2-standard-32')).toEqual({
        cores: 32,
        memoryGb: 128
      });
    });

    it('should return undefined for empty or invalid machine type', () => {
      expect(parseMachineTypeSpec('')).toBeUndefined();
      expect(parseMachineTypeSpec(undefined)).toBeUndefined();
    });
  });

  describe('parseDiskSpec', () => {
    it('should parse standard and premium disk types and sizes and enforce minimum 250g', () => {
      expect(parseDiskSpec('standard persistent disk')).toEqual({
        tier: 'standard',
        size: '400g'
      });
      expect(parseDiskSpec('Standard persistent disk (HDD), 100 GB')).toEqual({
        tier: 'standard',
        size: '250g'
      });
      expect(parseDiskSpec('SSD persistent disk (SSD), 500 GB')).toEqual({
        tier: 'premium',
        size: '500g'
      });
    });
  });

  describe('mapRuntimeProfileToSessionTemplate', () => {
    it('should map complete ICreateRuntimeProfilePayload to SessionTemplate payload', () => {
      const payload: ICreateRuntimeProfilePayload = {
        displayName: 'Finance Analytics Profile',
        region: 'us-central1',
        description: 'Profile for finance team',
        tier: 'Premium',
        lightningEngineEnabled: true,
        runtimeEnvironmentConfig: {
          runtimeProfileId: 'finance-profile-id',
          runtimeVersion: '2.3 LTS (Spark 3.5.1, Python 3.12)',
          customSparkImage: 'gcr.io/my-project/spark-image:latest',
          stagingBucket: 'gs://finance-staging-bucket',
          pythonPackageRepository: 'https://pypi.org/simple'
        },
        driverAndExecutorConfiguration: {
          tier: 'Premium',
          driverMachineType: 'standard-4',
          driverDisk: 'standard persistent disk',
          executorType: 'standard',
          executorDisk: 'Standard persistent disk (HDD), 100 GB'
        },
        autoscalingConfig: {
          autoscalingEnabled: true,
          initialExecutors: 2,
          minExecutors: 1,
          maxExecutors: 8
        },
        metastoreConfig: {
          metastore: 'projects/test-project/locations/us-central1/services/dpms'
        },
        networkAndSecurityConfig: {
          executionIdentity: 'user_account',
          subnetwork:
            'projects/test-project/regions/us-central1/subnetworks/default',
          networkTags: ['dataproc-job', 'secure-env'],
          encryption: 'customer_managed_key',
          kmsKeyName:
            'projects/test-project/locations/us-central1/keyRings/ring/cryptoKeys/key'
        },
        sessionLifecycleConfig: {
          maxIdleTimeQuantity: 30,
          maxIdleTimeUnit: 'minutes',
          maxSessionTimeQuantity: 2,
          maxSessionTimeUnit: 'days'
        },
        sparkProperties: {
          'spark.sql.shuffle.partitions': '200'
        },
        labels: {
          env: 'production',
          cost_center: 'finance'
        }
      };

      const result = mapRuntimeProfileToSessionTemplate(
        payload,
        'test-project',
        'us-central1',
        'user@example.com'
      );

      expect(result.name).toBe(
        'projects/test-project/locations/us-central1/sessionTemplates/finance-profile-id'
      );
      expect(result.description).toBe('Profile for finance team');
      expect(result.creator).toBe('user@example.com');
      expect(result.jupyterSession).toEqual({
        kernel: 'PYTHON',
        displayName: 'Finance Analytics Profile'
      });
      expect(result.labels).toEqual({
        env: 'production',
        cost_center: 'finance'
      });

      // Runtime config
      expect(result.runtimeConfig?.version).toBe('2.3');
      expect(result.runtimeConfig?.containerImage).toBe(
        'gcr.io/my-project/spark-image:latest'
      );
      expect(
        result.runtimeConfig?.repositoryConfig?.pypiRepositoryConfig
          ?.pypiRepository
      ).toBe('https://pypi.org/simple');
      expect(result.runtimeConfig?.properties?.[DATAPROC_TIER_PROPERTY]).toBe(
        'premium'
      );
      expect(
        result.runtimeConfig?.properties?.[DATAPROC_LIGHTNING_ENGINE_PROPERTY]
      ).toBe('lightningEngine');
      expect(
        result.runtimeConfig?.properties?.['spark.dynamicAllocation.enabled']
      ).toBe('true');
      expect(
        result.runtimeConfig?.properties?.[
          'spark.dynamicAllocation.initialExecutors'
        ]
      ).toBe('2');
      expect(
        result.runtimeConfig?.properties?.[
          'spark.dynamicAllocation.minExecutors'
        ]
      ).toBe('1');
      expect(
        result.runtimeConfig?.properties?.[
          'spark.dynamicAllocation.maxExecutors'
        ]
      ).toBe('8');
      expect(
        result.runtimeConfig?.properties?.['spark.sql.shuffle.partitions']
      ).toBe('200');

      // Driver & Executor machine type and disk properties
      expect(result.runtimeConfig?.properties?.['spark.driver.cores']).toBe(
        '4'
      );
      expect(result.runtimeConfig?.properties?.['spark.driver.memory']).toBe(
        '16g'
      );
      expect(
        result.runtimeConfig?.properties?.['spark.dataproc.driver.disk.tier']
      ).toBe('standard');
      expect(
        result.runtimeConfig?.properties?.['spark.dataproc.driver.disk.size']
      ).toBe('400g');
      expect(
        result.runtimeConfig?.properties?.['spark.dataproc.executor.disk.tier']
      ).toBe('standard');
      expect(
        result.runtimeConfig?.properties?.['spark.dataproc.executor.disk.size']
      ).toBe('250g');

      // Execution config
      const execConfig = result.environmentConfig?.executionConfig;
      expect(execConfig?.subnetworkUri).toBe(
        'projects/test-project/regions/us-central1/subnetworks/default'
      );
      expect(execConfig?.networkTags).toEqual(['dataproc-job', 'secure-env']);
      expect(execConfig?.kmsKey).toBe(
        'projects/test-project/locations/us-central1/keyRings/ring/cryptoKeys/key'
      );
      expect(execConfig?.stagingBucket).toBe('finance-staging-bucket');
      expect(execConfig?.idleTtl).toBe('1800s');
      expect(execConfig?.ttl).toBe('172800s');
      expect(
        execConfig?.authentication_config?.user_workload_authentication_type
      ).toBe('END_USER_CREDENTIALS');

      // Peripherals
      expect(
        result.environmentConfig?.peripheralsConfig?.metastoreService
      ).toBe('projects/test-project/locations/us-central1/services/dpms');
    });

    it('should map accelerated executor machine type and SSD executor disk to properties', () => {
      const payload: ICreateRuntimeProfilePayload = {
        displayName: 'Accelerated ML Profile',
        region: 'us-central1',
        tier: 'Premium',
        executorConfig: {
          executorType: 'accelerated',
          machineType: 'g2-standard-4'
        },
        driverAndExecutorConfiguration: {
          driverMachineType: 'standard-8',
          driverDisk: 'SSD persistent disk, 500 GB',
          executorType: 'g2-standard-4',
          executorDisk: 'SSD persistent disk (SSD), 200 GB'
        }
      };

      const result = mapRuntimeProfileToSessionTemplate(
        payload,
        'test-project',
        'us-central1'
      );

      const props = result.runtimeConfig?.properties;
      expect(props?.['spark.driver.cores']).toBe('8');
      expect(props?.['spark.driver.memory']).toBe('32g');
      expect(props?.['spark.dataproc.driver.disk.tier']).toBe('premium');
      expect(props?.['spark.dataproc.driver.disk.size']).toBe('500g');

      expect(props?.['spark.executor.cores']).toBe('4');
      expect(props?.['spark.executor.memory']).toBe('16g');
      expect(props?.['spark.dataproc.executor.compute.tier']).toBe('premium');
      expect(props?.['spark.dataproc.executor.resource.accelerator.type']).toBe(
        'l4'
      );
      expect(props?.['spark.dataproc.executor.disk.tier']).toBe('premium');
      // 200 GB is clamped to minimum 250g enforced by Dataproc Serverless
      expect(props?.['spark.dataproc.executor.disk.size']).toBe('250g');
    });

    it('should automatically set spark.dataproc.executor.compute.tier to premium for highmem shapes', () => {
      const payload: ICreateRuntimeProfilePayload = {
        displayName: 'Highmem Profile',
        region: 'us-central1',
        tier: 'Standard',
        executorConfig: {
          executorType: 'general',
          machineType: 'highmem-4'
        }
      };

      const result = mapRuntimeProfileToSessionTemplate(
        payload,
        'test-project',
        'us-central1'
      );

      const props = result.runtimeConfig?.properties;
      expect(props?.['spark.executor.cores']).toBe('4');
      expect(props?.['spark.executor.memory']).toBe('32g');
      // Highmem shape has 8 GB RAM per core, so it must set premium compute tier
      expect(props?.['spark.dataproc.executor.compute.tier']).toBe('premium');
    });

    it('should map Lakehouse metastore config with custom catalog name to Spark Iceberg properties', () => {
      const payload: ICreateRuntimeProfilePayload = {
        displayName: 'Lakehouse Profile',
        region: 'us-central1',
        metastoreConfig: {
          metastore: 'Lakehouse runtime catalog',
          metastoreType: 'lakehouse',
          catalogSelectionMode: 'new',
          catalogName: 'standard-lh-catalog-us-central1',
          icebergRestEndpointEnabled: true,
          hiveEndpointEnabled: true
        }
      };

      const result = mapRuntimeProfileToSessionTemplate(
        payload,
        'test-project',
        'us-central1'
      );

      const props = result.runtimeConfig?.properties;
      expect(props?.['spark.sql.catalog.standard-lh-catalog-us-central1']).toBe(
        'org.apache.iceberg.spark.SparkCatalog'
      );
      expect(
        props?.['spark.sql.catalog.standard-lh-catalog-us-central1.type']
      ).toBe('hadoop');

      // Dataproc Lakehouse properties
      expect(props?.['dataproc.lakehouse.defaultCatalog']).toBe(
        'projects/test-project/catalogs/standard-lh-catalog-us-central1'
      );
      expect(
        props?.['dataproc.lakehouse.catalog.standard-lh-catalog-us-central1']
      ).toBe('projects/test-project/catalogs/standard-lh-catalog-us-central1');
    });

    it('should map Lakehouse metastore with existing catalogId and custom project', () => {
      const payload: ICreateRuntimeProfilePayload = {
        displayName: 'Existing Catalog Profile',
        region: 'us-central1',
        metastoreConfig: {
          metastore: 'Lakehouse runtime catalog',
          metastoreType: 'lakehouse',
          catalogSelectionMode: 'existing',
          catalogId: 'my-hive-catalog',
          projectId: 'custom-project',
          icebergRestEndpointEnabled: true
        }
      };

      const result = mapRuntimeProfileToSessionTemplate(
        payload,
        'test-project',
        'us-central1'
      );

      const props = result.runtimeConfig?.properties;
      expect(props?.['dataproc.lakehouse.catalog.my-hive-catalog']).toBe(
        'projects/custom-project/catalogs/my-hive-catalog'
      );
      expect(props?.['dataproc.lakehouse.defaultCatalog']).toBe(
        'projects/custom-project/catalogs/my-hive-catalog'
      );
      expect(props?.['spark.sql.catalog.my-hive-catalog']).toBe(
        'org.apache.iceberg.spark.SparkCatalog'
      );
    });

    it('should map Dataproc Metastore config with dataprocMetastoreService to peripheralsConfig', () => {
      const payload: ICreateRuntimeProfilePayload = {
        displayName: 'DPMS Profile',
        region: 'us-central1',
        metastoreConfig: {
          metastoreType: 'dataproc',
          dataprocMetastoreService:
            'projects/test-project/locations/us-central1/services/my-dpms'
        }
      };

      const result = mapRuntimeProfileToSessionTemplate(
        payload,
        'test-project',
        'us-central1'
      );

      expect(
        result.environmentConfig?.peripheralsConfig?.metastoreService
      ).toBe('projects/test-project/locations/us-central1/services/my-dpms');
    });
  });
});
