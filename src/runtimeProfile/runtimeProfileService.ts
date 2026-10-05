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

import { Notification } from '@jupyterlab/apputils';
import {
  API_HEADER_BEARER,
  API_HEADER_CONTENT_TYPE,
  gcpServiceUrls,
  HTTP_METHOD
} from '../utils/const';
import { authApi, authenticatedFetch, loggedFetch } from '../utils/utils';
import { DataprocLoggingService, LOG_LEVEL } from '../utils/loggingService';
import {
  ICreateRuntimeProfilePayload,
  IMachineTypeOption,
  IRegionOption,
  IRuntimeProfile,
  IRuntimeProfileService,
  ISharedVpcSubnetworksResult,
  ExecutorCategoryType
} from './runtimeProfileInterface';
import {
  ISessionTemplateApiPayload,
  mapRuntimeProfileToSessionTemplate
} from './runtimeProfileMapper';

/**
 * Flag to enable mock mode for UI development/testing until the skeleton form
 * is fully connected to the Dataproc sessionTemplates API / Jupyter server endpoint.
 * Set to false when connecting to the real Google Cloud Dataproc sessionTemplates endpoint.
 */
export const RUNTIME_PROFILE_USE_MOCK = false;

/**
 * Mock regions with human-readable location descriptions
 */
export const MOCK_REGIONS: IRegionOption[] = [
  { name: 'us-central1', displayName: 'us-central1 (Iowa)' },
  { name: 'us-east1', displayName: 'us-east1 (South Carolina)' }
];

/**
 * Mock general machine types (CPU only)
 */
export const MOCK_GENERAL_MACHINE_TYPES: IMachineTypeOption[] = [
  {
    name: 'highmem-4',
    label: 'highmem-4 (4 vCPU, 32 GB)',
    vCPUs: 4,
    memoryGb: 32,
    category: 'general'
  },
  {
    name: 'standard-4',
    label: 'standard-4 (4 vCPU, 16 GB)',
    vCPUs: 4,
    memoryGb: 16,
    category: 'general'
  },
  {
    name: 'highcpu-4',
    label: 'highcpu-4 (4 vCPU, 8 GB)',
    vCPUs: 4,
    memoryGb: 8,
    category: 'general'
  },
  {
    name: 'highmem-8',
    label: 'highmem-8 (8 vCPU, 64 GB)',
    vCPUs: 8,
    memoryGb: 64,
    category: 'general'
  },
  {
    name: 'standard-8',
    label: 'standard-8 (8 vCPU, 32 GB)',
    vCPUs: 8,
    memoryGb: 32,
    category: 'general'
  },
  {
    name: 'highcpu-8',
    label: 'highcpu-8 (8 vCPU, 16 GB)',
    vCPUs: 8,
    memoryGb: 16,
    category: 'general'
  },
  {
    name: 'highmem-16',
    label: 'highmem-16 (16 vCPU, 128 GB)',
    vCPUs: 16,
    memoryGb: 128,
    category: 'general'
  },
  {
    name: 'standard-16',
    label: 'standard-16 (16 vCPU, 64 GB)',
    vCPUs: 16,
    memoryGb: 64,
    category: 'general'
  }
];

/**
 * Mock accelerated machine types (with GPUs attached)
 */
export const MOCK_ACCELERATED_MACHINE_TYPES: IMachineTypeOption[] = [
  {
    name: 'g2-standard-4',
    label: 'g2-standard-4 (4 vCPU, 16 GB, 1 NVIDIA L4)',
    vCPUs: 4,
    memoryGb: 16,
    category: 'accelerated',
    acceleratorType: 'nvidia-l4',
    acceleratorCount: 1
  },
  {
    name: 'g2-standard-8',
    label: 'g2-standard-8 (8 vCPU, 32 GB, 1 NVIDIA L4)',
    vCPUs: 8,
    memoryGb: 32,
    category: 'accelerated',
    acceleratorType: 'nvidia-l4',
    acceleratorCount: 1
  },
  {
    name: 'g2-standard-16',
    label: 'g2-standard-16 (16 vCPU, 64 GB, 1 NVIDIA L4)',
    vCPUs: 16,
    memoryGb: 64,
    category: 'accelerated',
    acceleratorType: 'nvidia-l4',
    acceleratorCount: 1
  },
  {
    name: 'a2-highgpu-1g',
    label: 'a2-highgpu-1g (12 vCPU, 85 GB, 1 NVIDIA A100)',
    vCPUs: 12,
    memoryGb: 85,
    category: 'accelerated',
    acceleratorType: 'nvidia-tesla-a100',
    acceleratorCount: 1
  }
];

