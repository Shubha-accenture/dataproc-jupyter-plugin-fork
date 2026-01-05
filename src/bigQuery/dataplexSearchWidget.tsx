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
  Menu,
  Checkbox,
  ListItemText,
  Chip
} from '@mui/material';
import { Search } from '@mui/icons-material';
import { LabIcon } from '@jupyterlab/ui-components';
import { v4 as uuidv4 } from 'uuid';
import { auto } from '@popperjs/core';
import { Tree, NodeRendererProps, NodeApi } from 'react-arborist';

import bigQueryProjectIcon from '../../style/icons/bigquery_project_icon.svg';
import tableIcon from '../../style/icons/table_icon.svg';
import columnsIcon from '../../style/icons/columns_icon.svg';
import databaseWidgetIcon from '../../style/icons/database_widget_icon.svg';
import datasetsIcon from '../../style/icons/datasets_icon.svg';
import searchIcon from '../../style/icons/search_icon_dark.svg';
import rightArrowIcon from '../../style/icons/right_arrow_icon.svg';
import downArrowIcon from '../../style/icons/down_arrow_icon.svg';
import datasetExplorerIcon from '../../style/icons/dataset_explorer_icon.svg';
import { BigQueryService } from './bigQueryService';
import { TitleComponent } from '../controls/SidePanelTitleWidget';
import { DataprocWidget } from '../controls/DataprocWidget';
import { checkConfig, handleDebounce } from '../utils/utils';
import LoginErrorComponent from '../utils/loginErrorComponent';
import { BIGQUERY_API_URL } from '../utils/const';
import { BigQueryDatasetWrapper } from './bigQueryDatasetInfoWrapper';
import { BigQueryTableWrapper } from './bigQueryTableInfoWrapper';
// import { BigQueryRegionDropdown } from '../controls/BigQueryRegionDropdown';

const iconDatasets = new LabIcon({
  name: 'launcher:datasets-icon',
  svgstr: datasetsIcon
});
const iconDatabaseWidget = new LabIcon({
  name: 'launcher:databse-widget-icon',
  svgstr: databaseWidgetIcon
});
const iconDatasetExplorer = new LabIcon({
  name: 'launcher:dataset-explorer-icon',
  svgstr: datasetExplorerIcon
});
const iconRightArrow = new LabIcon({
  name: 'launcher:right-arrow-icon',
  svgstr: rightArrowIcon
});
const iconDownArrow = new LabIcon({
  name: 'launcher:down-arrow-icon',
  svgstr: downArrowIcon
});
const iconBigQueryProject = new LabIcon({
  name: 'launcher:bigquery-project-icon',
  svgstr: bigQueryProjectIcon
});
const iconTable = new LabIcon({
  name: 'launcher:table-icon',
  svgstr: tableIcon
});
const iconColumns = new LabIcon({
  name: 'launcher:columns-icon',
  svgstr: columnsIcon
});
const iconSearch = new LabIcon({
  name: 'launcher:search-icon',
  svgstr: searchIcon
});

const SUBTYPE_MAPPING: Record<string, string[]> = {
  Dataset: ['Default', 'Linked'],
  Table: ['Biglake table', 'Biglake object table', 'External Table', 'Table'],
  View: ['View', 'Materialized view', 'Authorized view']
};

export const DATAPLEX_LOCATIONS = [
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
  // annotations: string[]; //check to remove
}

export interface ISearchResult {
  name: string;
  description?: string;
  label?: string;
  system?: string;
  location?: string;
  assetType?: string; //check to remove
}

const initialFilterState: INLSearchFilters = {
  scope: ['Current Organization'],
  systems: [],
  projects: [],
  type: [],
  subtype: [],
  locations: [],
  datasets: []
  // annotations: []
};

interface IDataplexSearchComponentProps {
  initialQuery: string;
  searchLoading: boolean;
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

    // If query is empty, just reset the UI locally instead of hitting the backend
    if (initialQuery.trim() === '') {
      onQueryChanged('');
      // Manually trigger a "reset" state instead of a search
      onSearchExecuted('', [], [], initialFilterState);
    } else {
      // If there IS a query, re-run that query with no filters
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
    }[] = [];

    const filterLabels: Record<keyof INLSearchFilters, string> = {
      scope: 'Scope',
      projects: 'Project',
      systems: 'System',
      type: 'Type',
      subtype: 'Subtype',
      locations: 'Locations',
      datasets: 'Datasets'
      // annotations: 'Annotation'
    };

