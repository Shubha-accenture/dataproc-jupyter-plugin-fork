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

import { requestAPI } from '../../handler/handler';

export interface ICatalog {
  name: string;
  createTime: string;
  updateTime: string;
  deleteTime?: string;
  expireTime?: string;
}

export interface IListCatalogsResponse {
  'iceberg-catalogs': ICatalog[];
  nextPageToken?: string;
}

export class BigLakeService {
  static async listCatalogs(
    projectId: string,
    setCatalogs: (catalogs: ICatalog[]) => void,
    setIsLoading: (isLoading: boolean) => void,
    pageToken?: string
  ): Promise<void> {
    setIsLoading(true);
    try {
      let url = `v1/projects/${projectId}/catalogs`;
      if (pageToken) {
        url += `?pageToken=${pageToken}`;
      }
      const data = await requestAPI<IListCatalogsResponse>(url, {
        method: 'GET'
      });
      setCatalogs(data['iceberg-catalogs'] || []);
    } catch (reason) {
      console.error(`Error fetching BigLake catalogs: ${reason}`);
    } finally {
      setIsLoading(false);
    }
  }
}