const safeLog = (message: string, level: LOG_LEVEL = LOG_LEVEL.INFO) => {
  if (process.env.NODE_ENV === 'test' || Boolean(process.env.JEST_WORKER_ID)) {
    return;
  }
  try {
    DataprocLoggingService.log(message, level).catch(() => {
      // Ignore background log transport errors
    });
  } catch {
    // Ignore synchronous logging errors
  }
};

/**
 * Service to manage Dataproc Runtime Profiles.
 * Provides mock data for current UI prototyping and integrates cleanly with GCP Dataproc APIs.
 */
export class RuntimeProfileService implements IRuntimeProfileService {
  private useMock: boolean;
  private inMemoryProfiles: IRuntimeProfile[] = [];

  constructor(useMock: boolean = RUNTIME_PROFILE_USE_MOCK) {
    this.useMock = useMock;
  }

  /**
   * Retrieves available GCP regions with formatted display names
   */
  async getRegions(projectId?: string): Promise<IRegionOption[]> {
    try {
      const credentials = await authApi();
      const { REGION_URL } = await gcpServiceUrls;
      const targetProject = projectId || credentials?.project_id;
      if (targetProject && credentials?.access_token) {
        const response = await loggedFetch(
          `${REGION_URL}/${targetProject}/regions`,
          {
            method: 'GET',
            headers: {
              'Content-Type': API_HEADER_CONTENT_TYPE,
              Authorization: API_HEADER_BEARER + credentials.access_token
            }
          }
        );
        const result = await response.json();
        if (result?.items && Array.isArray(result.items)) {
          return result.items.map((item: { name: string }) => {
            const match = MOCK_REGIONS.find(r => r.name === item.name);
            return match ?? { name: item.name, displayName: item.name };
          });
        }
      }
      return MOCK_REGIONS;
    } catch (error) {
      safeLog(
        'Failed to fetch regions from API, falling back to default regions list: ' +
          error,
        LOG_LEVEL.WARN
      );
      return MOCK_REGIONS;
    }
  }

  /**
   * Retrieves available executor machine types based on executor category
   */
  async getMachineTypes(
    category: ExecutorCategoryType = 'general'
  ): Promise<IMachineTypeOption[]> {
    if (category === 'accelerated') {
      return MOCK_ACCELERATED_MACHINE_TYPES;
    }
    return MOCK_GENERAL_MACHINE_TYPES;
  }

  /**
   * Lists VPC networks in the project (references RunTimeSerive.listNetworksAPIService)
   */
  async getNetworks(projectId?: string): Promise<string[]> {
    if (this.useMock) {
      return ['default'];
    }
    try {
      const { COMPUTE } = await gcpServiceUrls;
      let response: Response;
      if (projectId) {
        const credentials = await authApi();
        response = await loggedFetch(
          `${COMPUTE}/projects/${projectId}/global/networks`,
          {
            method: 'GET',
            headers: {
              'Content-Type': API_HEADER_CONTENT_TYPE,
              Authorization: API_HEADER_BEARER + (credentials?.access_token || '')
            }
          }
        );
      } else {
        response = await authenticatedFetch({
          baseUrl: COMPUTE,
          uri: 'networks',
          method: HTTP_METHOD.GET,
          regionIdentifier: 'global'
        });
      }

      const formattedResponse: {
        items?: Array<{ selfLink?: string; name?: string }>;
        error?: { message: string; code: number };
      } = await response.json();

      console.log('[RuntimeProfileService] getNetworks API response:', {
        projectId: projectId || 'default',
        rawResponse: formattedResponse
      });

      if (formattedResponse?.error?.code) {
        Notification.emit(formattedResponse.error.message, 'error', {
          autoClose: 5000
        });
        return [];
      }

      if (formattedResponse?.items && formattedResponse.items.length > 0) {
        const parsedNetworks = formattedResponse.items
          .map(data => {
            const uriMatch = data.selfLink
              ? /\/networks\/(?<network>[\w-]+)$/.exec(data.selfLink)?.groups?.[
                  'network'
                ] || data.selfLink.split('/')[9]
              : '';
            return uriMatch || data.name || '';
          })
          .filter(Boolean);
        console.log('[RuntimeProfileService] getNetworks parsed list:', parsedNetworks);
        return parsedNetworks;
      }

      safeLog(
        'No networks found. Account may lack access to list networks',
        LOG_LEVEL.ERROR
      );
      Notification.emit(
        'No networks found. Account may lack access to list networks.',
        'error',
        { autoClose: 5000 }
      );
      return [];
    } catch (error) {
      console.error('[RuntimeProfileService] getNetworks error:', error);
      safeLog('Error listing Networks: ' + error, LOG_LEVEL.ERROR);
      Notification.emit(`Error listing Networks : ${error}`, 'error', {
        autoClose: 5000
      });
      return [];
    }
  }

