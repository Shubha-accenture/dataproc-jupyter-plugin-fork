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
  CreateRuntimeProfile,
  CreateRuntimeProfileComponent
} from './createRuntimeProfile';
import { RuntimeProfileService } from './runtimeProfileService';

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

  it('should ensure instance isolation for in-memory profiles across different service instances', async () => {
    const serviceA = new RuntimeProfileService(true);
    const serviceB = new RuntimeProfileService(true);

    await serviceA.createRuntimeProfile({
      displayName: 'profile-for-a',
      region: 'us-central1'
    });

    const listA = await serviceA.listRuntimeProfiles();
    const listB = await serviceB.listRuntimeProfiles();

    expect(listA.some(p => p.displayName === 'profile-for-a')).toBe(true);
    expect(listB.some(p => p.displayName === 'profile-for-a')).toBe(false);
  });

  it('should load regions from service', async () => {
    const regions = await mockService.getRegions();
    expect(regions.length).toBeGreaterThan(0);
    expect(regions.some(r => r.name === 'us-central1')).toBe(true);
    expect(regions.find(r => r.name === 'us-central1')?.displayName).toBe(
      'us-central1 (Iowa)'
    );
  });

  it('should allow creating, getting, listing, and deleting a profile in mock mode', async () => {
    const profile = await mockService.createRuntimeProfile({
      displayName: 'test-profile',
      region: 'us-central1',
      description: 'Test runtime profile description'
    });

    expect(profile.displayName).toBe('test-profile');
    expect(profile.region).toBe('us-central1');
    expect(profile.description).toBe('Test runtime profile description');
    expect(profile.state).toBe('ACTIVE');

    const listed = await mockService.listRuntimeProfiles();
    expect(listed.some(p => p.displayName === 'test-profile')).toBe(true);

    const fetched = await mockService.getRuntimeProfile('test-profile');
    expect(fetched.displayName).toBe('test-profile');

    await mockService.deleteRuntimeProfile('test-profile');
    const afterDelete = await mockService.listRuntimeProfiles();
    expect(afterDelete.some(p => p.displayName === 'test-profile')).toBe(false);
  });

  it('should throw error when getting a non-existent profile in mock mode', async () => {
    await expect(
      mockService.getRuntimeProfile('non-existent-profile')
    ).rejects.toThrow('Runtime profile not found: non-existent-profile');
  });
});
