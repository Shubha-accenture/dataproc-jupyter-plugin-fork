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
      expect(result.environmentConfig?.peripheralsConfig?.metastoreService).toBe(
        'projects/test-project/locations/us-central1/services/dpms'
      );
    });
  });
});