  /**
   * Resolves the parent VPC network name from a subnetwork name or URI
   * (references RunTimeSerive.listNetworksFromSubNetworkAPIService)
   */
  async getNetworkFromSubnetwork(
    subnetwork: string,
    projectId?: string,
    region?: string
  ): Promise<string> {
    if (!subnetwork || this.useMock) {
      return 'default';
    }
    try {
      const credentials = await authApi();
      const { COMPUTE } = await gcpServiceUrls;
      const targetProject = projectId || credentials?.project_id;
      const targetRegion = region || credentials?.region_id;
      if (!targetProject || !targetRegion || !credentials?.access_token) {
        return '';
      }

      const subnetworkName =
        /projects\/(?<project>[\w-]+)\/regions\/(?<region>[\w-]+)\/subnetworks\/(?<subnetwork>[\w-]+)/.exec(
          subnetwork
        )?.groups?.['subnetwork'] || subnetwork;

      const response = await loggedFetch(
        `${COMPUTE}/projects/${targetProject}/regions/${targetRegion}/subnetworks/${subnetworkName}`,
        {
          headers: {
            'Content-Type': API_HEADER_CONTENT_TYPE,
            Authorization: API_HEADER_BEARER + credentials.access_token
          }
        }
      );
      const responseResult: {
        network?: string;
        error?: { message: string; code: number };
      } = await response.json();

      if (responseResult?.error?.code) {
        Notification.emit(responseResult.error.message, 'error', {
          autoClose: 5000
        });
        return '';
      }

      return (
        (responseResult?.network &&
          (/\/networks\/(?<network>[\w-]+)$/.exec(responseResult.network)
            ?.groups?.['network'] ||
            responseResult.network.split('/')[9])) ||
        ''
      );
    } catch (error) {
      safeLog('Error selecting Network: ' + error, LOG_LEVEL.ERROR);
      Notification.emit(`Error selecting Network : ${error}`, 'error', {
        autoClose: 5000
      });
      return '';
    }
  }

