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
  // --- ADDED IMPORTS FOR MULTI-SELECT/CHIPS ---
  Checkbox,
  ListItemText,
  Chip 
  // --- END ADDED IMPORTS ---
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

// --- MODIFIED INTERFACE FOR MULTI-SELECT ---
export interface INLSearchFilters {
  scope: string[];
  systems: string[];
  projects: string[];
  type: string[];
  subtype: string[];
  locations: string[];
  annotations: string[];
}

// --- MODIFIED INTERFACE FOR FILTERING METADATA ---
export interface ISearchResult {
  name: string;
  description?: string;
  label?: 'Bigquery / Dataset' | 'Bigquery / Table';
  system?: string;     // Added for Systems filter
  location?: string;   // Added for Locations filter
  assetType?: string;  // Added for Type filter (e.g., 'Table', 'View')
}

const initialFilterState: INLSearchFilters = {
  scope: [],
  systems: [],
  projects: [],
  type: [],
  subtype: [],
  locations: [],
  annotations: []
};
// --- END MODIFIED INTERFACES ---

interface IDataplexSearchComponentProps {
  initialQuery: string;
  searchLoading: boolean;
  results?: ISearchResult[];
  projectsList: string[];
  onQueryChanged: (query: string) => void;
  onSearchExecuted: (query: string, projects: string[]) => void;
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
  onResultClicked
}) => {
  const [filters, setFilters] = useState<INLSearchFilters>(initialFilterState);
  const [currentPage, setCurrentPage] = useState(1);

  // 1. Notify Lumino parent whenever filters change
  useEffect(() => {
    onFiltersChanged(filters);
  }, [filters, onFiltersChanged]);

  useEffect(() => {
    setCurrentPage(1);
  }, [results]);

  // Updated handler for multi-select (expects array of strings)
  const handleFilterChange = useCallback(
    (name: keyof INLSearchFilters, value: string[]) => {
      setFilters(prev => ({ ...prev, [name]: value }));
    },
    []
  );

  const handleClearFilters = useCallback(() => {
    setFilters(initialFilterState);
    onSearchExecuted(initialQuery.trim(), []); 
  }, [initialQuery, onSearchExecuted]);

  // Remove a single chip/filter value
  const handleClearChip = useCallback((filterName: keyof INLSearchFilters, valueToRemove: string) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: prev[filterName].filter(v => v !== valueToRemove)
    }));
  }, []);

  // Aggregate active filters for chip display
  const activeFilters = useMemo(() => {
    const active: { name: keyof INLSearchFilters, label: string, value: string }[] = [];
    
    const filterLabels: Record<keyof INLSearchFilters, string> = {
      projects: 'Project',
      scope: 'Scope',
      systems: 'System',
      type: 'Type',
      subtype: 'Subtype',
      locations: 'Location',
      annotations: 'Annotation'
    };
    
    (Object.keys(filters) as (keyof INLSearchFilters)[]).forEach(key => {
      if (filters[key].length > 0) {
        filters[key].forEach(value => {
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
    // Pass the array of selected projects to the search execution
    onSearchExecuted(initialQuery.trim(), filters.projects);
  };

  // MODIFIED renderDropdown for Multi-Select with Checkboxes
  const renderDropdown = (
    name: keyof INLSearchFilters,
    label: string,
    options: string[]
  ) => (
    <FormControl
      key={name}
      variant="outlined"
      fullWidth
      size="small"
      style={{ marginBottom: '12px' }}
    >
      <InputLabel id={`${name}-label`}>{label}</InputLabel>
      <Select
        labelId={`${name}-label`}
        multiple // Enables multi-select
        value={filters[name]} // Expects an array of strings
        onChange={e => handleFilterChange(name, e.target.value as string[])}
        renderValue={(selected: string[]) => selected.join(', ')} 
        label={label}
        sx={{
          '.MuiOutlinedInput-notchedOutline': {
            borderColor: 'var(--jp-border-color1)'
          }
        }}
      >
        {options.map(opt => (
          <MenuItem key={opt} value={opt}>
            {/* Checkbox for visual multi-select */}
            <Checkbox checked={filters[name].indexOf(opt) > -1} />
            <ListItemText primary={opt} />
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );

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

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        height: '100%',
        width: '100%'
      }}
    >
      {' '}
      {/* --- FILTER SIDEBAR --- */}
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
        {/* DROPDOWN LIST */}
        {/* MODIFIED: Scope options updated */}
        {renderDropdown('scope', 'Scope', [
          'Current organization',
          'Current project',
          'Starred'
        ])}
        {renderDropdown('systems', 'Systems', [
          'BigQuery',
          'Dataplex',
          'Cloud Storage'
        ])}
        {renderDropdown('projects', 'Projects', projectsList)}{' '}
        {renderDropdown('type', 'Type', [
          'Table',
          'View',
          'External Table',
          'Data Stream'
        ])}
        {renderDropdown('locations', 'Locations', [
          'US-Central1',
          'Europe-West4',
          'Global'
        ])}
        {renderDropdown('annotations', 'Annotations', [
          'Confidential',
          'Public',
          'PII'
        ])}
      </div>
      {/* --- END FILTER SIDEBAR --- */}

      {/* --- SEARCH RESULTS AREA --- */}
      <div
        style={{
          flexGrow: 1,
          padding: '16px 32px 32px 32px',
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0
        }}
      >
        {/* Search Bar */}
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
              console.log('DataplexSearch: Query String Changed:', newValue);
              onQueryChanged(newValue);

              if (newValue.trim() === '') {
                onSearchExecuted('', filters.projects); 
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
                        onSearchExecuted('', filters.projects);
                      }}
                      size="small"
                      aria-label="Clear search"
                    >
                      <span
                        style={{
                          fontSize: '18px',
                          color: 'var(--jp-ui-font-color1)',
                          lineHeight: 1
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

        {/* --- ACTIVE FILTER CHIPS --- */}
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
                  '.MuiChip-deleteIcon': {
                    color: 'var(--jp-ui-font-color1)'
                  }
                }}
              />
            ))}
          </div>
        )}
        {/* --- END ACTIVE FILTER CHIPS --- */}

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
            {initialQuery.trim() === '' ? 'Dataset Search' : 'Search Results'}
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
              ) : initialQuery.trim() === '' ? (
                <p style={{ color: 'var(--jp-ui-font-color2)' }}>
                  Enter a query in the search bar above to find Dataplex assets
                  (tables, views, etc.).
                </p>
              ) : (
                <p style={{ color: 'var(--jp-ui-font-color2)' }}>
                  No results found for your query. Try adjusting your filters or
                  search term.
                </p>
              )}
            </>
          ) : null}
        </div>
      </div>
      {/* --- END SEARCH RESULTS AREA --- */}
    </div>
  );
};

