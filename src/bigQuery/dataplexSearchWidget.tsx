/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { Panel } from '@lumino/widgets';
import { JupyterLab } from '@jupyterlab/application';
import {
  IThemeManager,
  ReactWidget,
  MainAreaWidget
} from '@jupyterlab/apputils';
import { ISettingRegistry } from '@jupyterlab/settingregistry';
import { Signal } from '@lumino/signaling';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Button,
  TextField,
  IconButton,
  CircularProgress,
  Checkbox,
  ListItemText,
  Chip
} from '@mui/material';
import { Search } from '@mui/icons-material';
import { LabIcon } from '@jupyterlab/ui-components';

import tableIcon from '../../style/icons/table_icon.svg';
import columnsIcon from '../../style/icons/columns_icon.svg';
import datasetsIcon from '../../style/icons/datasets_icon.svg';

import { BigQueryService } from './bigQueryService';
import { BigQueryDatasetWrapper } from './bigQueryDatasetInfoWrapper';
import { BigQueryTableWrapper } from './bigQueryTableInfoWrapper';

const iconDatasets = new LabIcon({
  name: 'launcher:datasets-icon',
  svgstr: datasetsIcon
});
const iconTable = new LabIcon({
  name: 'launcher:table-icon',
  svgstr: tableIcon
});
const iconColumns = new LabIcon({
  name: 'launcher:columns-icon',
  svgstr: columnsIcon
});

const subtypeMapping: Record<string, string[]> = {
  Dataset: ['Default', 'Linked'],
  Table: ['Biglake table', 'Biglake object table', 'External Table', 'Table'],
  View: ['View', 'Materialized view', 'Authorized view']
};

export const dataplexLocations = [
  'africa-south1',
  'asia-east1',
  'asia-east2',
  'asia-northeast1',
  'asia-northeast2',
  'asia-northeast3',
  'asia-south1',
  'asia-south2',
  'asia-southeast1',
  'asia-southeast2',
  'australia-southeast1',
  'australia-southeast2',
  'europe-central2',
  'europe-north1',
  'europe-north2',
  'europe-southwest1',
  'europe-west1',
  'europe-west2',
  'europe-west3',
  'europe-west4',
  'europe-west6',
  'europe-west8',
  'europe-west9',
  'europe-west10',
  'europe-west12',
  'me-central1',
  'me-central2',
  'me-west1',
  'northamerica-northeast1',
  'northamerica-northeast2',
  'northamerica-south1',
  'southamerica-east1',
  'southamerica-west1',
  'us-central1',
  'us-east1',
  'us-east4',
  'us-east5',
  'us-south1',
  'us-west1',
  'us-west2',
  'us-west3',
  'us-west4'
];

export interface INLSearchFilters {
  scope: string[];
  systems: string[];
  projects: string[];
  type: string[];
  subtype: string[];
  locations: string[];
  datasets: string[];
}

export interface ISearchResult {
  name: string;
  description?: string;
  label?: string;
  system?: string;
  location?: string;
  assetType?: string;
  projectId?: string;
  datasetId?: string;
  tableId?: string | null;
}

const initialFilterState: INLSearchFilters = {
  scope: ['Current Organization'],
  systems: [],
  projects: [],
  type: [],
  subtype: [],
  locations: [],
  datasets: []
};

interface IDataplexSearchComponentProps {
  initialQuery: string;
  searchLoading: boolean;
  datasetsLoading: boolean;
  resetDatasetsTrigger: number;
  results?: ISearchResult[];
  projectsList: string[];
  datasetList: string[];
  onQueryChanged: (query: string) => void;
  onSearchExecuted: (
    query: string,
    projects: string[],
    datasets: string[],
    filters: INLSearchFilters
  ) => void;
  onFiltersChanged: (filters: INLSearchFilters) => void;
  onResultClicked: (result: ISearchResult) => void;
}

const RESULTS_PER_PAGE = 50;