  /**
   * Lists subnetworks with Private Google Access enabled for a given network and region
   * (references RunTimeSerive.listSubNetworksAPIService)
   */
  async getSubnetworks(
    network: string,
    projectId?: string,
    region?: string
  ): Promise<string[]> {
    if (!network) {
      return [];
    }
    if (this.useMock) {
      return ['default'];
    }
    try {
      const credentials = await authApi();
      const { COMPUTE } = await gcpServiceUrls;
      const targetProject = projectId || credentials?.project_id;
      const targetRegion = region || credentials?.region_id;
      if (!targetProject || !targetRegion || !credentials?.access_token) {
        return [];
      }

      const normalizedTargetNetwork =
        /\/networks\/(?<network>[\w-]+)$/.exec(network)?.groups?.['network'] ||
        network;

      const response = await loggedFetch(
        `${COMPUTE}/projects/${targetProject}/regions/${targetRegion}/subnetworks`,
        {
          headers: {
            'Content-Type': API_HEADER_CONTENT_TYPE,
            Authorization: API_HEADER_BEARER + credentials.access_token
          }
        }
      );
      const responseResult: {
        items?: Array<{
          name: string;
          selfLink?: string;
          network: string;
          privateIpGoogleAccess: boolean;
        }>;
        error?: { message: string; code: number };
      } = await response.json();

      console.log('[RuntimeProfileService] getSubnetworks API response:', {
        network: normalizedTargetNetwork,
        targetProject,
        targetRegion,
        rawResponse: responseResult,
        allSubnetworksInRegion: responseResult?.items?.map(item => ({
          name: item.name,
          selfLink: item.selfLink,
          networkUrl: item.network,
          extractedNetwork:
            /\/networks\/(?<network>[\w-]+)$/.exec(item.network)?.groups?.[
              'network'
            ] || item.network?.split('/')[9],
          privateIpGoogleAccess: item.privateIpGoogleAccess
        }))
      });

      if (responseResult?.error?.code) {
        Notification.emit(responseResult.error.message, 'error', {
          autoClose: 5000
        });
        return [];
      }

      const filteredServices = responseResult?.items?.filter(item => {
        const itemNetworkName =
          /\/networks\/(?<network>[\w-]+)$/.exec(item.network)?.groups?.[
            'network'
          ] || item.network?.split('/')[9];
        return (
          itemNetworkName === normalizedTargetNetwork &&
          item.privateIpGoogleAccess === true
        );
      });

      console.log(
        `[RuntimeProfileService] getSubnetworks filtered for network "${normalizedTargetNetwork}":`,
        filteredServices
      );

      if (filteredServices) {
        const transformedServiceList = filteredServices
          .map(data => {
            if (data.selfLink) {
              const matches =
                /\/compute\/v1\/projects\/(?<project>[\w-]+)\/regions\/(?<region>[\w-]+)\/subnetworks\/(?<subnetwork>[\w-]+)/.exec(
                  data.selfLink
                )?.groups;
              if (matches?.['subnetwork']) {
                return matches['subnetwork'];
              }
            }
            return data.name;
          })
          .filter(Boolean);
        if (transformedServiceList.length === 0) {
          const errorMessage = `There are no subnetworks with Google Private Access enabled for network "${normalizedTargetNetwork}"`;
          Notification.emit(errorMessage, 'error', { autoClose: 5000 });
          safeLog(errorMessage, LOG_LEVEL.ERROR);
        }
        return transformedServiceList;
      } else {
        const errorMessage = `No subNetworks found for network ${normalizedTargetNetwork}`;
        Notification.emit(errorMessage, 'error', { autoClose: 5000 });
        safeLog(errorMessage, LOG_LEVEL.ERROR);
        return [];
      }
    } catch (error) {
      console.error('[RuntimeProfileService] getSubnetworks error:', error);
      safeLog('Error listing subNetworks: ' + error, LOG_LEVEL.ERROR);
      Notification.emit(`Error listing subNetworks : ${error}`, 'error', {
        autoClose: 5000
      });
      return [];
    }
  }