// -----------------------------------------------------------------------------
// --- LUMINO WRAPPER AND WIDGET CLASSES (DataplexSearchPanelWrapper) ---
// -----------------------------------------------------------------------------

class DataplexSearchPanelWrapper extends ReactWidget {
  public initialQuery: string = '';
  public searchResults: ISearchResult[] = [];
  public searchLoading: boolean = false;

  public projectsList: string[] = [];
  public allSearchResults: { [key: string]: any[] } | any[] = [];

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
    { query: string; projects: string[] }
  >(this);
  get searchExecuted(): Signal<this, { query: string; projects: string[] }> {
    return this._searchExecuted;
  }
  private _filtersChanged = new Signal<this, INLSearchFilters>(this);
  get filtersChanged(): Signal<this, INLSearchFilters> {
    return this._filtersChanged;
  }

  public updateState(
    query: string,
    results: ISearchResult[],
    loading: boolean,
    projects: string[],
    allResults: { [key: string]: any[] } | any[]
  ): void {
    this.initialQuery = query;
    this.searchResults = results;
    this.searchLoading = loading;
    this.projectsList = projects;
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
        onQueryChanged={q => this._queryUpdated.emit(q)}
        onSearchExecuted={(q, p) =>
          this._searchExecuted.emit({ query: q, projects: p })
        }
        onFiltersChanged={f => this._filtersChanged.emit(f)}
        onResultClicked={r => this._resultClicked.emit(r)}
      />
    );
  }
}