const DataplexSearchComponent: React.FC<IDataplexSearchComponentProps> = ({
  initialQuery,
  searchLoading,
  datasetsLoading,
  resetDatasetsTrigger,
  results = [],
  onQueryChanged,
  onSearchExecuted,
  onFiltersChanged,
  projectsList,
  datasetList,
  onResultClicked
}) => {
  const [filters, setFilters] = useState<INLSearchFilters>(initialFilterState);
  const [currentPage, setCurrentPage] = useState(1);
  const [datasetSearchTerm, setDatasetSearchTerm] = useState('');

  // To reset datasets selection when trigger changes
  useEffect(() => {
    if (resetDatasetsTrigger > 0) {
      setFilters(prev => ({ ...prev, datasets: [] }));
    }
  }, [resetDatasetsTrigger]);

  // Filter the datasetList based on what the user types
  const filteredDatasetOptions = useMemo(() => {
    if (!datasetSearchTerm.trim()) {
      return [];
    }
    return datasetList.filter(name =>
      name.toLowerCase().includes(datasetSearchTerm.toLowerCase())
    );
  }, [datasetList, datasetSearchTerm]);

  useEffect(() => {
    onFiltersChanged(filters);
  }, [filters, onFiltersChanged]);

  const handleFilterChange = useCallback(
    (name: keyof INLSearchFilters, value: string[]) => {
      setFilters(prev => ({ ...prev, [name]: value }));
    },
    []
  );

  const handleClearFilters = useCallback(() => {
    setFilters(initialFilterState);
    if (initialQuery.trim() === '') {
      onQueryChanged('');
      onSearchExecuted('', [], [], initialFilterState);
    } else {
      onSearchExecuted(
        initialQuery.trim(),
        initialFilterState.projects,
        initialFilterState.datasets,
        initialFilterState
      );
    }
  }, [initialQuery, onSearchExecuted, onQueryChanged]);

  const handleClearChip = useCallback(
    (filterName: keyof INLSearchFilters, valueToRemove: string) => {
      setFilters(prev => ({
        ...prev,
        [filterName]: prev[filterName].filter(v => v !== valueToRemove)
      }));
    },
    []
  );

  const activeFilters = useMemo(() => {
    const active: {
      name: keyof INLSearchFilters;
      label: string;
      value: string;
      originalValue: string;
    }[] = [];

    const filterLabels: Record<keyof INLSearchFilters, string> = {
      scope: 'Scope',
      projects: 'Project',
      systems: 'System',
      type: 'Type',
      subtype: 'Subtype',
      locations: 'Locations',
      datasets: 'Datasets'
    };

    (Object.keys(filters) as (keyof INLSearchFilters)[]).forEach(key => {
      if (filters[key] && filters[key].length > 0) {
        filters[key].forEach(value => {
          if (key === 'scope' && value === 'Current Organization') {
            return;
          }
          const filterValue =
            key === 'datasets' && value.includes('/')
              ? value.split('/').pop() || value
              : value;

          active.push({
            name: key,
            label: filterLabels[key] || key,
            value: filterValue,
            originalValue: value
          });
        });
      }
    });
    return active;
  }, [filters]);

  const handleSearchClick = () => {
    onSearchExecuted(initialQuery.trim(), [], [], filters);
  };

  const showFlatResults = useMemo(() => !searchLoading, [searchLoading]);

  const totalResults = results.length;
  const totalPages = Math.ceil(totalResults / RESULTS_PER_PAGE);

  const paginatedResults = useMemo(() => {
    const startIndex = (currentPage - 1) * RESULTS_PER_PAGE;
    const endIndex = startIndex + RESULTS_PER_PAGE;
    return results.slice(startIndex, endIndex);
  }, [results, currentPage]);

  const handleNextPage = useCallback(() => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  }, [totalPages]);

  const handlePrevPage = useCallback(() => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  }, []);

  const renderCard = (result: ISearchResult, index: number) => (
    <li
      key={index}
      className="search-result-item"
      style={{
        padding: '8px 16px',
        border: '1px solid var(--jp-border-color2)',
        borderRadius: '4px',
        marginBottom: '8px',
        backgroundColor: 'var(--jp-layout-color1)'
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '4px'
        }}
      >
        {result.label === 'Bigquery / Dataset' ? (
          <div role="img" className="db-icon">
            <iconDatasets.react tag="div" />
          </div>
        ) : result.label === 'Bigquery / View' ? (
          <div role="img" className="db-icon">
            <iconColumns.react tag="div" />{' '}
          </div>
        ) : (
          <div role="img" className="db-icon">
            <iconTable.react tag="div" />
          </div>
        )}

        <div
          style={{
            color: 'var(--jp-brand-color1)',
            fontSize: 14,
            fontWeight: 500,
            textDecoration: 'underline',
            cursor: 'pointer'
          }}
          onClick={() => onResultClicked(result)}
        >
          {result.name}
        </div>

        {result.label && (
          <div
            style={{
              alignSelf: 'stretch',
              justifyContent: 'center',
              alignItems: 'center',
              display: 'flex'
            }}
          >
            <div
              style={{
                justifyContent: 'center',
                display: 'flex',
                flexDirection: 'column',
                color: 'var(--jp-ui-font-color3)',
                fontSize: 11,
                fontFamily: 'Google Sans Text',
                fontWeight: 500,
                lineHeight: '16px',
                letterSpacing: 0.1,
                wordWrap: 'break-word'
              }}
            >
              {result.label}
            </div>
          </div>
        )}
      </div>
      <div
        style={{
          fontSize: 13,
          color: 'var(--jp-ui-font-color3)',
          paddingLeft: '28px'
        }}
      >
        {result.description || 'No description provided.'}
      </div>
    </li>
  );

  const handleTypeChange = (selectedTypes: string[]) => {
    setFilters(prev => {
      const validSubtypes = selectedTypes.flatMap(t => subtypeMapping[t] || []);
      const newSubtype = prev.subtype.filter(s => validSubtypes.includes(s));

      return {
        ...prev,
        type: selectedTypes,
        subtype: newSubtype
      };
    });
  };

  const renderLoadingLabel = (label: string, isLoading: boolean) => {
    return isLoading ? (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {label} <CircularProgress size={14} color="inherit" />
      </div>
    ) : (
      label
    );
  };

  const availableSubtypes = useMemo(() => {
    const options = filters.type.flatMap(t => subtypeMapping[t] || []);
    return Array.from(new Set(options));
  }, [filters.type]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        height: '100%',
        width: '100%'
      }}
    >
      <div
        style={{
          padding: '8px 12px 16px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          width: '290px',
          minWidth: '290px',
          borderRight: '1px solid var(--jp-border-color2)',
          overflowY: 'auto'
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <h3
            style={{
              color: 'var(--jp-ui-font-color1)',
              fontWeight: 500,
              margin: 0
            }}
          >
            Filters
          </h3>
          <Button
            onClick={handleClearFilters}
            size="small"
            style={{
              color: 'var(--jp-brand-color1)',
              minWidth: 'unset',
              padding: '2px 8px'
            }}
          >
            Clear
          </Button>
        </div>
        <hr
          style={{
            borderTop: '1px solid var(--jp-border-color2)',
            margin: '4px 0 6px 0'
          }}
        />
        <FormControl
          variant="outlined"
          fullWidth
          size="small"
          style={{ marginBottom: '12px' }}
        >
          <InputLabel id="scope-label">Scope</InputLabel>
          <Select
            labelId="scope-label"
            multiple={false}
            value={filters.scope[0] || ''}
            onChange={e =>
              handleFilterChange('scope', [e.target.value as string])
            }
            label="Scope"
          >
            {['Current Organization', 'Current Project'].map(opt => (
              <MenuItem key={opt} value={opt}>
                <ListItemText primary={opt} />
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl
          variant="outlined"
          fullWidth
          size="small"
          style={{ marginBottom: '12px' }}
        >
          <InputLabel id="systems-label">Systems</InputLabel>
          <Select
            labelId="systems-label"
            multiple
            value={filters.systems}
            onChange={e =>
              handleFilterChange('systems', e.target.value as string[])
            }
            renderValue={(selected: string[]) => selected.join(', ')}
            label="Systems"
          >
            {['BigQuery'].map(opt => (
              <MenuItem key={opt} value={opt}>
                <Checkbox checked={filters.systems.indexOf(opt) > -1} />
                <ListItemText primary={opt} />
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl
          variant="outlined"
          fullWidth
          size="small"
          style={{ marginBottom: '12px' }}
          disabled={
            filters.scope.includes('Current Project') ||
            (projectsList.length === 0 && searchLoading)
          }
        >
          <InputLabel id="projects-label">
            {renderLoadingLabel(
              'Projects',
              searchLoading && projectsList.length === 0
            )}
          </InputLabel>
          <Select
            labelId="projects-label"
            multiple
            value={filters.projects}
            onChange={e =>
              handleFilterChange('projects', e.target.value as string[])
            }
            renderValue={(selected: string[]) => selected.join(', ')}
            label={renderLoadingLabel(
              'Projects',
              searchLoading && projectsList.length === 0
            )}
          >
            {projectsList.length > 0 ? (
              projectsList.map(opt => (
                <MenuItem key={opt} value={opt}>
                  <Checkbox checked={filters.projects.indexOf(opt) > -1} />
                  <ListItemText primary={opt} />
                </MenuItem>
              ))
            ) : (
              <MenuItem disabled>
                {searchLoading ? 'Loading projects...' : 'No projects found'}
              </MenuItem>
            )}
          </Select>
        </FormControl>

        <FormControl
          variant="outlined"
          fullWidth
          size="small"
          style={{ marginBottom: '12px' }}
        >
          <InputLabel id="type-label">Type</InputLabel>
          <Select
            labelId="type-label"
            multiple
            value={filters.type}
            onChange={e => handleTypeChange(e.target.value as string[])}
            renderValue={(selected: string[]) => selected.join(', ')}
            label="Type"
          >
            {['Table', 'View', 'Dataset'].map(opt => (
              <MenuItem key={opt} value={opt}>
                <Checkbox checked={filters.type.indexOf(opt) > -1} />
                <ListItemText primary={opt} />
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {filters.type.length > 0 && availableSubtypes.length > 0 && (
          <FormControl
            variant="outlined"
            fullWidth
            size="small"
            style={{ marginBottom: '12px' }}
          >
            <InputLabel id="subtype-label">Subtype</InputLabel>
            <Select
              labelId="subtype-label"
              multiple
              value={filters.subtype}
              onChange={e =>
                handleFilterChange('subtype', e.target.value as string[])
              }
              renderValue={(selected: string[]) => selected.join(', ')}
              label="Subtype"
            >
              {availableSubtypes.map(opt => (
                <MenuItem key={opt} value={opt}>
                  <Checkbox checked={filters.subtype.indexOf(opt) > -1} />
                  <ListItemText primary={opt} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}

        <div
          className="location-filter-container"
          style={{ position: 'relative' }}
        >
          <FormControl
            variant="outlined"
            fullWidth
            size="small"
            style={{ marginBottom: '12px' }}
          >
            <InputLabel id="locations-label">Locations</InputLabel>
            <Select
              labelId="locations-label"
              multiple
              value={filters.locations}
              onChange={e =>
                handleFilterChange('locations', e.target.value as string[])
              }
              renderValue={(selected: string[]) => selected.join(', ')}
              label="Locations"
              MenuProps={{
                PaperProps: {
                  style: {
                    maxHeight: 300
                  }
                }
              }}
            >
              {dataplexLocations.map(opt => (
                <MenuItem key={opt} value={opt}>
                  <Checkbox
                    checked={filters.locations.indexOf(opt) > -1}
                    size="small"
                  />
                  <ListItemText primary={opt} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </div>
        <FormControl
          variant="outlined"
          fullWidth
          size="small"
          style={{ marginBottom: '12px' }}
        >
          <InputLabel id="datasets-label">
            {renderLoadingLabel('Datasets', datasetsLoading)}
          </InputLabel>
          <Select
            labelId="datasets-label"
            multiple
            value={filters.datasets || []}
            onChange={e =>
              handleFilterChange('datasets', e.target.value as string[])
            }
            renderValue={(selected: string[]) =>
              selected
                .map(name =>
                  name.includes('/') ? name.split('/').pop() : name
                )
                .join(', ')
            }
            label="Datasets"
            MenuProps={{
              autoFocus: false,
              PaperProps: { style: { maxHeight: 400, width: 300 } }
            }}
            disabled={datasetsLoading}
          >
            {datasetsLoading ? (
              <MenuItem
                disabled
                style={{ justifyContent: 'center', gap: '10px' }}
              >
                <CircularProgress size={20} />
                <ListItemText primary="Fetching datasets..." />
              </MenuItem>
            ) : (
              [
                <li
                  key="search-field"
                  style={{
                    padding: '8px 16px',
                    position: 'sticky',
                    top: 0,
                    backgroundColor: 'var(--jp-layout-color1)',
                    zIndex: 1
                  }}
                >
                  <TextField
                    size="small"
                    autoFocus
                    placeholder="Search for dataset..."
                    fullWidth
                    value={datasetSearchTerm}
                    onChange={e => setDatasetSearchTerm(e.target.value)}
                    onKeyDown={e => e.stopPropagation()}
                  />
                </li>,
                ...(datasetSearchTerm.trim() === ''
                  ? [
                      <MenuItem key="placeholder" disabled>
                        <ListItemText secondary="Type to search datasets..." />
                      </MenuItem>
                    ]
                  : filteredDatasetOptions.length > 0
                  ? filteredDatasetOptions.map((name: string) => {
                      const displayName = name.includes('/')
                        ? name.split('/').pop()
                        : name;

                      return (
                        <MenuItem key={name} value={name}>
                          <Checkbox
                            checked={
                              (filters.datasets || []).indexOf(name) > -1
                            }
                          />
                          <ListItemText primary={displayName} />
                        </MenuItem>
                      );
                    })
                  : [
                      <MenuItem key="no-results" disabled>
                        No datasets found
                      </MenuItem>
                    ])
              ]
            )}
          </Select>
        </FormControl>
      </div>
      <div
        style={{
          flexGrow: 1,
          padding: '16px 32px 32px 32px',
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0
        }}
      >
        <div
          className="nl-query-bar"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: activeFilters.length > 0 ? '8px' : '16px'
          }}
        >
          <TextField
            fullWidth
            variant="outlined"
            size="small"
            placeholder="What dataset are you looking for?"
            value={initialQuery}
            onChange={e => {
              const newValue = e.target.value;
              onQueryChanged(newValue);
              if (newValue.trim() === '') {
                onSearchExecuted('', [], [], filters);
              }
            }}
            onKeyDown={e => {
              if (e.key === 'Enter') handleSearchClick();
            }}
            InputProps={{
              endAdornment: (
                <>
                  {initialQuery.trim() !== '' && (
                    <IconButton
                      onClick={() => {
                        onQueryChanged('');
                        onSearchExecuted('', [], [], filters);
                      }}
                      size="small"
                    >
                      <span
                        style={{
                          fontSize: '18px',
                          color: 'var(--jp-ui-font-color1)'
                        }}
                      >
                        &times;
                      </span>
                    </IconButton>
                  )}
                  <IconButton onClick={handleSearchClick}>
                    <Search style={{ color: 'var(--jp-ui-font-color1)' }} />
                  </IconButton>
                </>
              )
            }}
          />
        </div>

        {activeFilters.length > 0 && (
          <div
            className="active-filters-chips"
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '8px',
              marginBottom: '16px'
            }}
          >
            {activeFilters.map((filter, index) => (
              <Chip
                key={`${filter.name}-${filter.originalValue}-${index}`}
                label={`${filter.label}: ${filter.value}`}
                onDelete={() =>
                  handleClearChip(filter.name, filter.originalValue)
                }
                variant="outlined"
                size="small"
                sx={{
                  backgroundColor: 'var(--jp-layout-color2)',
                  borderColor: 'var(--jp-border-color2)',
                  color: 'var(--jp-ui-font-color1)',
                  '.MuiChip-deleteIcon': { color: 'var(--jp-ui-font-color1)' }
                }}
              />
            ))}
          </div>
        )}
        <div
          className="nl-search-results-container"
          style={{
            flexGrow: 1,
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0
          }}
        >
          <h2
            style={{
              fontSize: 20,
              fontWeight: 500,
              margin: '0 0 16px 0',
              color: 'var(--jp-ui-font-color0)'
            }}
          ></h2>

          {showFlatResults ? (
            <>
              {initialQuery.trim() !== '' && (
                <p
                  style={{
                    fontSize: 13,
                    color: 'var(--jp-ui-font-color2)',
                    margin: '0 0 12px 0'
                  }}
                >
                  Query: "{initialQuery}" ({totalResults} found)
                </p>
              )}
              {totalResults > 0 ? (
                <>
                  <div
                    className="nl-search-results-list"
                    style={{ flexGrow: 1, overflowY: 'auto' }}
                  >
                    <ul
                      style={{
                        listStyleType: 'none',
                        paddingLeft: 0,
                        margin: 0
                      }}
                    >
                      {paginatedResults.map(renderCard)}
                    </ul>
                  </div>
                  {totalPages > 1 && (
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'flex-end',
                        alignItems: 'center',
                        gap: '8px',
                        paddingTop: '8px',
                        borderTop: '1px solid var(--jp-border-color2)',
                        flexShrink: 0
                      }}
                    >
                      <span
                        style={{
                          fontSize: 13,
                          color: 'var(--jp-ui-font-color2)'
                        }}
                      >
                        Page {currentPage} of {totalPages}
                      </span>
                      <Button
                        onClick={handlePrevPage}
                        disabled={currentPage === 1}
                        size="small"
                        variant="outlined"
                      >
                        Previous
                      </Button>
                      <Button
                        onClick={handleNextPage}
                        disabled={currentPage === totalPages}
                        size="small"
                        variant="outlined"
                      >
                        Next
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <p style={{ color: 'var(--jp-ui-font-color2)' }}>
                  {/* CHANGED: Check if query is empty AND no filters are active */}
                  {initialQuery.trim() === '' && activeFilters.length === 0
                    ? 'Enter a query to find Dataplex assets.'
                    : 'No results found.'}
                </p>
              )}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export class DataplexSearchPanelWrapper extends ReactWidget {
  public initialQuery: string = '';
  public searchResults: ISearchResult[] = [];
  public searchLoading: boolean = false;

  public datasetsLoading: boolean = false;
  public resetDatasetsTrigger: number = 0;

  public projectsList: string[] = [];
  public allSearchResults: any[] = [];
  public datasetList: string[] = [];

  private _queryUpdated = new Signal<this, string>(this);
  currentFilters: any;
  get queryUpdated(): Signal<this, string> {
    return this._queryUpdated;
  }

  private _resultClicked = new Signal<this, ISearchResult>(this);
  get resultClicked(): Signal<this, ISearchResult> {
    return this._resultClicked;
  }

  private _searchExecuted = new Signal<
    this,
    {
      query: string;
      projects: string[];
      datasets: string[];
      filters: INLSearchFilters;
    }
  >(this);
  get searchExecuted() {
    return this._searchExecuted;
  }

  private _filtersChanged = new Signal<this, INLSearchFilters>(this);
  get filtersChanged() {
    return this._filtersChanged;
  }

  public updateState(
    query: string,
    results: ISearchResult[],
    loading: boolean,
    projects: string[],
    datasets: string[],
    allResults: any[],
    datasetsLoading?: boolean,
    resetTrigger?: number
  ): void {
    this.initialQuery = query;
    this.searchResults = results;
    this.searchLoading = loading;
    if (projects.length > 0) this.projectsList = projects;
    if (datasets.length > 0) this.datasetList = datasets;
    this.allSearchResults = allResults;

    if (datasetsLoading !== undefined) this.datasetsLoading = datasetsLoading;
    if (resetTrigger !== undefined) this.resetDatasetsTrigger = resetTrigger;

    this.update();
  }

  render(): JSX.Element {
    return (
      <DataplexSearchComponent
        initialQuery={this.initialQuery}
        results={this.searchResults}
        searchLoading={this.searchLoading}
        datasetsLoading={this.datasetsLoading}
        resetDatasetsTrigger={this.resetDatasetsTrigger}
        projectsList={this.projectsList}
        datasetList={this.datasetList}
        onQueryChanged={q => this._queryUpdated.emit(q)}
        onSearchExecuted={(q, p, d, f) =>
          this._searchExecuted.emit({
            query: q,
            projects: p,
            datasets: d,
            filters: f
          })
        }
        onFiltersChanged={f => this._filtersChanged.emit(f)}
        onResultClicked={r => this._resultClicked.emit(r)}
      />
    );
  }
}

export class DataplexSearchWidget extends Panel {
  app: JupyterLab;
  settingRegistry: ISettingRegistry;
  themeManager: IThemeManager;
  private searchWrapper: DataplexSearchPanelWrapper;
  private openedWidgets: Record<string, boolean> = {};
  private prevSelectedProjects: string[] = [];

  constructor(
    app: JupyterLab,
    settingRegistry: ISettingRegistry,
    themeManager: IThemeManager,
    initialSearchTerm: string = ''
  ) {
    super();
    this.app = app;
    this.settingRegistry = settingRegistry;
    this.themeManager = themeManager;
    this.title.label = 'NL Dataset Search';
    this.addClass('jp-DataplexSearchWidget');
    this.searchWrapper = new DataplexSearchPanelWrapper();
    this.searchWrapper.initialQuery = initialSearchTerm;
    this.addWidget(this.searchWrapper);
    this.node.style.height = '100%';
    this.node.style.minWidth = '800px';

    this.searchWrapper.node.style.height = '100%';
    this.searchWrapper.node.style.width = '100%';
    this.searchWrapper.queryUpdated.connect(this._onQueryUpdated, this);
    this.searchWrapper.searchExecuted.connect(this.onSearchExecuted, this);
    this.searchWrapper.resultClicked.connect(this.onResultClicked, this);

    this.searchWrapper.filtersChanged.connect(this._onFiltersChanged, this);

    this.searchWrapper.update();
    this.fetchProjectsList();
  }

  private async _onFiltersChanged(
    sender: DataplexSearchPanelWrapper,
    filters: INLSearchFilters
  ) {
    this.searchWrapper.currentFilters = filters;

    const currentProjects = filters.projects || [];
    const prevProjects = this.prevSelectedProjects;

    const projectsChanged =
      currentProjects.length !== prevProjects.length ||
      !currentProjects.every(p => prevProjects.includes(p));

    if (projectsChanged) {
      this.prevSelectedProjects = currentProjects;

      this.searchWrapper.updateState(
        this.searchWrapper.initialQuery,
        this.searchWrapper.searchResults,
        this.searchWrapper.searchLoading,
        this.searchWrapper.projectsList,
        [],
        this.searchWrapper.allSearchResults,
        true, // datasetsLoading = true
        Date.now() // resetDatasetsTrigger = new timestamp
      );
      const projectsToFetch =
        currentProjects.length > 0
          ? currentProjects
          : this.searchWrapper.projectsList;

      await this.fetchDatasetsForProjects(projectsToFetch);
    }
  }

  private _onQueryUpdated(sender: DataplexSearchPanelWrapper, query: string) {
    this.searchWrapper.initialQuery = query;
    this.searchWrapper.update();
  }

  private async fetchProjectsList() {
    this.searchWrapper.updateState(
      this.searchWrapper.initialQuery,
      [],
      true,
      [],
      [],
      []
    );
    try {
      let projectNames: string[] = [];
      await BigQueryService.getBigQueryProjectsListAPIService(
        (data: string[]) => (projectNames = data),
        val => (this.searchWrapper.searchLoading = val),
        err => console.error(err),
        (name: any) => {}
      );
      this.searchWrapper.updateState(
        this.searchWrapper.initialQuery,
        [],
        false,
        projectNames,
        [],
        []
      );

      if (projectNames.length > 0) {
        await this.fetchDatasetsForProjects(projectNames);
      }
    } catch (e) {
      this.searchWrapper.updateState(
        this.searchWrapper.initialQuery,
        [],
        false,
        [],
        [],
        []
      );
    }
  }
  private allDatasetsByProject: Record<string, string[]> = {};

  private async fetchDatasetsForProjects(projectIds: string[]) {
    try {
      const datasetPromises = projectIds.map(async projectId => {
        let projectDatasets: any[] = [];
        const handleFinalDatasetList = (finalDatasets: any[]) => {
          projectDatasets = finalDatasets;
        };

        await BigQueryService.getBigQueryDatasetsAPIServiceNew(
          this.settingRegistry,
          () => {},
          () => {},
          projectId,
          () => {},
          () => {},
          () => {},
          [],
          handleFinalDatasetList,
          undefined,
          () => {}
        );

        const fullDatasetNames = projectDatasets
          .map(ds => {
            let shortId = ds.datasetReference?.datasetId;

            if (!shortId && ds.name) {
              const parts = ds.name.split('/');
              shortId = parts[parts.length - 1];
            }

            if (!shortId && ds.id) {
              shortId = ds.id.split(':').pop();
            }

            return shortId ? `${projectId}/${shortId}` : null;
          })
          .filter(Boolean) as string[];

        this.allDatasetsByProject[projectId] = fullDatasetNames;
        return projectDatasets;
      });

      await Promise.all(datasetPromises);

      this.refreshDatasetDropdown();

      this.searchWrapper.datasetsLoading = false;
      this.searchWrapper.update();
    } catch (error) {
      console.error('Error fetching datasets for projects:', error);
      this.searchWrapper.datasetsLoading = false;
      this.searchWrapper.update();
    }
  }

  private refreshDatasetDropdown() {
    const currentFilters = this.searchWrapper.currentFilters;
    const activeProjects = currentFilters?.projects || [];
    let displayList: string[] = [];

    if (activeProjects.length > 0) {
      activeProjects.forEach((pId: string | number) => {
        if (this.allDatasetsByProject[pId]) {
          displayList.push(...this.allDatasetsByProject[pId]);
        }
      });
    } else {
      displayList = Object.values(this.allDatasetsByProject).flat();
    }

    this.searchWrapper.updateState(
      this.searchWrapper.initialQuery,
      this.searchWrapper.searchResults,
      false,
      this.searchWrapper.projectsList,
      Array.from(new Set(displayList)),
      this.searchWrapper.allSearchResults
    );
  }

  private processSearchResults(
    combinedRawResults: { project: string; result: any }[]
  ): ISearchResult[] {
    const flatResults: ISearchResult[] = [];
    combinedRawResults.forEach(projectResult => {
      const results = projectResult.result?.results || [];
      results.forEach((searchData: any) => {
        const entry = searchData.dataplexEntry;
        if (entry && entry.fullyQualifiedName) {
          const cleanFqn = entry.fullyQualifiedName.replace(':', '.');
          const parts = cleanFqn.split('.');

          let projectId: string | undefined;
          let datasetId: string | undefined;
          let tableId: string | null = null;

          // If standard "project.dataset.table" or "project.dataset"
          if (parts.length >= 2) {
            // If part[0] is 'bigquery' or 'dataplex', shift.
            const startIdx =
              parts[0] === 'bigquery' || parts[0] === 'dataplex' ? 1 : 0;

            if (parts.length > startIdx + 1) {
              projectId = parts[startIdx];
              datasetId = parts[startIdx + 1];
              if (parts.length > startIdx + 2) {
                tableId = parts[startIdx + 2];
              }
            }
          }

          const entryTypeId = entry.entryType?.split('/').pop() || '';

          let label:
            | 'Bigquery / Dataset'
            | 'Bigquery / Table'
            | 'Bigquery / View'
            | undefined;

          switch (entryTypeId) {
            case 'bigquery-table':
              label = 'Bigquery / Table';
              break;
            case 'bigquery-dataset':
              label = 'Bigquery / Dataset';
              break;
            case 'bigquery-view':
              label = 'Bigquery / View';
              break;
            default:
              label = undefined;
          }

          flatResults.push({
            name: entry.displayName || tableId || datasetId || 'Unknown',
            description:
              entry.description ||
              (tableId
                ? `Resource in ${datasetId}`
                : `Dataset in ${projectId}`),
            label: label,
            system: entry.system,
            location: entry.location,
            assetType: entry.entryType,
            projectId,
            datasetId,
            tableId
          });
        }
      });
    });
    return flatResults;
  }

  private async onSearchExecuted(
    sender: DataplexSearchPanelWrapper,
    args: { query: string; projects: string[]; filters: INLSearchFilters }
  ) {
    const { query, filters } = args;
    let finalQueryParts: string[] = [];

    // 1. Handle User Text Query
    if (query.trim() !== '') {
      finalQueryParts.push(query.trim());
    }

    // 2. Handle Logic ONLY if Subtypes are present
    // We only form the manual 'type' query string if the user picked a subtype.
    if (filters.subtype && filters.subtype.length > 0) {
      const subtypeConditions: string[] = [];

      // --- TABLE SUBTYPES ---
      if (filters.type.includes('Table')) {
        const tableSubParts: string[] = [];
        if (filters.subtype.includes('External Table'))
          tableSubParts.push(
            'dataplex-types.global.bigquery-table.type=EXTERNAL_TABLE'
          );
        if (filters.subtype.includes('Biglake table'))
          tableSubParts.push(
            'dataplex-types.global.bigquery-table.type=BIGLAKE_TABLE'
          );
        if (filters.subtype.includes('Biglake object table'))
          tableSubParts.push(
            'dataplex-types.global.bigquery-table.type=BIGLAKE_OBJECT_TABLE'
          );
        if (filters.subtype.includes('Table'))
          tableSubParts.push('dataplex-types.global.bigquery-table.type=TABLE');

        if (tableSubParts.length > 0) {
          subtypeConditions.push(
            `(type=projects/dataplex-types/locations/global/entryTypes/bigquery-table AND (${tableSubParts.join(
              ' OR '
            )}))`
          );
        }
      }

      // --- VIEW SUBTYPES ---
      if (filters.type.includes('View')) {
        const viewSubParts: string[] = [];
        if (filters.subtype.includes('Materialized view'))
          viewSubParts.push(
            'dataplex-types.global.bigquery-view.type=MATERIALIZED_VIEW'
          );
        if (filters.subtype.includes('Authorized view'))
          viewSubParts.push(
            'dataplex-types.global.bigquery-view.type=AUTHORIZED_VIEW'
          );
        if (filters.subtype.includes('View'))
          viewSubParts.push('dataplex-types.global.bigquery-view.type=VIEW');

        if (viewSubParts.length > 0) {
          subtypeConditions.push(
            `(type=projects/dataplex-types/locations/global/entryTypes/bigquery-view AND (${viewSubParts.join(
              ' OR '
            )}))`
          );
        }
      }

      // --- DATASET SUBTYPES ---
      if (filters.type.includes('Dataset')) {
        const dsSubParts: string[] = [];
        if (filters.subtype.includes('Default'))
          dsSubParts.push(
            'dataplex-types.global.bigquery-dataset.type=DEFAULT'
          );
        if (filters.subtype.includes('Linked'))
          dsSubParts.push('dataplex-types.global.bigquery-dataset.type=LINKED');

        if (dsSubParts.length > 0) {
          subtypeConditions.push(
            `(type=projects/dataplex-types/locations/global/entryTypes/bigquery-dataset AND (${dsSubParts.join(
              ' OR '
            )}))`
          );
        }
      }

      if (subtypeConditions.length > 0) {
        finalQueryParts.push(`(${subtypeConditions.join(' OR ')})`);
      }
    }

    // 3. Always enforce BigQuery context and Exclusions
    // finalQueryParts.push('-has=dataplex-types.global.bigquery-row-access-policy');
    // finalQueryParts.push('-has=dataplex-types.global.bigquery-data-policy');

    // 4. Handle Parent (Dataset) paths
    if (filters.datasets && filters.datasets.length > 0) {
      // const location = filters.locations.length > 0 ? filters.locations[0] : 'us';
      const datasetPaths = filters.datasets
        .map(dsString => {
          const parts = dsString.split('/');
          return parts.length >= 2
            ? `projects/${parts[0]}/locations/${location}/entryGroups/@bigquery/entries/bigquery.googleapis.com/projects/${parts[0]}/datasets/${parts[1]}`
            : null;
        })
        .filter(Boolean);

      if (datasetPaths.length > 0) {
        finalQueryParts.push(`parent=(${datasetPaths.join('|')})`);
      }
    }

    const finalQuery = finalQueryParts.join(' AND ');

    this.searchWrapper.updateState(
      query,
      [],
      true,
      this.searchWrapper.projectsList,
      this.searchWrapper.datasetList,
      []
    );

    try {
      let searchResult: any = null;
      const scope = filters.scope && filters.scope.includes('Current Project');

      // IMPORTANT: We pass the UI 'filters.type' back to the service here.
      // If subtype is empty, the service uses this standard 'type' array to filter.
      // If subtype is present, our 'finalQuery' handles the heavy lifting.
      await BigQueryService.getBigQuerySemanticSearchAPIService(
        finalQuery,
        [],
        filters.projects,
        filters.type, // Pass the original Type array for standard BQ filtering
        filters.locations,
        scope,
        val => {},
        (data: any) => (searchResult = data)
      );

      const flatResults = this.processSearchResults([
        { project: filters.projects[0], result: searchResult }
      ]);

      this.searchWrapper.updateState(
        query,
        flatResults,
        false,
        this.searchWrapper.projectsList,
        this.searchWrapper.datasetList,
        searchResult ? [searchResult] : []
      );
    } catch (error) {
      console.error('Search execution failed', error);
      this.searchWrapper.updateState(
        query,
        [],
        false,
        this.searchWrapper.projectsList,
        this.searchWrapper.datasetList,
        []
      );
    }
  }

  private onResultClicked(
    sender: DataplexSearchPanelWrapper,
    result: ISearchResult
  ): void {
    const { projectId, datasetId, tableId, name } = result;

    if (!projectId || !datasetId) {
      console.error('Missing IDs in search result:', result);
      return;
    }

    const widgetTitle = name;
    if (this.openedWidgets[widgetTitle]) {
      this.app.shell.activateById(widgetTitle);
      return;
    }

    const content = tableId
      ? new BigQueryTableWrapper(
          tableId,
          datasetId,
          projectId,
          this.themeManager
        )
      : new BigQueryDatasetWrapper(datasetId, projectId, this.themeManager);

    const widget = new MainAreaWidget<any>({ content });
    widget.id = widgetTitle;
    widget.title.label = widgetTitle;
    widget.title.closable = true;
    widget.title.icon = tableId ? iconTable : iconDatasets;

    this.app.shell.add(widget, 'main');
    this.openedWidgets[widgetTitle] = true;
    widget.disposed.connect(() => delete this.openedWidgets[widgetTitle]);
  }
}