  /**
   * Retrieves Shared VPC host project and usable subnetworks in the target region
   * (references RunTimeSerive.runtimeSharedProjectService & listSharedVPCService)
   */
  async getSharedVpcSubnetworks(
    projectId?: string,
    region?: string
  ): Promise<ISharedVpcSubnetworksResult> {
    if (this.useMock) {
      return { hostProjectId: '', subnetworks: [] };
    }
    try {
      const credentials = await authApi();
      const { REGION_URL } = await gcpServiceUrls;
      const targetProject = projectId || credentials?.project_id;
      const targetRegion = region || credentials?.region_id;
      if (!targetProject || !credentials?.access_token) {
        return { hostProjectId: '', subnetworks: [] };
      }

      const hostResponse = await loggedFetch(
        `${REGION_URL}/${targetProject}/getXpnHost`,
        {
          method: 'GET',
          headers: {
            'Content-Type': API_HEADER_CONTENT_TYPE,
            Authorization: API_HEADER_BEARER + credentials.access_token
          }
        }
      );
      const hostText = await hostResponse.text();
      if (!hostText || !hostText.trim()) {
        console.log(
          '[RuntimeProfileService] getSharedVpcSubnetworks getXpnHost returned empty body (no Shared VPC host project).'
        );
        return { hostProjectId: '', subnetworks: [] };
      }

      const hostResult: {
        name?: string;
        error?: { message: string; code: number };
      } = JSON.parse(hostText);

      console.log('[RuntimeProfileService] getSharedVpcSubnetworks getXpnHost response:', {
        targetProject,
        targetRegion,
        hostResult
      });

      if (hostResult?.error?.code) {
        Notification.emit(hostResult.error.message, 'error', {
          autoClose: 5000
        });
        return { hostProjectId: '', subnetworks: [] };
      }

      const hostProjectName = hostResult?.name;
      if (!hostProjectName) {
        return { hostProjectId: '', subnetworks: [] };
      }

      const subnetworksResponse = await loggedFetch(
        `${REGION_URL}/${hostProjectName}/aggregated/subnetworks/listUsable`,
        {
          method: 'GET',
          headers: {
            'Content-Type': API_HEADER_CONTENT_TYPE,
            Authorization: API_HEADER_BEARER + credentials.access_token
          }
        }
      );
      const subnetworksResult: {
        items?: Array<{ subnetwork: string }>;
        error?: { message: string; code: number };
      } = await subnetworksResponse.json();

      console.log('[RuntimeProfileService] getSharedVpcSubnetworks listUsable response:', {
        hostProjectName,
        targetRegion,
        subnetworksResult
      });

      if (subnetworksResult?.error?.code) {
        Notification.emit(subnetworksResult.error.message, 'error', {
          autoClose: 5000
        });
      }

      const transformedSharedvpcSubNetworkList: string[] =
        subnetworksResult?.items
          ?.map((data: { subnetwork: string }) => {
            const matches =
              /\/compute\/v1\/projects\/(?<project>[\w-]+)\/regions\/(?<region>[\w-]+)\/subnetworks\/(?<subnetwork>[\w-]+)/.exec(
                data.subnetwork
              )?.groups;
            if (targetRegion && matches?.['region'] !== targetRegion) {
              return undefined;
            }
            return matches?.['subnetwork'];
          })
          .filter((subNetwork): subNetwork is string => Boolean(subNetwork)) ||
        [];

      console.log('[RuntimeProfileService] getSharedVpcSubnetworks parsed result:', {
        hostProjectId: hostProjectName,
        subnetworks: transformedSharedvpcSubNetworkList
      });

      return {
        hostProjectId: hostProjectName,
        subnetworks: transformedSharedvpcSubNetworkList
      };
    } catch (error) {
      console.error('[RuntimeProfileService] getSharedVpcSubnetworks error:', error);
      safeLog('Error displaying sharedVPC subNetwork: ' + error, LOG_LEVEL.ERROR);
      Notification.emit(
        `Failed to fetch sharedVPC subNetwork : ${error}`,
        'error',
        { autoClose: 5000 }
      );
      return { hostProjectId: '', subnetworks: [] };
    }
  }

  /**
   * Lists Cloud KMS Key Rings in the target project and region
   * (references RunTimeSerive.listKeyRingsAPIService)
   */
  async getKeyRings(projectId?: string, region?: string): Promise<string[]> {
    if (this.useMock) {
      return [];
    }
    try {
      const credentials = await authApi();
      const { CLOUD_KMS } = await gcpServiceUrls;
      const targetProject = projectId || credentials?.project_id;
      const targetRegion = region || credentials?.region_id;
      if (!targetProject || !targetRegion || !credentials?.access_token) {
        return [];
      }

      const response = await loggedFetch(
        `${CLOUD_KMS}/projects/${targetProject}/locations/${targetRegion}/keyRings`,
        {
          headers: {
            'Content-Type': API_HEADER_CONTENT_TYPE,
            Authorization: API_HEADER_BEARER + credentials.access_token
          }
        }
      );
      const responseResult: {
        keyRings?: Array<{ name: string }>;
        error?: { message: string; code: number };
      } = await response.json();

      console.log('[RuntimeProfileService] getKeyRings API response:', {
        targetProject,
        targetRegion,
        rawResponse: responseResult
      });

      if (responseResult?.error?.code) {
        Notification.emit(responseResult.error.message, 'error', {
          autoClose: 5000
        });
        return [];
      }

      const parsedKeyRings = (responseResult?.keyRings || [])
        .map(data => data.name?.split('/')[5] || '')
        .filter(Boolean);

      console.log('[RuntimeProfileService] getKeyRings parsed list:', parsedKeyRings);
      return parsedKeyRings;
    } catch (error) {
      console.error('[RuntimeProfileService] getKeyRings error:', error);
      safeLog('Error listing KeyRings: ' + error, LOG_LEVEL.ERROR);
      Notification.emit(`Error listing KeyRings : ${error}`, 'error', {
        autoClose: 5000
      });
      return [];
    }
  }

