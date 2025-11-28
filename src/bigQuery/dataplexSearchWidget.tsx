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
import { IThemeManager, ReactWidget } from '@jupyterlab/apputils';
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
  CircularProgress
} from '@mui/material';
import { Search } from '@mui/icons-material';
import { LabIcon } from '@jupyterlab/ui-components';

import bigQueryProjectIcon from '../../style/icons/bigquery_project_icon.svg';
import { BigQueryService } from './bigQueryService';

const iconBigQueryProject = new LabIcon({
  name: 'launcher:bigquery-project-icon',
  svgstr: bigQueryProjectIcon
});
export interface INLSearchFilters {
  scope: string;
  systems: string;
  projects: string;
  type: string;
  subtype: string;
  locations: string;
  annotations: string;
}
export interface ISearchResult {
  name: string;
  description?: string;
}
const initialFilterState: INLSearchFilters = {
  scope: '',
  systems: '',
  projects: '',
  type: '',
  subtype: '',
  locations: '',
  annotations: ''
};

interface IDataplexSearchComponentProps {
  initialQuery: string;
  searchLoading: boolean;
  results?: ISearchResult[];
  projectsList: string[];
  onQueryChanged: (query: string) => void;
  onSearchExecuted: (query: string, projects: string[]) => void;
  onFiltersChanged: (filters: INLSearchFilters) => void;
}

const DataplexSearchComponent: React.FC<IDataplexSearchComponentProps> = ({
  initialQuery,
  searchLoading,
  results = [],
  onQueryChanged,
  onSearchExecuted,
  onFiltersChanged,
  projectsList
}) => {
  const [filters, setFilters] = useState<INLSearchFilters>(initialFilterState);

  useEffect(() => {
    onFiltersChanged(filters);
  }, [filters, onFiltersChanged]);

  const handleFilterChange = useCallback(
    (name: keyof INLSearchFilters, value: string) => {
      setFilters(prev => ({ ...prev, [name]: value }));
    },
    []
  );

  const handleClearFilters = useCallback(() => {
    setFilters(initialFilterState);
  }, []);

  const handleSearchClick = () => {
    onSearchExecuted(initialQuery.trim(), projectsList);
  };

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
        value={filters[name]}
        onChange={e => handleFilterChange(name, e.target.value as string)}
        label={label}
        sx={{
          '.MuiOutlinedInput-notchedOutline': {
            borderColor: 'var(--jp-border-color1)'
          }
        }}
      >
        <MenuItem value="">{`Select ${label}`}</MenuItem>
        {options.map(opt => (
          <MenuItem key={opt} value={opt}>
            {opt}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );

  const showFlatResults = useMemo(() => !searchLoading, [searchLoading]);

  const renderCard = (result: ISearchResult, index: number) => (
    <li
      key={index}
      className="search-result-item"
      style={{
        padding: '12px 16px',
        border: '1px solid var(--jp-border-color2)',
        borderRadius: '4px',
        marginBottom: '10px',
        backgroundColor: 'var(--jp-layout-color2)'
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          marginBottom: '4px'
        }}
      >
        <div role="img" className="db-icon" style={{ marginRight: '8px' }}>
          <iconBigQueryProject.react tag="div" />
        </div>
        <div
          style={{
            fontWeight: 600,
            color: 'var(--jp-ui-font-color0)',
            fontSize: 16
          }}
        >
          {result.name}
        </div>
      </div>
      <div
        style={{
          fontSize: 13,
          color: 'var(--jp-ui-font-color2)',
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
        {renderDropdown('scope', 'Scope', [
          'Current organization',
          'All Organizations',
          'Project'
        ])}
        {renderDropdown('systems', 'Systems', [
          'BigQuery',
          'Dataplex',
          'Cloud Storage'
        ])}
        {renderDropdown('projects', 'Projects', projectsList)}{' '}
        {/* Use dynamic projectsList */}
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

      <div
        style={{
          flexGrow: 1,
          padding: '16px 32px 32px 32px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          height: '100%'
        }}
      >
        <div
          className="nl-query-bar"
          style={{ display: 'flex', alignItems: 'center', gap: 8 }}
        >
          <TextField
            fullWidth
            variant="outlined"
            size="small"
            placeholder="What dataset are you looking for?"
            value={initialQuery}
            onChange={e => onQueryChanged(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') handleSearchClick();
            }}
            InputProps={{
              startAdornment: (
                <Search style={{ color: 'var(--jp-ui-font-color1)' }} />
              ),
              endAdornment: (
                <IconButton onClick={handleSearchClick}>
                  <Search style={{ color: 'var(--jp-ui-font-color1)' }} />
                </IconButton>
              )
            }}
          />
        </div>

        <div
          className="nl-search-results-list"
          style={{ flexGrow: 1, overflowY: 'auto' }}
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
                  Query: "{initialQuery}" ({results.length} found)
                </p>
              )}
              {results.length > 0 ? (
                <ul
                  style={{ listStyleType: 'none', paddingLeft: 0, margin: 0 }}
                >
                  {results.map(renderCard)}
                </ul>
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
    </div>
  );
};

class DataplexSearchPanelWrapper extends ReactWidget {
  public initialQuery: string = '';
  public searchResults: ISearchResult[] = [];
  public searchLoading: boolean = false;

  public projectsList: string[] = [];
  public allSearchResults: any[] = [];

  private _queryChanged = new Signal<this, string>(this);
  get queryChanged(): Signal<this, string> {
    return this._queryChanged;
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
    allResults: any[]
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
        onQueryChanged={q => this._queryChanged.emit(q)}
        onSearchExecuted={(q, p) =>
          this._searchExecuted.emit({ query: q, projects: p })
        }
        onFiltersChanged={f => this._filtersChanged.emit(f)}
      />
    );
  }
}

export class DataplexSearchWidget extends Panel {
  // private app: JupyterLab;
  settingRegistry: ISettingRegistry;
  // private themeManager: IThemeManager;

  private searchWrapper: DataplexSearchPanelWrapper;

  constructor(
    app: JupyterLab,
    settingRegistry: ISettingRegistry,
    themeManager: IThemeManager,
    initialSearchTerm: string = ''
  ) {
    super();
    // this.app = app;
    this.settingRegistry = settingRegistry;
    // this.themeManager = themeManager;

    this.title.label = 'NL Dataset Search';
    this.addClass('jp-DataplexSearchWidget');
    this.searchWrapper = new DataplexSearchPanelWrapper();

    this.searchWrapper.initialQuery = initialSearchTerm;

    this.addWidget(this.searchWrapper);
    this.node.style.height = '100%';
    this.node.style.minWidth = '800px';

    // this.searchWrapper.searchExecuted.connect(this._onSearchExecuted, this);

    this.searchWrapper.update();
    this.fetchProjectsList();
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

      const setProjectName = (name: string) => {
      };

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
      });

      await Promise.all(datasetPromises);

      console.log(
        'DataplexSearch: All Datasets by Project ID:',
        allDatasetsByProject
      );
    } catch (error) {
      console.error('Error fetching datasets for projects:', error);
    }
  }
}