    (Object.keys(filters) as (keyof INLSearchFilters)[]).forEach(key => {
      if (filters[key].length > 0) {
        filters[key].forEach(value => {
          // Logic: Only add the chip if it's NOT the default 'Current Organization'
          if (key === 'scope' && value === 'Current Organization') {
            return;
          }

          active.push({
            name: key,
            label: filterLabels[key] || key,
            value: value
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

  // const handleLocationUpdate = (newRegion: string) => {
  //   handleFilterChange('locations', newRegion ? [newRegion] : []);
  // };

  const handleTypeChange = (selectedTypes: string[]) => {
    setFilters(prev => {
      const validSubtypes = selectedTypes.flatMap(
        t => SUBTYPE_MAPPING[t] || []
      );
      const newSubtype = prev.subtype.filter(s => validSubtypes.includes(s));

      return {
        ...prev,
        type: selectedTypes,
        subtype: newSubtype
      };
    });
  };

  const availableSubtypes = useMemo(() => {
    const options = filters.type.flatMap(t => SUBTYPE_MAPPING[t] || []);
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
          disabled={filters.scope.includes('Current Project')}
        >
          <InputLabel id="projects-label">Projects</InputLabel>
          <Select
            labelId="projects-label"
            multiple
            value={filters.projects}
            onChange={e =>
              handleFilterChange('projects', e.target.value as string[])
            }
            renderValue={(selected: string[]) => selected.join(', ')}
            label="Projects"
          >
            {projectsList.map(opt => (
              <MenuItem key={opt} value={opt}>
                <Checkbox checked={filters.projects.indexOf(opt) > -1} />
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
              // Optional: Add MenuProps to prevent the long list from overflowing the screen
              MenuProps={{
                PaperProps: {
                  style: {
                    maxHeight: 300
                  }
                }
              }}
            >
              {DATAPLEX_LOCATIONS.map(opt => (
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
          <InputLabel id="datasets-label">Datasets</InputLabel>
          <Select
            labelId="datasets-label"
            multiple
            value={filters.datasets || []}
            onChange={e =>
              handleFilterChange('datasets', e.target.value as string[])
            }
            renderValue={(selected: string[]) => selected.join(', ')}
            label="Datasets"
            MenuProps={{
              PaperProps: {
                style: {
                  maxHeight: 400, // Limits height to 400px
                  width: 300 // Limits width
                }
              }
            }}
          >
            {Array.isArray(datasetList) &&
              datasetList.map((name: any) => (
                <MenuItem key={name} value={name}>
                  <Checkbox
                    checked={(filters.datasets || []).indexOf(name) > -1}
                  />
                  <ListItemText primary={name} />
                </MenuItem>
              ))}
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
                key={`${filter.name}-${filter.value}-${index}`}
                label={`${filter.label}: ${filter.value}`}
                onDelete={() => handleClearChip(filter.name, filter.value)}
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
          >
            {/* {initialQuery.trim() === '' ? 'Dataset Search' : 'Search Results'} */}
          </h2>

          {searchLoading ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                color: 'var(--jp-ui-font-color2)'
              }}
            >
              <CircularProgress size={16} />
              <span>Searching...</span>
            </div>
          ) : showFlatResults ? (
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
                  {initialQuery.trim() === ''
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

class DataplexSearchPanelWrapper extends ReactWidget {
  public initialQuery: string = '';
  public searchResults: ISearchResult[] = [];
  public searchLoading: boolean = false;
  public projectsList: string[] = [];
  public allSearchResults: any[] = [];
  public datasetList: string[] = [];

  private _queryUpdated = new Signal<this, string>(this);
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
    allResults: any[]
  ): void {
    this.initialQuery = query;
    this.searchResults = results;
    this.searchLoading = loading;
    if (projects.length > 0) this.projectsList = projects;
    if (datasets.length > 0) this.datasetList = datasets;
    this.allSearchResults = allResults;
    this.update();
  }

  render(): JSX.Element {
    return (
      <DataplexSearchComponent
        initialQuery={this.initialQuery}
        results={this.searchResults}
        searchLoading={this.searchLoading}
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
    this.searchWrapper.searchExecuted.connect(this._onSearchExecuted, this);
    this.searchWrapper.resultClicked.connect(this._onResultClicked, this);
    this.searchWrapper.update();
    this.fetchProjectsList();
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
      // const setProjectNameInfo = (data: string[]) => {
      //   projectNames = data;
      // };
      // const setIsLoading = (value: boolean) => {
      //   this.searchWrapper.searchLoading = value;
      // };
      // const setApiError = (value: boolean) => {
      //   console.error('API Error in fetching projects:', value);
      // };

      // const setProjectName = (name: string) => {};
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
      console.log('DataplexSearch: BigQuery Projects List:', projectNames);

      // this.searchWrapper.updateState(
      //   this.searchWrapper.initialQuery,
      //   this.searchWrapper.searchResults,
      //   false, // Set loading to false
      //   projectNames,
      //   this.searchWrapper.allSearchResults
      // );

      if (projectNames.length > 0) {
        // const initialFilters =
        //   this.searchWrapper.initialQuery.trim() === ''
        //     ? initialFilterState
        //     : undefined;
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

  private async fetchDatasetsForProjects(projectIds: string[]) {
    const allDatasetsByProject: any = {};

    try {
      const datasetPromises = projectIds.map(async projectId => {
        let projectDatasets: any[] = [];

        // Create a callback to capture the datasets for this specific project
        const handleFinalDatasetList = (finalDatasets: any[]) => {
          projectDatasets = finalDatasets;
        };

        await BigQueryService.getBigQueryDatasetsAPIServiceNew(
          this.settingRegistry,
          () => {}, // setDatabaseNames
          () => {}, // setDataSetResponse
          projectId,
          () => {}, // setIsIconLoading
          () => {}, // setIsLoading
          () => {}, // setIsLoadMoreLoading
          [],
          handleFinalDatasetList, // <--- This will capture the data
          undefined,
          () => {} // handleNextPageTokens
        );

        allDatasetsByProject[projectId] = projectDatasets;
        return projectDatasets;
      });

      const results = await Promise.all(datasetPromises);

      // Flatten the results: Extract just the dataset names/IDs for the dropdown
      // Based on BigQuery API, this is usually .datasetReference.datasetId
      const flatDatasetNames = results
        .flat()
        .map(ds => ds.datasetReference?.datasetId || ds.id || ds.name)
        .filter(Boolean);

      console.log('Processed Dataset Names for Dropdown:', flatDatasetNames);

      // CRITICAL: Update the state so the React component re-renders
      this.searchWrapper.updateState(
        this.searchWrapper.initialQuery,
        this.searchWrapper.searchResults,
        false,
        this.searchWrapper.projectsList,
        flatDatasetNames, // <--- Pass the new list here
        this.searchWrapper.allSearchResults
      );
    } catch (error) {
      console.error('Error fetching datasets for projects:', error);
      this.searchWrapper.searchLoading = false;
      this.searchWrapper.update();
    }
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
          const fqnParts = entry.fullyQualifiedName.split(':');
          const tableParts = fqnParts.length > 1 ? fqnParts[1].split('.') : [];
          if (tableParts.length < 2) return;

          const projectId = tableParts[0];
          const datasetId = tableParts[1];
          const tableId = tableParts.length > 2 ? tableParts[2] : null;

          // Extract the ID from the end of the entryType URI
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
            name: entry.displayName || tableId || datasetId,
            description:
              entry.description ||
              (tableId
                ? `Resource in ${datasetId}`
                : `Dataset in ${projectId}`),
            label: label,
            system: entry.system,
            location: entry.location,
            assetType: entry.entryType
          });
        }
      });
    });
    return flatResults;
  }

  private async _onSearchExecuted(
    sender: DataplexSearchPanelWrapper,
    args: { query: string; projects: string[]; filters: INLSearchFilters }
  ) {
    const { query, filters } = args;
    const hasActiveFilters =
      filters.systems.length > 0 ||
      filters.projects.length > 0 ||
      filters.type.length > 0 ||
      filters.locations.length > 0;

    if (query.trim() === '' && !hasActiveFilters) {
      // Reset to initial state without calling the backend
      this.searchWrapper.updateState(
        '',
        [], // This ensures totalResults is 0
        false,
        this.searchWrapper.projectsList,
        this.searchWrapper.datasetList,
        []
      );
      return;
    }
    const projectsToSearch =
      filters.projects.length > 0
        ? filters.projects
        : this.searchWrapper.projectsList;

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
      await BigQueryService.getBigQuerySemanticSearchAPIService(
        query || 'datasets',
        filters.systems,
        projectsToSearch,
        filters.type,
        filters.locations,
        val => {},
        (data: any) => (searchResult = data)
      );

      const flatResults = this.processSearchResults([
        { project: projectsToSearch[0], result: searchResult }
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

  private parseResultDetails(result: ISearchResult): {
    projectId: string | null;
    datasetId: string | null;
    tableId: string | null;
  } {
    const name = result.name;
    const rawResults = this.searchWrapper.allSearchResults;

    // 1. Search the raw results cache for the specific entry
    if (Array.isArray(rawResults)) {
      for (const projectResult of rawResults) {
        const items = projectResult.result?.results || [];
        for (const item of items) {
          const entry = item.dataplexEntry;
          if (
            entry &&
            (entry.displayName === name ||
              entry.fullyQualifiedName?.includes(name))
          ) {
            // Normalize FQN: convert colons to dots and split
            const parts = entry.fullyQualifiedName.replace(':', '.').split('.');

            // Logic: BigQuery FQNs are usually project.dataset.table
            if (parts.length >= 2) {
              const isTable = result.label?.includes('Table');
              return {
                projectId: parts[0],
                datasetId: parts[1],
                tableId: isTable ? parts[2] || name : null
              };
            }
          }
        }
      }
    }

    // 2. Fallback: Parse from the description string you built in processSearchResults
    // Format was: "Table in {datasetId} (Project: {projectId})"
    const description = result.description || '';
    const projectMatch = description.match(/Project: ([^)]+)/);

    // If we can't find the project in the string, use the first project in the list
    const fallbackProject = projectMatch
      ? projectMatch[1]
      : this.searchWrapper.projectsList[0];

    return {
      projectId: fallbackProject,
      datasetId: result.label?.includes('Table')
        ? description.split(' ')[2]
        : name,
      tableId: result.label?.includes('Table') ? name : null
    };
  }

  private _onResultClicked(
    sender: DataplexSearchPanelWrapper,
    result: ISearchResult
  ): void {
    const { projectId, datasetId, tableId } = this.parseResultDetails(result);

    if (!projectId || !datasetId) {
      console.error('Missing IDs:', { projectId, datasetId, tableId });
      return;
    }

    const widgetTitle = result.name;
    if (this.openedWidgets[widgetTitle]) {
      this.app.shell.activateById(widgetTitle);
      return;
    }

    // Create content based on type
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
    // Use iconTable for tables, iconDatasets for datasets
    widget.title.icon = tableId ? iconTable : iconDatasets;

    this.app.shell.add(widget, 'main');
    this.openedWidgets[widgetTitle] = true;
    widget.disposed.connect(() => delete this.openedWidgets[widgetTitle]);
  }
}

const calculateDepth = (node: NodeApi): number => {
  let depth = 0;
  let currentNode = node;
  while (currentNode.parent) {
    depth++;
    currentNode = currentNode.parent;
  }
  return depth;
};

interface IDataEntry {
  id: string;
  name: string;
  type: string;
  isLoadMoreNode?: boolean;
  isNodeOpen: boolean;
  description: string;
  children: any;
}

const BigQueryComponent = ({
  app,
  settingRegistry,
  themeManager
}: {
  app: JupyterLab;
  settingRegistry: ISettingRegistry;
  themeManager: IThemeManager;
}): JSX.Element => {
  const [projectNameInfo, setProjectNameInfo] = useState<string[]>([]);
  const [notebookValue, setNotebookValue] = useState<string>('');
  const [dataprocMetastoreServices, setDataprocMetastoreServices] =
    useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadMoreLoading, setIsLoadMoreLoading] = useState(false);
  const [isResetLoading, setResetLoading] = useState(false);
  const [databaseNames, setDatabaseNames] = useState<string[]>([]);

  const [dataSetResponse, setDataSetResponse] = useState<any>();
  const [tableResponse, setTableResponse] = useState<any>();
  const [schemaResponse, setSchemaResponse] = useState<any>();

  const [treeStructureData, setTreeStructureData] = useState<any>([]);

  const [currentNode, setCurrentNode] = useState<any>();
  const [isIconLoading, setIsIconLoading] = useState(false);

  const [apiError, setApiError] = useState(false);

  const [height, setHeight] = useState(window.innerHeight - 125);
  const [loggedIn, setLoggedIn] = useState(false);
  const [configError, setConfigError] = useState(false);
  const [loginError, setLoginError] = useState(false);
  const [projectName, setProjectName] = useState<string>('');

  const [nextPageTokens, setNextPageTokens] = useState<
    Map<string, string | null>
  >(new Map());
  const [allDatasets, setAllDatasets] = useState<Map<string, any[]>>(new Map());
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  console.log(isSearchOpen);

  function handleUpdateHeight() {
    let updateHeight = window.innerHeight - 125;
    setHeight(updateHeight);
  }

  const debouncedHandleUpdateHeight = handleDebounce(handleUpdateHeight, 500);

  useEffect(() => {
    window.addEventListener('resize', debouncedHandleUpdateHeight);

    return () => {
      window.removeEventListener('resize', debouncedHandleUpdateHeight);
    };
  }, []);

  const getBigQueryColumnDetails = async (
    tableId: string,
    datasetId: string,
    projectId: string | undefined
  ) => {
    if (tableId && datasetId && projectId) {
      await BigQueryService.getBigQueryColumnDetailsAPIService(
        datasetId,
        tableId,
        projectId,
        setIsIconLoading,
        setSchemaResponse
      );
    }
  };

  const treeStructureforProjects = () => {
    const data = projectNameInfo.map(projectName => ({
      id: uuidv4(),
      name: projectName,
      children: [],
      isNodeOpen: false
    }));

    data.sort((a, b) => a.name.localeCompare(b.name));

    setTreeStructureData(data);
  };

  const treeStructureforDatasets = () => {
    let tempData = [...treeStructureData];

    tempData.forEach((projectData: any) => {
      if (projectData.name === currentNode.data.name) {
        const datasetNodes = databaseNames.map(datasetName => ({
          id: uuidv4(),
          name: datasetName,
          isLoadMoreNode: false,
          isNodeOpen: false,
          children: []
        }));
        datasetNodes.sort((a, b) => a.name.localeCompare(b.name));

        const nextPageToken = nextPageTokens.get(projectData.name);
        if (nextPageToken) {
          datasetNodes.push({
            id: uuidv4(),
            name: '',
            isLoadMoreNode: true,
            isNodeOpen: false,
            children: []
          });
        }
        projectData['children'] = datasetNodes;
      }
    });

    tempData.sort((a, b) => a.name.localeCompare(b.name));

    setTreeStructureData(tempData);
  };

  const treeStructureforTables = () => {
    let tempData = [...treeStructureData];

    tempData.forEach((projectData: any) => {
      if (projectData.name === currentNode.parent.data.name) {
        projectData.children.forEach((dataset: any) => {
          if (tableResponse.length > 0 && tableResponse[0].tableReference) {
            if (dataset.name === tableResponse[0].tableReference.datasetId) {
              dataset['children'] = tableResponse.map((tableDetails: any) => ({
                id: uuidv4(),
                name: tableDetails.tableReference.tableId,
                children: [],
                isNodeOpen: false
              }));
            }
          } else {
            if (dataset.name === tableResponse) {
              dataset['children'] = false;
            }
          }
        });
      }
    });

    setTreeStructureData(tempData);
  };

  const treeStructureforSchema = () => {
    let tempData = [...treeStructureData];

    tempData.forEach((projectData: any) => {
      if (projectData.name === currentNode.parent.parent.data.name) {
        projectData.children.forEach((dataset: any) => {
          if (dataset.name === schemaResponse.tableReference.datasetId) {
            dataset.children.forEach((table: any) => {
              if (table.name === schemaResponse.tableReference.tableId) {
                if (schemaResponse.schema?.fields) {
                  table['children'] = schemaResponse.schema?.fields.map(
                    (column: any) => ({
                      id: uuidv4(),
                      name: column.name,
                      type: column.type,
                      mode: column.mode,
                      key: column.key,
                      collation: column.collation,
                      defaultValue: column.defaultValue,
                      policyTags: column.policyTags,
                      dataPolicies: column.dataPolicies,
                      tableDescription: column.tableDescription,
                      description: column.description
                    })
                  );
                } else {
                  table['children'] = false;
                }
              }
            });
          }
        });
      }
    });
    setTreeStructureData(tempData);
  };

  const handleOpenSearch = () => {
    setIsSearchOpen(true);
    const content = new DataplexSearchWidget(
      app,
      settingRegistry,
      themeManager
    );
    const widget = new MainAreaWidget<DataplexSearchWidget>({ content });
    widget.title.label = 'Dataset Search';
    widget.title.icon = iconDatasetExplorer;
    widget.title.closable = true;

    app.shell.add(widget, 'main');
  };

  const openedWidgets: Record<string, boolean> = {};
  const handleNodeClick = (node: NodeApi) => {
    const depth = calculateDepth(node);
    const widgetTitle = node.data.name;
    if (!openedWidgets[widgetTitle]) {
      if (depth === 2) {
        const content = new BigQueryDatasetWrapper(
          node.data.name,
          node?.parent?.data?.name,
          themeManager
        );
        const widget = new MainAreaWidget<BigQueryDatasetWrapper>({ content });
        const widgetId = 'node-widget-db';
        widget.id = widgetId;
        widget.title.label = node.data.name;
        widget.title.closable = true;
        widget.title.icon = iconDatabaseWidget;
        app.shell.add(widget, 'main');
        widget.disposed.connect(() => {
          const widgetTitle = widget.title.label;
          delete openedWidgets[widgetTitle];
        });
      } else if (depth === 3 && node.parent && node.parent.parent) {
        const database = node.parent.data.name;
        const projectId = node.parent.parent.data.name;

        const content = new BigQueryTableWrapper(
          node.data.name,
          database,
          projectId,
          themeManager
        );
        const widget = new MainAreaWidget<BigQueryTableWrapper>({ content });
        const widgetId = `node-widget-${uuidv4()}`;
        widget.id = widgetId;
        widget.title.label = node.data.name;
        widget.title.closable = true;
        widget.title.icon = iconDatasets;
        app.shell.add(widget, 'main');
        widget.disposed.connect(() => {
          const widgetTitle = widget.title.label;
          delete openedWidgets[widgetTitle];
        });
      }
      openedWidgets[widgetTitle] = node.data.name;
    }
  };

  type NodeProps = NodeRendererProps<IDataEntry> & {
    onClick: (node: NodeRendererProps<IDataEntry>['node']) => void;
    nextPageTokens: Map<string, string | null>;
    getBigQueryDatasets: (projectId: string) => Promise<void>;
  };
  const Node = ({
    node,
    style,
    onClick,
    nextPageTokens,
    getBigQueryDatasets
  }: NodeProps) => {
    const [contextMenu, setContextMenu] = useState<{
      mouseX: number;
      mouseY: number;
    } | null>(null);
    const handleToggle = () => {
      if (node.data.isLoadMoreNode) {
        const projectId = node.parent?.data?.name;
        const nextPageToken = projectId
          ? nextPageTokens.get(projectId)
          : undefined;
        if (projectId && nextPageToken) {
          setCurrentNode(node.parent);
          setIsLoadMoreLoading(true);
          getBigQueryDatasets(projectId);
        }
        return;
      }
      if (calculateDepth(node) === 1 && !node.isOpen) {
        setCurrentNode(node);
        if (!allDatasets.has(node.data.name)) {
          setIsIconLoading(true);
          getBigQueryDatasets(node.data.name);
        } else {
          node.toggle();
        }
      } else if (calculateDepth(node) === 2 && !node.isOpen) {
        setCurrentNode(node);
        setIsIconLoading(true);
        getBigQueryTables(node.data.name, node.parent?.data?.name);
      } else if (calculateDepth(node) === 3 && node.parent && !node.isOpen) {
        setCurrentNode(node);
        setIsIconLoading(true);
        getBigQueryColumnDetails(
          node.data.name,
          node.parent?.data?.name,
          node?.parent?.parent?.data?.name
        );
      } else {
        node.toggle();
      }
    };
    const handleIconClick = (event: React.MouseEvent) => {
      if (node.isOpen !== node.data.isNodeOpen) {
        node.toggle();
      }
      if (event.currentTarget.classList.contains('caret-icon')) {
        node.data.isNodeOpen = !node.data.isNodeOpen;
        handleToggle();
      }
    };
    const handleTextClick = (event: React.MouseEvent) => {
      event.stopPropagation();
      onClick(node);
    };

    const handleContextMenu = (event: React.MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();

      const depth = calculateDepth(node);
      if (depth === 3) {
        setContextMenu(
          contextMenu === null
            ? {
                mouseX: event.clientX + 2,
                mouseY: event.clientY - 6
              }
            : null
        );
      }
    };

    const handleClose = () => {
      setContextMenu(null);
    };

    const handleCopyId = () => {
      const projectName = node.parent?.parent?.data.name;
      const datasetName = node.parent?.data.name;
      const tableName = node.data.name;
      const fullTableName = `${projectName}.${datasetName}.${tableName}`;
      navigator.clipboard.writeText(fullTableName);
      handleClose();
    };

    const handleOpenTableDetails = () => {
      onClick(node);
      handleClose();
    };

    /**
     * Creates a new notebook with BigQuery code to query the specified table
     * Uses JupyterLab commands API for reliability
     */
    const createBigQueryNotebookWithQuery = async (
      app: JupyterLab,
      fullTableName: string
    ) => {
      try {
        const notebookPanel = await app.commands.execute(
          'notebook:create-new',
          {
            kernelName: 'python3'
          }
        );

        await new Promise(resolve => setTimeout(resolve, 300));

        app.shell.activateById(notebookPanel.id);

        await app.commands.execute('notebook:replace-selection', {
          text: '#Uncomment if bigquery-magics is not installed \n#!pip install bigquery-magics\n%load_ext bigquery_magics'
        });

        await app.commands.execute('notebook:run-cell-and-insert-below');
        await app.commands.execute('notebook:replace-selection', {
          text: `%%bqsql\nselect * from ${fullTableName} limit 20`
        });
      } catch (error) {
        console.error('Error creating notebook:', error);
      }

      handleClose();
    };

    const handleQueryTable = async () => {
      const projectId = node.parent?.parent?.data.name;
      const datasetId = node.parent?.data.name;
      const tableId = node.data.name;
      const fullTableName = `\`${projectId}.${datasetId}.${tableId}\``;

      await createBigQueryNotebookWithQuery(app, fullTableName);
    };

    const depth = calculateDepth(node);
    const renderNodeIcon = () => {
      const hasChildren =
        (node.children && node.children.length > 0) ||
        (depth !== 4 && node.children);
      hasChildren && !node.data.isLoadMoreNode ? (
        isIconLoading && currentNode.data.name === node.data.name ? (
          <div className="big-query-loader-style">
            <CircularProgress
              size={16}
              aria-label="Loading Spinner"
              data-testid="loader"
            />
          </div>
        ) : node.isOpen ? (
          <>
            <div
              role="treeitem"
              className="caret-icon right"
              onClick={handleIconClick}
            >
              <iconDownArrow.react
                tag="div"
                className="icon-white logo-alignment-style"
              />
            </div>
          </>
        ) : (
          <div
            role="treeitem"
            className="caret-icon down"
            onClick={handleIconClick}
          >
            <iconRightArrow.react
              tag="div"
              className="icon-white logo-alignment-style"
            />
          </div>
        )
      ) : (
        <div style={{ width: '29px' }}></div>
      );
      const renderLoadMoreNode = () =>
        isLoadMoreLoading ? (
          <div className="load-more-spinner-container">
            <div className="load-more-spinner">
              <CircularProgress
                className="spin-loader-custom-style"
                size={20}
                aria-label="Loading Spinner"
                data-testid="loader"
              />
            </div>
            Loading datasets
          </div>
        ) : (
          <div
            role="treeitem"
            className="caret-icon down load-more-icon"
            onClick={handleToggle}
          >
            Load More...
          </div>
        );

      {
        const arrowIcon =
          hasChildren && !node.data.isLoadMoreNode ? (
            isIconLoading && currentNode.data.name === node.data.name ? (
              <div className="big-query-loader-style">
                <CircularProgress
                  size={16}
                  aria-label="Loading Spinner"
                  data-testid="loader"
                />
              </div>
            ) : node.data.isNodeOpen ? (
              <>
                <div
                  role="treeitem"
                  className="caret-icon down"
                  onClick={handleIconClick}
                >
                  <iconDownArrow.react
                    tag="div"
                    className="icon-white logo-alignment-style"
                  />
                </div>
              </>
            ) : (
              <div
                role="treeitem"
                className="caret-icon right"
                onClick={handleIconClick}
              >
                <iconRightArrow.react
                  tag="div"
                  className="icon-white logo-alignment-style"
                />
              </div>
            )
          ) : (
            <div style={{ width: '29px' }}></div>
          );

        if (node.data.isLoadMoreNode) {
          return renderLoadMoreNode();
        }
        if (depth === 1) {
          return (
            <>
              {arrowIcon}
              <div role="img" className="db-icon" onClick={handleIconClick}>
                <iconBigQueryProject.react
                  tag="div"
                  className="icon-white logo-alignment-style"
                />
              </div>
            </>
          );
        } else if (depth === 2) {
          return (
            <>
              {arrowIcon}
              <div role="img" className="db-icon" onClick={handleIconClick}>
                <iconDatasets.react
                  tag="div"
                  className="icon-white logo-alignment-style"
                />
              </div>
            </>
          );
        } else if (depth === 3) {
          return (
            <>
              {arrowIcon}
              <div role="img" className="table-icon" onClick={handleIconClick}>
                <iconTable.react
                  tag="div"
                  className="icon-white logo-alignment-style"
                />
              </div>
            </>
          );
        }

        return (
          <>
            <iconColumns.react
              tag="div"
              className="icon-white logo-alignment-style"
            />
          </>
        );
      }
    };

    return (
      <>
        <div style={style}>
          {renderNodeIcon()}
          <div
            role="treeitem"
            title={node.data.name}
            onClick={handleTextClick}
            onContextMenu={handleContextMenu}
          >
            {node.data.name}
          </div>
          <div title={node?.data?.type} className="dpms-column-type-text">
            {node.data.type}
          </div>

          <Menu
            open={contextMenu !== null}
            onClose={handleClose}
            anchorReference="anchorPosition"
            anchorPosition={
              contextMenu !== null
                ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
                : undefined
            }
          >
            <MenuItem onClick={handleQueryTable}>Query table</MenuItem>
            <MenuItem onClick={handleOpenTableDetails}>
              Open table details
            </MenuItem>
            <MenuItem onClick={handleCopyId}>Copy table ID</MenuItem>
          </Menu>
        </div>
      </>
    );
  };

  const getBigQueryProjects = async (isReset: boolean) => {
    if (isReset) {
      setAllDatasets(new Map());
      setNextPageTokens(new Map());
      setResetLoading(true);
    }
    await BigQueryService.getBigQueryProjectsListAPIService(
      setProjectNameInfo,
      setIsLoading,
      setApiError,
      setProjectName
    );
  };

  const getBigQueryDatasets = async (projectId: string) => {
    const pageTokenForProject = nextPageTokens.get(projectId);
    const allDatasetsUnderProject = allDatasets.get(projectId) || [];

    await BigQueryService.getBigQueryDatasetsAPIService(
      notebookValue,
      settingRegistry,
      setDatabaseNames,
      setDataSetResponse,
      projectId,
      setIsIconLoading,
      setIsLoading,
      setIsLoadMoreLoading,
      allDatasetsUnderProject,
      (value: any[]) => {
        setAllDatasets(prev => {
          const newMap = new Map(prev);
          newMap.set(projectId, value);
          return newMap;
        });
      },
      pageTokenForProject,
      (projectId: string, token: string | null) => {
        setNextPageTokens(prevTokens => {
          const newMap = new Map(prevTokens);
          if (token) {
            newMap.set(projectId, token);
          } else {
            newMap.delete(projectId);
          }
          return newMap;
        });
      }
    );
  };

  const getBigQueryTables = async (
    datasetId: string,
    projectId: string | undefined
  ) => {
    if (datasetId && projectId) {
      await BigQueryService.getBigQueryTableAPIService(
        notebookValue,
        datasetId,
        setDatabaseNames,
        setTableResponse,
        projectId,
        setIsIconLoading
      );
    }
  };

  const getActiveNotebook = () => {
    setNotebookValue('bigframes');
    setDataprocMetastoreServices('bigframes');
  };

  useEffect(() => {
    checkConfig(setLoggedIn, setConfigError, setLoginError);
    setLoggedIn(!loginError && !configError);
    if (loggedIn) {
      setIsLoading(false);
    }
  }, []);
  useEffect(() => {
    getActiveNotebook();
    return () => {
      setNotebookValue('');
    };
  }, [notebookValue]);

  useEffect(() => {
    getBigQueryProjects(false);
  }, [dataprocMetastoreServices]);

  useEffect(() => {
    if (projectNameInfo.length > 0) {
      treeStructureforProjects();
    }
  }, [projectNameInfo]);

  useEffect(() => {
    if (dataSetResponse) {
      treeStructureforDatasets();
    }
  }, [dataSetResponse]);

  useEffect(() => {
    if (tableResponse) {
      treeStructureforTables();
    }
  }, [tableResponse]);

  useEffect(() => {
    if (schemaResponse) {
      treeStructureforSchema();
    }
  }, [schemaResponse]);

  useEffect(() => {
    if (treeStructureData.length > 0 && treeStructureData[0].name !== '') {
      setIsLoading(false);
      setResetLoading(false);
      setIsLoadMoreLoading(false);
    }
    if (currentNode && !currentNode.isOpen) {
      currentNode?.toggle();
    }
  }, [treeStructureData]);

  return (
    <div className="dpms-Wrapper">
      <TitleComponent
        titleStr="Dataset Explorer"
        isPreview={false}
        getBigQueryProjects={() => getBigQueryProjects(true)}
        isLoading={isResetLoading}
      />
      <div>
        <div>
          {isLoading ? (
            <div className="database-loader">
              <div>
                <CircularProgress
                  className="spin-loader-custom-style"
                  size={20}
                  aria-label="Loading Spinner"
                  data-testid="loader"
                />
              </div>
              Loading datasets
            </div>
          ) : (
            <div>
              {!loginError && !configError && !apiError && (
                <div>
                  <div className="search-button">
                    <button
                      onClick={handleOpenSearch}
                      aria-label="Open Dataplex Natural Language Search"
                      className="dataplex-search-button"
                    >
                      <span className="button-content">
                        {/* Icon component */}
                        <iconSearch.react
                          tag="div"
                          className="icon-white logo-alignment-style button-icon"
                        />
                        {/* Search Text */}
                        <span className="button-text">Search</span>
                      </span>
                    </button>
                  </div>
                  <div className="tree-container">
                    {treeStructureData.length > 0 &&
                      treeStructureData[0].name !== '' && (
                        <>
                          <Tree
                            className="dataset-tree"
                            data={treeStructureData}
                            indent={24}
                            width={auto}
                            height={height}
                            rowHeight={36}
                            overscanCount={1}
                            paddingTop={30}
                            paddingBottom={10}
                            padding={25}
                            idAccessor={(node: any) => node.id}
                          >
                            {(props: NodeRendererProps<any>) => (
                              <Node
                                {...props}
                                onClick={handleNodeClick}
                                nextPageTokens={nextPageTokens}
                                getBigQueryDatasets={getBigQueryDatasets}
                              />
                            )}
                          </Tree>
                        </>
                      )}
                  </div>
                </div>
              )}
            </div>
          )}
          {apiError && !loginError && !configError && (
            <div className="sidepanel-login-error">
              <p>
                Bigquery API is not enabled for this project. Please{' '}
                <a
                  href={`${BIGQUERY_API_URL}?project=${projectName}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link-class"
                >
                  enable
                </a>
                <span> it. </span>
              </p>
            </div>
          )}
          {(loginError || configError) && (
            <div className="sidepanel-login-error">
              <LoginErrorComponent
                setLoginError={setLoginError}
                loginError={loginError}
                configError={configError}
                setConfigError={setConfigError}
                app={app}
                fromPage="sidepanel"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export class BigQueryWidget extends DataprocWidget {
  app: JupyterLab;
  settingRegistry: ISettingRegistry;
  enableBigqueryIntegration: boolean;

  constructor(
    app: JupyterLab,
    settingRegistry: ISettingRegistry,
    enableBigqueryIntegration: boolean,
    themeManager: IThemeManager
  ) {
    super(themeManager);
    this.app = app;
    this.settingRegistry = settingRegistry;
    this.enableBigqueryIntegration = enableBigqueryIntegration;
  }

  renderInternal(): JSX.Element {
    return (
      <BigQueryComponent
        app={this.app}
        settingRegistry={this.settingRegistry}
        themeManager={this.themeManager}
      />
    );
  }
}