  /**
   * Lists enabled Cloud KMS CryptoKeys for a given Key Ring
   * (references RunTimeSerive.listKeysAPIService)
   */
  async getCryptoKeys(
    keyRing: string,
    projectId?: string,
    region?: string
  ): Promise<string[]> {
    if (!keyRing || this.useMock) {
      return [];
    }
    try {
      const credentials = await authApi();
      const { CLOUD_KMS } = await gcpServiceUrls;
      const targetProject = projectId || credentials?.project_id;
      const targetRegion = region || credentials?.region_id;
      if (!targetProject || !targetRegion || !credentials?.access_token) {
        return [];
      }

      const response = await loggedFetch(
        `${CLOUD_KMS}/projects/${targetProject}/locations/${targetRegion}/keyRings/${keyRing}/cryptoKeys`,
        {
          headers: {
            'Content-Type': API_HEADER_CONTENT_TYPE,
            Authorization: API_HEADER_BEARER + credentials.access_token
          }
        }
      );
      const responseResult: {
        cryptoKeys?: Array<{
          name: string;
          primary?: { state: string };
        }>;
        error?: { message: string; code: number };
      } = await response.json();

      console.log('[RuntimeProfileService] getCryptoKeys API response:', {
        keyRing,
        targetProject,
        targetRegion,
        rawResponse: responseResult
      });

      if (responseResult?.error?.code) {
        Notification.emit(responseResult.error.message, 'error', {
          autoClose: 5000
        });
        return [];
      }

      const parsedKeys = (responseResult?.cryptoKeys || [])
        .filter(data => data.primary && data.primary.state === 'ENABLED')
        .map(data => data.name?.split('/')[7] || '')
        .filter(Boolean);

      console.log('[RuntimeProfileService] getCryptoKeys parsed list:', parsedKeys);
      return parsedKeys;
    } catch (error) {
      console.error('[RuntimeProfileService] getCryptoKeys error:', error);
      safeLog('Error listing CryptoKeys: ' + error, LOG_LEVEL.ERROR);
      Notification.emit(`Error listing CryptoKeys : ${error}`, 'error', {
        autoClose: 5000
      });
      return [];
    }
  }

