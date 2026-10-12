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

import React from 'react';
import { MetastoreEditDrawer } from './metastoreEditDrawer';
import { IMetastoreConfig } from './runtimeProfileInterface';
import { ProjectSelectorModal } from '../controls/ProjectSelectorModal';
import {
  extractCatalogId,
  listBigLakeCatalogsAPI
} from '../utils/biglakeService';
import { listProjectsWithDetailsAPI } from '../utils/projectService';

describe('MetastoreEditDrawer & Metastore Flow', () => {
  const initialLakehouseConfig: IMetastoreConfig = {
    metastore: 'Lakehouse runtime catalog',
    metastoreType: 'lakehouse',
    projectId: 'test-project',
    icebergRestEndpointEnabled: true,
    catalogSelectionMode: 'new',
    catalogName: 'standard-lh-catalog-us-central1',
    hiveEndpointEnabled: false
  };

  const initialDpmsConfig: IMetastoreConfig = {
    metastore: 'Dataproc Metastore',
    metastoreType: 'dataproc',
    projectId: 'test-project',
    dataprocMetastoreService:
      'projects/test-project/locations/us-central1/services/dpms-service'
  };

  it('should export MetastoreEditDrawer component and instantiate with Lakehouse props', () => {
    expect(MetastoreEditDrawer).toBeDefined();
    expect(typeof MetastoreEditDrawer).toBe('function');

    const handleSave = jest.fn();
    const handleClose = jest.fn();

    const element = React.createElement(MetastoreEditDrawer, {
      open: true,
      config: initialLakehouseConfig,
      region: 'us-central1',
      onClose: handleClose,
      onSave: handleSave
    });

    expect(element).toBeDefined();
    expect(element.type).toBe(MetastoreEditDrawer);
    expect(element.props.open).toBe(true);
    expect(element.props.config.metastoreType).toBe('lakehouse');
    expect(element.props.config.catalogName).toBe(
      'standard-lh-catalog-us-central1'
    );
    expect(element.props.region).toBe('us-central1');
  });

  it('should instantiate MetastoreEditDrawer with Dataproc Metastore props', () => {
    const element = React.createElement(MetastoreEditDrawer, {
      open: true,
      config: initialDpmsConfig,
      region: 'us-central1',
      onClose: jest.fn(),
      onSave: jest.fn()
    });

    expect(element).toBeDefined();
    expect(element.props.config.metastoreType).toBe('dataproc');
    expect(element.props.config.dataprocMetastoreService).toBe(
      'projects/test-project/locations/us-central1/services/dpms-service'
    );
  });

  it('should instantiate ProjectSelectorModal with correct props', () => {
    expect(ProjectSelectorModal).toBeDefined();
    expect(typeof ProjectSelectorModal).toBe('function');

    const handleSelect = jest.fn();
    const handleClose = jest.fn();

    const element = React.createElement(ProjectSelectorModal, {
      open: true,
      selectedProjectId: 'frontrow-team',
      onClose: handleClose,
      onSelect: handleSelect
    });

    expect(element).toBeDefined();
    expect(element.type).toBe(ProjectSelectorModal);
    expect(element.props.open).toBe(true);
    expect(element.props.selectedProjectId).toBe('frontrow-team');
  });

  it('should extract catalog ID correctly from BigLake resource name', () => {
    expect(
      extractCatalogId(
        'projects/my-project/locations/us-central1/catalogs/iceberg_catalog_01'
      )
    ).toBe('iceberg_catalog_01');

    expect(extractCatalogId('short_catalog_id')).toBe('short_catalog_id');
    expect(extractCatalogId('')).toBe('');
  });

  it('should export listBigLakeCatalogsAPI and listProjectsWithDetailsAPI functions', () => {
    expect(listBigLakeCatalogsAPI).toBeDefined();
    expect(typeof listBigLakeCatalogsAPI).toBe('function');

    expect(listProjectsWithDetailsAPI).toBeDefined();
    expect(typeof listProjectsWithDetailsAPI).toBe('function');
  });
});
