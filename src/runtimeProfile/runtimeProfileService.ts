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

import {
  API_HEADER_BEARER,
  API_HEADER_CONTENT_TYPE,
  gcpServiceUrls
} from '../utils/const';
import { authApi, loggedFetch } from '../utils/utils';
import { DataprocLoggingService, LOG_LEVEL } from '../utils/loggingService';
import {
  ICreateRuntimeProfilePayload,
  IRegionOption,
  IRuntimeProfile,
  IRuntimeProfileService
} from './runtimeProfileInterface';

/**
 * Flag to enable mock mode until Dataproc Runtime Profiles backend API is deployed.
 * Set to false when connecting to the real Google Cloud Dataproc / Jupyter server endpoint.
 */
export const RUNTIME_PROFILE_USE_MOCK = true;

/**
 * Mock regions with human-readable location descriptions
 */
export const MOCK_REGIONS: IRegionOption[] = [
  { name: 'us-central1', displayName: 'us-central1 (Iowa)' },
  { name: 'us-east1', displayName: 'us-east1 (South Carolina)' },
];

// In-memory store for mock runtime profiles during session
const inMemoryProfiles: IRuntimeProfile[] = [];

const safeLog = (message: string, level: LOG_LEVEL = LOG_LEVEL.INFO) => {
  if (process.env.NODE_ENV === 'test') {
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

  constructor(useMock: boolean = RUNTIME_PROFILE_USE_MOCK) {
    this.useMock = useMock;
  }

  /**
   * Retrieves available GCP regions with formatted display names
   */
  async getRegions(projectId?: string): Promise<IRegionOption[]> {
    if (this.useMock) {
      return MOCK_REGIONS;
    }

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
   * Creates a new Runtime Profile.
   * Uses mock simulation or sends request to Dataproc API when live.
   */
  async createRuntimeProfile(
    payload: ICreateRuntimeProfilePayload,
    projectId?: string,
    region?: string
  ): Promise<IRuntimeProfile> {
    safeLog(
      `Creating runtime profile: ${payload.displayName} (mockMode=${this.useMock})`,
      LOG_LEVEL.INFO
    );

    if (this.useMock) {
      // Simulate network latency for mock response
      await new Promise(resolve => setTimeout(resolve, 600));

      const profileId = payload.displayName
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '-')
        .replace(/-+/g, '-');
      const targetRegion = region || payload.region || 'us-central1';
      const targetProject = projectId || 'current-project';

      const newProfile: IRuntimeProfile = {
        name: `projects/${targetProject}/locations/${targetRegion}/runtimeProfiles/${profileId}`,
        id: profileId,
        displayName: payload.displayName,
        region: targetRegion,
        description: payload.description,
        createTime: new Date().toISOString(),
        updateTime: new Date().toISOString(),
        state: 'ACTIVE'
      };

      inMemoryProfiles.push(newProfile);
      return newProfile;
    }

    // Live API integration path
    try {
      const credentials = await authApi();
      const { DATAPROC } = await gcpServiceUrls;
      const targetProject = projectId || credentials?.project_id;
      const targetRegion = region || payload.region;
      const url = `${DATAPROC}/projects/${targetProject}/locations/${targetRegion}/runtimeProfiles`;

      const response = await loggedFetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': API_HEADER_CONTENT_TYPE,
          Authorization: API_HEADER_BEARER + (credentials?.access_token || '')
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      if (result.error) {
        throw new Error(
          result.error.message || 'Failed to create runtime profile'
        );
      }
      return result as IRuntimeProfile;
    } catch (error) {
      safeLog('Error creating runtime profile: ' + error, LOG_LEVEL.ERROR);
      throw error;
    }
  }

  /**
   * Lists all existing runtime profiles
   */
  async listRuntimeProfiles(
    projectId?: string,
    region?: string
  ): Promise<IRuntimeProfile[]> {
    if (this.useMock) {
      return [...inMemoryProfiles];
    }

    try {
      const credentials = await authApi();
      const { DATAPROC } = await gcpServiceUrls;
      const targetProject = projectId || credentials?.project_id;
      const url = `${DATAPROC}/projects/${targetProject}/locations/${region}/runtimeProfiles`;

      const response = await loggedFetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': API_HEADER_CONTENT_TYPE,
          Authorization: API_HEADER_BEARER + (credentials?.access_token || '')
        }
      });

      const result = await response.json();
      return (result.runtimeProfiles || []) as IRuntimeProfile[];
    } catch (error) {
      safeLog('Error listing runtime profiles: ' + error, LOG_LEVEL.ERROR);
      return [];
    }
  }

  /**
   * Fetches a specific runtime profile by resource name
   */
  async getRuntimeProfile(name: string): Promise<IRuntimeProfile> {
    if (this.useMock) {
      const found = inMemoryProfiles.find(
        p => p.name === name || p.id === name
      );
      if (found) {
        return found;
      }
      throw new Error(`Runtime profile not found: ${name}`);
    }

    const credentials = await authApi();
    const { DATAPROC } = await gcpServiceUrls;
    const url = `${DATAPROC}/${name}`;

    const response = await loggedFetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': API_HEADER_CONTENT_TYPE,
        Authorization: API_HEADER_BEARER + (credentials?.access_token || '')
      }
    });

    const result = await response.json();
    return result as IRuntimeProfile;
  }

  /**
   * Deletes a runtime profile
   */
  async deleteRuntimeProfile(name: string): Promise<void> {
    if (this.useMock) {
      const index = inMemoryProfiles.findIndex(
        p => p.name === name || p.id === name
      );
      if (index >= 0) {
        inMemoryProfiles.splice(index, 1);
      }
      return;
    }

    const credentials = await authApi();
    const { DATAPROC } = await gcpServiceUrls;
    const url = `${DATAPROC}/${name}`;

    await loggedFetch(url, {
      method: 'DELETE',
      headers: {
        'Content-Type': API_HEADER_CONTENT_TYPE,
        Authorization: API_HEADER_BEARER + (credentials?.access_token || '')
      }
    });
  }
}

// Export singleton instance for easy import
export const runtimeProfileService = new RuntimeProfileService();