  /**
   * Creates a new Runtime Profile / Dataproc Session Template.
   * Sends POST request to Google Cloud Dataproc sessionTemplates endpoint or simulates in mock mode.
   */
  async createRuntimeProfile(
    payload: ISessionTemplateApiPayload | ICreateRuntimeProfilePayload | any,
    projectId?: string,
    region?: string
  ): Promise<any> {
    const profileDisplayName =
      payload.jupyterSession?.displayName ||
      payload.displayName ||
      'runtime-profile';

    console.log('[RuntimeProfileService] createRuntimeProfile called:', {
      profileDisplayName,
      useMock: this.useMock,
      projectId,
      region,
      payload
    });

    safeLog(
      `Creating runtime profile: ${profileDisplayName} (mockMode=${this.useMock})`,
      LOG_LEVEL.INFO
    );

    if (this.useMock) {
      console.log('[RuntimeProfileService] Executing in mock mode, skipping live API call');
      // Simulate network latency for mock response
      await new Promise(resolve => setTimeout(resolve, 600));

      const profileId = profileDisplayName
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '-')
        .replace(/-+/g, '-');
      const targetRegion = region || payload.region || 'us-central1';
      const targetProject = projectId || 'current-project';

      const newProfile: IRuntimeProfile = {
        name:
          payload.name ||
          `projects/${targetProject}/locations/${targetRegion}/runtimeProfiles/${profileId}`,
        id: profileId,
        displayName: profileDisplayName,
        region: targetRegion,
        description: payload.description,
        tier: payload.tier ?? payload.executorAndDriverConfig?.tier,
        lightningEngineEnabled:
          payload.lightningEngineEnabled ??
          payload.runtimeEnvironmentConfig?.lightningEngineEnabled,
        executorConfig: payload.executorConfig,
        runtimeEnvironmentConfig: payload.runtimeEnvironmentConfig,
        executorAndDriverConfig:
          payload.executorAndDriverConfig ??
          payload.driverAndExecutorConfiguration,
        driverAndExecutorConfiguration:
          payload.driverAndExecutorConfiguration ??
          payload.executorAndDriverConfig,
        driverConfig:
          payload.driverConfig ??
          payload.executorAndDriverConfig ??
          payload.driverAndExecutorConfiguration,
        executorDiskConfig:
          payload.executorDiskConfig ??
          payload.executorAndDriverConfig ??
          payload.driverAndExecutorConfiguration,
        autoscalingConfig: payload.autoscalingConfig,
        metastoreConfig: payload.metastoreConfig,
        networkAndSecurityConfig: payload.networkAndSecurityConfig,
        sessionLifecycleConfig: payload.sessionLifecycleConfig,
        sparkProperties: payload.sparkProperties,
        labels: payload.labels,
        createTime: new Date().toISOString(),
        updateTime: new Date().toISOString(),
        state: 'ACTIVE'
      };

      this.inMemoryProfiles.push(newProfile);
      return newProfile;
    }

    // Live API integration path
    try {
      const credentials = await authApi();
      const { DATAPROC } = await gcpServiceUrls;
      const targetProject = projectId || credentials?.project_id;
      const targetRegion = region || payload.region || credentials?.region_id;

      if (!targetProject) {
        throw new Error(
          'GCP Project ID is required to create a runtime profile. Please log in or select a project.'
        );
      }
      if (!targetRegion) {
        throw new Error(
          'GCP Region is required to create a runtime profile. Please select a valid region.'
        );
      }

      // Ensure payload is mapped to SessionTemplate API schema matching createRunTime.tsx
      const apiPayload: ISessionTemplateApiPayload =
        payload.jupyterSession && payload.name
          ? (payload as ISessionTemplateApiPayload)
          : mapRuntimeProfileToSessionTemplate(
              payload as ICreateRuntimeProfilePayload,
              targetProject,
              targetRegion,
              (credentials as any)?.user_info || (credentials as any)?.user_email
            );

      const url = `${DATAPROC}/projects/${targetProject}/locations/${targetRegion}/sessionTemplates`;

      console.log('[RuntimeProfileService] Making live API call to:', url, {
        method: 'POST',
        headers: {
          'Content-Type': API_HEADER_CONTENT_TYPE,
          Authorization: API_HEADER_BEARER + (credentials?.access_token ? '[EXISTS]' : '[MISSING]')
        },
        body: apiPayload
      });

      const response = await loggedFetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': API_HEADER_CONTENT_TYPE,
          Authorization: API_HEADER_BEARER + (credentials?.access_token || '')
        },
        body: JSON.stringify(apiPayload)
      });

console.log('[RuntimeProfileService] API response status:', response.status, response.statusText);

      const result = await response.json();
console.log('[RuntimeProfileService] API response payload:', result);
if (!response.ok || result.error) {
        throw new Error(
          result?.error?.message ||
          `Failed to create session template (${response.status}: ${response.statusText})`
        );
      }
return result;
    } catch (error) {
      console.error('[RuntimeProfileService] Error in createRuntimeProfile:', error);
      safeLog('Error creating runtime profile: ' + error, LOG_LEVEL.ERROR);
      throw error;
    }
  }
}

// Export singleton instance for easy import
export const runtimeProfileService = new RuntimeProfileService();
