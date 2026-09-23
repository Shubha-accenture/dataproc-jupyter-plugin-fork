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

import React, { useEffect, useState } from 'react';
import {
  Checkbox,
  CircularProgress,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
  TextField
} from '@mui/material';
import { EditDrawer } from '../controls/EditDrawer';
import { ProjectSelectorModal } from '../controls/ProjectSelectorModal';
import {
  CatalogSelectionMode,
  IMetastoreConfig,
  MetastoreType
} from './runtimeProfileInterface';
import { listBigLakeCatalogsAPI } from '../utils/biglakeService';
import { metastoreServiceListAPI } from '../utils/metastoreService';
import '../../style/editDrawer.css';
import '../../style/runtimeProfile.css';

export interface IMetastoreEditDrawerProps {
  open: boolean;
  config: IMetastoreConfig;
  region?: string;
  onClose: () => void;
  onSave: (updatedConfig: IMetastoreConfig) => void;
}

export const MetastoreEditDrawer: React.FC<IMetastoreEditDrawerProps> = ({
  open,
  config,
  region = 'us-central1',
  onClose,
  onSave
}) => {
  const [metastoreType, setMetastoreType] = useState<MetastoreType>(
    config.metastoreType ||
      (config.metastore === 'Dataproc Metastore' ? 'dataproc' : 'lakehouse')
  );

  const [projectId, setProjectId] = useState<string>(config.projectId || '');
  const [isProjectModalOpen, setIsProjectModalOpen] = useState<boolean>(false);

  // Iceberg REST Endpoint settings
  const [icebergRestEndpointEnabled, setIcebergRestEndpointEnabled] =
    useState<boolean>(config.icebergRestEndpointEnabled ?? true);

  // Catalog selection
  const [catalogSelectionMode, setCatalogSelectionMode] =
    useState<CatalogSelectionMode>(config.catalogSelectionMode || 'new');

  const [catalogId, setCatalogId] = useState<string>(config.catalogId || '');
  const [catalogsList, setCatalogsList] = useState<string[]>([]);
  const [isLoadingCatalogs, setIsLoadingCatalogs] = useState<boolean>(false);

  // NOTE: Awaiting tech senior confirmation on default catalog naming convention.
  // Currently pre-filling standard-lh-catalog-${region} matching screenshot 1.
  const [catalogName, setCatalogName] = useState<string>(
    config.catalogName || `standard-lh-catalog-${region || 'us-central1'}`
  );

  // Dataproc Metastore settings
  const [dataprocMetastoreService, setDataprocMetastoreService] =
    useState<string>(config.dataprocMetastoreService || config.metastore || '');
  const [dpmsServicesList, setDpmsServicesList] = useState<string[]>([]);
  const [isLoadingDpmsServices, setIsLoadingDpmsServices] =
    useState<boolean>(false);

  // Hive Endpoint checkbox
  // TODO: Check with tech senior on Hive Endpoint Spark / backend properties mapping
  const [hiveEndpointEnabled, setHiveEndpointEnabled] = useState<boolean>(
    Boolean(config.hiveEndpointEnabled)
  );

  // Sync state whenever drawer opens or config changes
  useEffect(() => {
    if (open) {
      const type =
        config.metastoreType ||
        (config.metastore === 'Dataproc Metastore' ? 'dataproc' : 'lakehouse');
      setMetastoreType(type);
      setProjectId(config.projectId || '');
      setIcebergRestEndpointEnabled(config.icebergRestEndpointEnabled ?? true);
      setCatalogSelectionMode(config.catalogSelectionMode || 'new');
      setCatalogId(config.catalogId || '');
      setCatalogName(
        config.catalogName || `standard-lh-catalog-${region || 'us-central1'}`
      );
      setDataprocMetastoreService(
        config.dataprocMetastoreService || config.metastore || ''
      );
      setHiveEndpointEnabled(Boolean(config.hiveEndpointEnabled));
    }
  }, [open, config, region]);

  // Fetch BigLake catalogs when Lakehouse is active and "Choose existing catalog in project" is selected
  useEffect(() => {
    if (
      open &&
      metastoreType === 'lakehouse' &&
      catalogSelectionMode === 'existing' &&
      projectId
    ) {
      setIsLoadingCatalogs(true);
      listBigLakeCatalogsAPI(projectId, region)
        .then(catalogs => {
          setCatalogsList(catalogs);
          setIsLoadingCatalogs(false);
          if (catalogs.length > 0 && !catalogId) {
            setCatalogId(catalogs[0]);
          }
        })
        .catch(() => {
          setIsLoadingCatalogs(false);
        });
    }
  }, [open, metastoreType, catalogSelectionMode, projectId, region, catalogId]);

  // Fetch Dataproc Metastore services when DPMS is selected
  useEffect(() => {
    if (open && metastoreType === 'dataproc' && projectId) {
      setIsLoadingDpmsServices(true);
      metastoreServiceListAPI(projectId, '')
        .then(services => {
          setDpmsServicesList(services);
          setIsLoadingDpmsServices(false);
          if (services.length > 0 && !dataprocMetastoreService) {
            setDataprocMetastoreService(services[0]);
          }
        })
        .catch(() => {
          setIsLoadingDpmsServices(false);
        });
    }
  }, [open, metastoreType, projectId, dataprocMetastoreService]);

  const handleSave = () => {
    const updated: IMetastoreConfig = {
      metastore:
        metastoreType === 'lakehouse'
          ? 'Lakehouse runtime catalog'
          : dataprocMetastoreService || 'Dataproc Metastore',
      metastoreType,
      projectId: projectId || undefined,
      icebergRestEndpointEnabled,
      catalogSelectionMode,
      catalogId: catalogSelectionMode === 'existing' ? catalogId : undefined,
      catalogName: catalogSelectionMode === 'new' ? catalogName : undefined,
      dataprocMetastoreService:
        metastoreType === 'dataproc' ? dataprocMetastoreService : undefined,
      hiveEndpointEnabled
    };
    onSave(updated);
  };

  return (
    <>
      <EditDrawer
        open={open}
        title="Metastore configuration"
        subtitle="Choose the metastore that manages your dataset. By default, a runtime profile will use the Lakehouse runtime catalog in the same project as the runtime profile, but you can choose a Lakehouse runtime catalog in a different project or a Dataproc Metastore instance."
        onClose={onClose}
        onSave={handleSave}
      >
        <div className="edit-drawer-field-group">
          <div className="runtime-profile-section-title">
            Select metastore and project
          </div>

          <div className="metastore-cards-container">
            <div
              className={`metastore-card ${
                metastoreType === 'lakehouse' ? 'selected' : ''
              }`}
              onClick={() => setMetastoreType('lakehouse')}
              role="button"
              tabIndex={0}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setMetastoreType('lakehouse');
                }
              }}
            >
              <div className="metastore-card-title">
                Lakehouse runtime catalog
              </div>
              <div className="metastore-card-desc">
                Modern, serverless metastore for your Lakehouse
              </div>
            </div>

            <div
              className={`metastore-card ${
                metastoreType === 'dataproc' ? 'selected' : ''
              }`}
              onClick={() => setMetastoreType('dataproc')}
              role="button"
              tabIndex={0}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setMetastoreType('dataproc');
                }
              }}
            >
              <div className="metastore-card-title">Dataproc Metastore</div>
              <div className="metastore-card-desc">
                Legacy-managed Hive Metastore (HMS)
              </div>
            </div>
          </div>
        </div>

        {/* Lakehouse Runtime Catalog view */}
        {metastoreType === 'lakehouse' && (
          <>
            <div className="edit-drawer-field-group">
              <FormControlLabel
                control={
                  <Checkbox
                    checked={icebergRestEndpointEnabled}
                    onChange={e =>
                      setIcebergRestEndpointEnabled(e.target.checked)
                    }
                    size="small"
                  />
                }
                label="Iceberg REST Endpoint"
              />

              {icebergRestEndpointEnabled && (
                <>
                  <div className="edit-drawer-helper-text">
                    Specify the Iceberg REST Catalog endpoints.
                  </div>

                  <div
                    className="edit-drawer-input-with-button"
                    style={{ marginTop: 8 }}
                  >
                    <TextField
                      id="metastore-project-id"
                      label="Project ID"
                      value={projectId}
                      onChange={e => setProjectId(e.target.value)}
                      variant="outlined"
                      size="small"
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                    />
                    <button
                      type="button"
                      className="edit-drawer-browse-btn"
                      onClick={() => setIsProjectModalOpen(true)}
                    >
                      Browse
                    </button>
                  </div>

                  <div
                    className="edit-drawer-field-group"
                    style={{ marginTop: 16 }}
                  >
                    <div className="runtime-profile-section-title">
                      Choose your default catalog
                    </div>
                    <div className="edit-drawer-helper-text">
                      Managed Service for Apache Spark will automatically create
                      a default catalog for you unless you designate an existing
                      one from your metastore.
                    </div>

                    <RadioGroup
                      value={catalogSelectionMode}
                      onChange={e =>
                        setCatalogSelectionMode(
                          e.target.value as CatalogSelectionMode
                        )
                      }
                    >
                      <FormControlLabel
                        value="existing"
                        control={<Radio size="small" />}
                        label="Choose existing catalog in project"
                      />

                      {catalogSelectionMode === 'existing' && (
                        <div style={{ marginLeft: 32, marginBottom: 12 }}>
                          <FormControl
                            size="small"
                            fullWidth
                            variant="outlined"
                          >
                            <InputLabel id="existing-catalog-label" shrink>
                              Catalog ID
                            </InputLabel>
                            <Select
                              labelId="existing-catalog-label"
                              id="existing-catalog-select"
                              label="Catalog ID"
                              notched
                              value={catalogId}
                              onChange={e =>
                                setCatalogId(e.target.value as string)
                              }
                              disabled={isLoadingCatalogs}
                            >
                              {isLoadingCatalogs ? (
                                <MenuItem value="" disabled>
                                  <CircularProgress
                                    size={16}
                                    style={{ marginRight: 8 }}
                                  />
                                  Loading catalogs...
                                </MenuItem>
                              ) : catalogsList.length === 0 ? (
                                <MenuItem value="" disabled>
                                  No catalogs found in project
                                </MenuItem>
                              ) : (
                                catalogsList.map(cat => (
                                  <MenuItem key={cat} value={cat}>
                                    {cat}
                                  </MenuItem>
                                ))
                              )}
                            </Select>
                          </FormControl>
                        </div>
                      )}

                      <FormControlLabel
                        value="new"
                        control={<Radio size="small" />}
                        label="Create new default catalog"
                      />

                      {catalogSelectionMode === 'new' && (
                        <div style={{ marginLeft: 32, marginBottom: 12 }}>
                          <TextField
                            id="new-catalog-name"
                            label="Default name"
                            value={catalogName}
                            onChange={e => setCatalogName(e.target.value)}
                            variant="outlined"
                            size="small"
                            fullWidth
                            InputLabelProps={{ shrink: true }}
                          />
                        </div>
                      )}
                    </RadioGroup>
                  </div>
                </>
              )}
            </div>

            <div className="edit-drawer-field-group">
              <FormControlLabel
                control={
                  <Checkbox
                    checked={hiveEndpointEnabled}
                    onChange={e => setHiveEndpointEnabled(e.target.checked)}
                    size="small"
                  />
                }
                label="Hive Endpoint"
              />
            </div>
          </>
        )}

        {/* Dataproc Metastore view */}
        {metastoreType === 'dataproc' && (
          <>
            <div
              className="edit-drawer-helper-text"
              style={{ marginBottom: 16 }}
            >
              Configure the cluster to use Dataproc Metastore as its Hive
              metastore.{' '}
              <a
                href="https://cloud.google.com/dataproc-metastore/docs"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#1a73e8', textDecoration: 'none' }}
              >
                Learn more
              </a>
            </div>

            <div className="edit-drawer-field-group">
              <div className="edit-drawer-input-with-button">
                <TextField
                  id="dpms-project-id"
                  label="Selected project"
                  value={projectId}
                  onChange={e => setProjectId(e.target.value)}
                  variant="outlined"
                  size="small"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
                <button
                  type="button"
                  className="edit-drawer-browse-btn"
                  onClick={() => setIsProjectModalOpen(true)}
                >
                  Browse
                </button>
              </div>
            </div>

            <div className="edit-drawer-field-group">
              <FormControl size="small" fullWidth variant="outlined">
                <InputLabel id="dpms-service-label" shrink>
                  Metastore service
                </InputLabel>
                <Select
                  labelId="dpms-service-label"
                  id="dpms-service-select"
                  label="Metastore service"
                  notched
                  value={dataprocMetastoreService || ''}
                  onChange={e =>
                    setDataprocMetastoreService(e.target.value as string)
                  }
                  disabled={isLoadingDpmsServices}
                >
                  <MenuItem value="">None</MenuItem>
                  {isLoadingDpmsServices ? (
                    <MenuItem value="" disabled>
                      <CircularProgress size={16} style={{ marginRight: 8 }} />
                      Loading services...
                    </MenuItem>
                  ) : dpmsServicesList.length === 0 ? (
                    <MenuItem value="" disabled>
                      No services found in project
                    </MenuItem>
                  ) : (
                    dpmsServicesList.map(service => (
                      <MenuItem key={service} value={service}>
                        {service}
                      </MenuItem>
                    ))
                  )}
                </Select>
              </FormControl>
              <div className="edit-drawer-helper-text" style={{ marginTop: 8 }}>
                We recommend this option to persist table metadata when a
                cluster is shut down, for a metastore shared by different
                clusters, or for metadata operability across GCP products.
              </div>
            </div>

            {/* TODO: Check with senior if checkbox needs to be added or not */}
          </>
        )}
      </EditDrawer>

      <ProjectSelectorModal
        open={isProjectModalOpen}
        selectedProjectId={projectId}
        onClose={() => setIsProjectModalOpen(false)}
        onSelect={selectedId => {
          setProjectId(selectedId);
          setIsProjectModalOpen(false);
        }}
      />
    </>
  );
};
