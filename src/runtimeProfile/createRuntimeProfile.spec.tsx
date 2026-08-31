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

import { CreateRuntimeProfileComponent } from './createRuntimeProfile';
import { RuntimeProfileService } from './runtimeProfileService';

describe('CreateRuntimeProfile Component & Service', () => {
  let mockService: RuntimeProfileService;

  beforeEach(() => {
    mockService = new RuntimeProfileService(true);
  });

  it('should export CreateRuntimeProfileComponent and RuntimeProfileService', () => {
    expect(CreateRuntimeProfileComponent).toBeDefined();
    expect(typeof CreateRuntimeProfileComponent).toBe('function');
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

  it('should load standard and accelerated machine types from service', async () => {
    const standardTypes = await mockService.getMachineTypes('standard');
    expect(standardTypes.length).toBeGreaterThan(0);
    expect(standardTypes.some(m => m.name === 'highmem-4')).toBe(true);

    const acceleratedTypes = await mockService.getMachineTypes('accelerated');
    expect(acceleratedTypes.length).toBeGreaterThan(0);
    expect(acceleratedTypes.some(m => m.name === 'g2-standard-4')).toBe(true);
  });

  it('should allow creating a profile in mock mode', async () => {
    const profile = await mockService.createRuntimeProfile({
      displayName: 'test-profile',
      region: 'us-central1',
      description: 'Test runtime profile description',
      nodeConfiguration: {
        nodeType: 'standard',
        executorMachineType: 'highmem-4'
      }
    });

    expect(profile.displayName).toBe('test-profile');
    expect(profile.region).toBe('us-central1');
    expect(profile.description).toBe('Test runtime profile description');
    expect(profile.nodeConfiguration?.executorMachineType).toBe('highmem-4');
    expect(profile.nodeConfiguration?.nodeType).toBe('standard');
    expect(profile.state).toBe('ACTIVE');

    const listed = await mockService.listRuntimeProfiles();
    expect(listed.some(p => p.displayName === 'test-profile')).toBe(true);
  });
});
