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
}

/**
 * Payload sent when creating a new Runtime Profile
 */
export interface ICreateRuntimeProfilePayload {
  displayName: string;
  region: string;
  description?: string;
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