// -----------------------------------------------------------------------------
// --- DATAPLEX SEARCH WIDGET (Main Logic Container) ---
// -----------------------------------------------------------------------------

export class DataplexSearchWidget extends Panel {
  app: JupyterLab;
  settingRegistry: ISettingRegistry;
  themeManager: IThemeManager;
  private searchWrapper: DataplexSearchPanelWrapper;
  private openedWidgets: Record<string, boolean> = {};
  
  // Store current filters from React component
  private currentFilters: INLSearchFilters = initialFilterState;

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
    // Connect filter change signal
    this.searchWrapper.filtersChanged.connect(this._onFiltersChanged, this);

    this.searchWrapper.update();
    this.fetchProjectsList();
  }
  
  // Filter change handler
  private _onFiltersChanged(
    sender: DataplexSearchPanelWrapper,
    filters: INLSearchFilters
  ): void {
    this.currentFilters = filters;
  }

  private _onQueryUpdated(
    sender: DataplexSearchPanelWrapper,
    query: string
  ): void {
    this.searchWrapper.initialQuery = query;
    this.searchWrapper.update();
  }

  private async fetchProjectsList() {
    this.searchWrapper.updateState(
      this.searchWrapper.initialQuery,
      [],
      true,
      [],
      []
    );
    try {
      let projectNames: string[] = [];
      const setProjectNameInfo = (data: string[]) => {
        projectNames = data;
      };
      const setIsLoading = (value: boolean) => {
        this.searchWrapper.searchLoading = value;
      };
      const setApiError = (value: boolean) => {
        console.error('API Error in fetching projects:', value);
      };

      const setProjectName = (name: string) => {};

      await BigQueryService.getBigQueryProjectsListAPIService(
        setProjectNameInfo,
        setIsLoading,
        setApiError,
        setProjectName
      );

      console.log('DataplexSearch: BigQuery Projects List:', projectNames);

      this.searchWrapper.updateState(
        this.searchWrapper.initialQuery,
        this.searchWrapper.searchResults,
        false, // Set loading to false
        projectNames,
        this.searchWrapper.allSearchResults
      );

      if (projectNames.length > 0) {
        await this.fetchDatasetsForProjects(projectNames);
      }
    } catch (error) {
      console.error('Error fetching BigQuery projects list:', error);
      this.searchWrapper.updateState(
        this.searchWrapper.initialQuery,
        [],
        false,
        [],
        []
      );
    }
  }

  private async fetchDatasetsForProjects(projectIds: string[]) {
    const currentQuery = this.searchWrapper.initialQuery;
    const currentProjects = this.searchWrapper.projectsList;

    this.searchWrapper.updateState(
      currentQuery,
      this.searchWrapper.searchResults,
      true,
      currentProjects,
      this.searchWrapper.allSearchResults
    );

    let allResults: ISearchResult[] = [];
    const allDatasetsByProject: { [key: string]: any[] } = {};

    try {
      const datasetPromises = projectIds.map(async projectId => {
        let projectDatasets: any[] = [];

        const setDatabaseNames = (data: any[]) => {
          /* N/A in this scope */
        };
        const setDataSetResponse = (data: any) => {
          /* N/A in this scope */
        };
        const setIsIconLoading = (value: boolean) => {
          /* N/A in this scope */
        };
        const setIsLoading = (value: boolean) => {
          /* N/A in this scope */
        };
        const setIsLoadMoreLoading = (value: boolean) => {
          /* N/A in this scope */
        };

        const handleFinalDatasetList = (finalDatasets: any[]) => {
          projectDatasets = finalDatasets;
        };

        const handleNextPageTokens = (
          projectId: string,
          token: string | null
        ) => {
          /* N/A in this scope */
        };

        await BigQueryService.getBigQueryDatasetsAPIServiceNew(
          this.settingRegistry,
          setDatabaseNames,
          setDataSetResponse,
          projectId,
          setIsIconLoading,
          setIsLoading,
          setIsLoadMoreLoading,
          [],
          handleFinalDatasetList,
          undefined,
          handleNextPageTokens
        );

        allDatasetsByProject[projectId] = projectDatasets;

        projectDatasets.forEach(dataset => {
          let name: string | undefined;
          let description: string | undefined;
          
          // --- FIX: Initialize system/location/assetType for filtering ---
          let system: string = 'BigQuery'; // Default system
          let location: string | undefined;
          let assetType: string = 'Dataset'; // Initial fetch is only for Datasets

          if (dataset.entrySource) {
            const entrySource = dataset.entrySource;
            const explicitDescription = entrySource.description;
            location = entrySource.location;
            system = entrySource.system || 'Dataplex'; 
            
            name = entrySource.displayName;

            description = explicitDescription
              ? explicitDescription
              : location
              ? `${projectId} > ${location}`
              : `Project: ${projectId}`;
              
          } else if (dataset.datasetReference) {
            const datasetRef = dataset.datasetReference;
            location = dataset.location; // Location is available here
            system = 'BigQuery'; 

            name = datasetRef.datasetId;

            description = location
              ? `${projectId} > ${location}`
              : `Project: ${projectId}`;
          }

          if (name) {
            allResults.push({
              name: name,
              description: description,
              label: 'Bigquery / Dataset',
              system: system,     
              location: location,   
              assetType: assetType 
            });
          }
        });
      });

      await Promise.all(datasetPromises);

      console.log(
        'DataplexSearch: All Datasets by Project ID:',
        allDatasetsByProject
      );

      this.searchWrapper.updateState(
        currentQuery,
        allResults,
        false,
        currentProjects,
        allDatasetsByProject
      );
    } catch (error) {
      console.error('Error fetching datasets for projects:', error);
      this.searchWrapper.updateState(
        currentQuery,
        [],
        false,
        currentProjects,
        []
      );
    }
  }
  /**
   * Transforms raw search results from the BigQuery Search API into the flat ISearchResult[] format,
   * extracting metadata needed for filtering.
   * @param combinedRawResults Array of raw results, grouped by project.
   * @returns A flat array of ISearchResult objects suitable for the UI.
   */
  private processSearchResults(
    combinedRawResults: { project: string; result: any }[]
  ): ISearchResult[] {
    const flatResults: ISearchResult[] = [];

    combinedRawResults.forEach(projectResult => {
      const results = projectResult.result?.results || [];

      results.forEach((searchData: any) => {
        const dataplexEntry = searchData.dataplexEntry;

        if (dataplexEntry && dataplexEntry.fullyQualifiedName) {
          const fqn = dataplexEntry.fullyQualifiedName;
          const fqnParts = fqn.split(':');
          const tableParts = fqnParts.length > 1 ? fqnParts[1].split('.') : [];

          if (tableParts.length < 2) return;

          const projectId = tableParts[0];
          const datasetId = tableParts[1];
          const tableId = tableParts.length > 2 ? tableParts[2] : null;

          const name = dataplexEntry.displayName || tableId || datasetId;

          let description = dataplexEntry.description;
          if (!description) {
            description = tableId
              ? `Table in ${datasetId} (Project: ${projectId})`
              : `Dataset (Project: ${projectId})`;
          }

          const label = tableId ? 'Bigquery / Table' : 'Bigquery / Dataset';
          
          // --- DATA EXTRACTION FOR FILTERS ---
          const system = dataplexEntry.system; 
          const location = dataplexEntry.location;
          const assetType = dataplexEntry.type; 
          // --- END DATA EXTRACTION ---

          if (name) {
            flatResults.push({
              name: name,
              description: description,
              label: label,
              // --- ADD FILTER FIELDS ---
              system: system,
              location: location,
              assetType: assetType 
              // --- END ADD FILTER FIELDS ---
            } as ISearchResult);
          }
        }
      });
    });

    return flatResults;
  }

  // --- MODIFIED _onSearchExecuted WITH FILTERING ---
  private async _onSearchExecuted(
    sender: DataplexSearchPanelWrapper,
    args: { query: string; projects: string[] }
  ) {
    const { query, projects } = args;
    const currentFilters = this.currentFilters; 
    const isActive = (arr: string[]) => arr.length > 0;

    if (query.trim() === '') {
      console.log(
        'DataplexSearch: Empty query executed. Reloading initial datasets.'
      );
      this.searchWrapper.updateState(
        query,
        [],
        true,
        args.projects,
        this.searchWrapper.allSearchResults
      );

      const projectsToFetch = args.projects.length > 0 ? args.projects : this.searchWrapper.projectsList;

      if (projectsToFetch.length > 0) {
        // Fetch and update the searchWrapper state internally
        await this.fetchDatasetsForProjects(projectsToFetch);
        
        // --- FIX: Filter the results of fetchDatasetsForProjects ---
        let filteredInitialResults = this.searchWrapper.searchResults;
        
        // 1. Filter by Systems
        if (isActive(currentFilters.systems)) {
            filteredInitialResults = filteredInitialResults.filter(result => 
                result.system && currentFilters.systems.includes(result.system)
            );
        }
        
        // 2. Filter by Type (uses assetType which is 'Dataset' for initial fetch)
        if (isActive(currentFilters.type)) {
            filteredInitialResults = filteredInitialResults.filter(result => 
                result.assetType && currentFilters.type.includes(result.assetType)
            );
        }

        // 3. Filter by Locations
        if (isActive(currentFilters.locations)) {
            filteredInitialResults = filteredInitialResults.filter(result => 
                result.location && currentFilters.locations.includes(result.location)
            );
        }
        
        // Update state with the final filtered initial list
        this.searchWrapper.updateState(
            query,
            filteredInitialResults, 
            false,
            args.projects,
            this.searchWrapper.allSearchResults
        );

      } else {
        await this.fetchProjectsList();
      }
      return;
    }
    
    // If query is NOT empty:
    if (query.length < 3) {
      console.warn(
        'DataplexSearch: Search term must be at least 3 characters.'
      );
      this.searchWrapper.updateState(query, [], false, projects, []);
      return;
    }

    this.searchWrapper.updateState(query, [], true, projects, []);

    const projectsToSearch = projects.length > 0 ? projects : this.searchWrapper.projectsList;

    try {
      const searchPromises = projectsToSearch.map(async projectName => {
        let searchResult: any = null;
        const setSearchLoading = (value: boolean) => { /* handled by global state */ };
        const setSearchResponse = (data: any) => {
          searchResult = data;
        };

        await BigQueryService.getBigQuerySearchAPIService(
          query,
          setSearchLoading,
          setSearchResponse
        );

        if (searchResult) {
          return { project: projectName, result: searchResult };
        }
        return null;
      });

      const combinedRawResults = (await Promise.all(searchPromises)).filter(
        (result): result is { project: string; result: any } => result !== null
      );

      const flatResults = this.processSearchResults(combinedRawResults);

      // --- FILTERING LOGIC FOR SEARCH RESULTS ---
      let filteredResults = flatResults;
      
      // 1. Filter by Systems
      if (isActive(currentFilters.systems)) {
        filteredResults = filteredResults.filter(result => 
          result.system && currentFilters.systems.includes(result.system)
        );
      }
      
      // 2. Filter by Type (uses assetType)
      if (isActive(currentFilters.type)) {
        filteredResults = filteredResults.filter(result => 
          result.assetType && currentFilters.type.includes(result.assetType)
        );
      }

      // 3. Filter by Locations
      if (isActive(currentFilters.locations)) {
        filteredResults = filteredResults.filter(result => 
          result.location && currentFilters.locations.includes(result.location)
        );
      }
      
      console.log('DataplexSearch: Final Filtered Results:', filteredResults);
      // --- END FILTERING LOGIC ---

      this.searchWrapper.updateState(
        query,
        filteredResults, 
        false,
        args.projects,
        combinedRawResults
      );

    } catch (error) {
      console.error('DataplexSearch: Error during BigQuery search:', error);
      this.searchWrapper.updateState(query, [], false, projects, []);
    }
  }
  // --- END MODIFIED _onSearchExecuted ---

  /**
   * Utility to parse the project/dataset/table IDs from the name/description
   * This logic primarily relies on re-parsing the Full Qualified Name (FQN)
   * stored in the raw search results (allSearchResults) to ensure accuracy.
   */

  private parseResultDetails(result: ISearchResult): {
    projectId: string | null;
    datasetId: string | null;
    tableId: string | null;
  } {
    const name = result.name;
    const rawResults = this.searchWrapper.allSearchResults;

    if (Array.isArray(rawResults)) {
      for (const projectResult of rawResults) {
        if (projectResult.result && projectResult.result.results) {
          for (const searchData of projectResult.result.results) {
            const fqn = searchData.dataplexEntry?.fullyQualifiedName;
            const displayName =
              searchData.dataplexEntry?.displayName ||
              searchData.dataplexEntry?.name;

            if (fqn && (displayName === name || fqn.endsWith(name))) {
              const fqnParts = fqn.split(':');
              const tableParts =
                fqnParts.length > 1 ? fqnParts[1].split('.') : [];

              if (tableParts.length >= 2) {
                const projectId = tableParts[0];
                const datasetId = tableParts[1];
                const tableId = tableParts.length > 2 ? tableParts[2] : null;

                if (name === datasetId) {
                  return { projectId, datasetId, tableId: null };
                }

                return { projectId, datasetId, tableId };
              }
            }
          }
        }
      }
    }

    // 2. FALLBACK PARSING: Use description for public datasets (e.g., 'bigquery-public-data > US')
    const description = result.description || '';
    const descParts = description.split(' > ');

    if (descParts.length >= 1) {
      const projectIdFromDesc = descParts[0].replace('Project: ', '').trim();

      return {
        projectId: projectIdFromDesc,
        datasetId: name,
        tableId: null
      };
    }

    console.warn(
      'DataplexSearch: Failed to parse IDs using known patterns for result:',
      result
    );
    return { projectId: null, datasetId: null, tableId: null };
  }

  private _onResultClicked(
    sender: DataplexSearchPanelWrapper,
    result: ISearchResult
  ): void {
    const { projectId, datasetId, tableId } = this.parseResultDetails(result);
    const widgetTitle = result.name;

    if (!projectId || !datasetId) {
      console.error(
        'DataplexSearch: Cannot open widget. Could not reliably determine Project ID or Dataset ID for result:',
        result
      );
      return;
    }

    if (this.openedWidgets[widgetTitle]) {
      this.app.shell.activateById(widgetTitle);
      return;
    }

    let content: BigQueryDatasetWrapper | BigQueryTableWrapper;
    let icon: LabIcon;

    if (tableId) {
      content = new BigQueryTableWrapper(
        tableId,
        datasetId,
        projectId,
        this.themeManager
      );
      icon = iconDatasets;
    } else {
      content = new BigQueryDatasetWrapper(
        datasetId,
        projectId,
        this.themeManager
      );
      icon = iconDatabaseWidget;
    }

    const widget = new MainAreaWidget<any>({ content });
    widget.id = widgetTitle; // Using name as ID for deduplication
    widget.title.label = widgetTitle;
    widget.title.closable = true;
    widget.title.icon = icon;

    this.app.shell.add(widget, 'main');
    this.openedWidgets[widgetTitle] = true;

    // Remove from cache when disposed
    widget.disposed.connect(() => {
      delete this.openedWidgets[widgetTitle];
    });
  }
}

// -----------------------------------------------------------------------------
// --- BIGQUERY COMPONENT AND WIDGET (Remains the same as reference) ---
// -----------------------------------------------------------------------------

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
