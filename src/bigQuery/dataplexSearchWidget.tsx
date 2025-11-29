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

import datasetIcon from '../../style/icons/dataset_icon.svg';
import { BigQueryService } from './bigQueryService';

const iconDataset = new LabIcon({
  name: 'launcher:dataset-icon',
  svgstr: datasetIcon
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

const RESULTS_PER_PAGE = 50; // Page size set to 50

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
  const [currentPage, setCurrentPage] = useState(1); // Pagination state

  useEffect(() => {
    onFiltersChanged(filters);
  }, [filters, onFiltersChanged]);

  useEffect(() => {
    setCurrentPage(1);
  }, [results]);

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
        <div role="img" className="db-icon">
          <iconDataset.react tag="div" />
        </div>

        <div
          style={{
            color: 'var(--jp-brand-color1)',
            fontSize: 14,
            fontWeight: 500,
            textDecoration: 'underline',
            cursor: 'pointer'
          }}
        >
          {result.name}
        </div>
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
          minHeight: 0
        }}
      >
        <div
          className="nl-query-bar"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: '16px'
          }}
        >
          <TextField
            fullWidth
            variant="outlined"
            size="small"
            placeholder="What dataset are you looking for?"
            value={initialQuery}
            onChange={e => {
              console.log('DataplexSearch: Query String Changed:', e.target.value);
              onQueryChanged(e.target.value);
            }}
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
    </div>
  );
};
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
        // Emit the new queryUpdated signal on change
        onQueryChanged={q => this._queryUpdated.emit(q)}
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

    this.searchWrapper.node.style.height = '100%';
    this.searchWrapper.node.style.width = '100%';

    this.searchWrapper.queryUpdated.connect(this._onQueryUpdated, this);
    this.searchWrapper.searchExecuted.connect(this._onSearchExecuted, this);

    this.searchWrapper.update();
    this.fetchProjectsList();
  }
  
  private _onQueryUpdated(sender: DataplexSearchPanelWrapper, query: string): void {
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

      const setProjectName = (name: string) => {
        // N/A
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

          if (dataset.entrySource) {
            const entrySource = dataset.entrySource;
            const explicitDescription = entrySource.description;
            const location = entrySource.location;

            name = entrySource.displayName;

            description = explicitDescription
              ? explicitDescription
              : location
              ? `${projectId} > ${location}`
              : `Project: ${projectId}`;
          } else if (dataset.datasetReference) {
            const datasetRef = dataset.datasetReference;
            const location = dataset.location;

            name = datasetRef.datasetId;

            description = location
              ? `${projectId} > ${location}`
              : `Project: ${projectId}`;
          }

          if (name) {
            allResults.push({
              name: name,
              description: description
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
   * Transforms raw search results from the BigQuery Search API into the flat ISearchResult[] format.
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

          flatResults.push({
            name: name,
            description: description
          });
        }
      });
    });

    return flatResults;
  }


private async _onSearchExecuted(
    sender: DataplexSearchPanelWrapper,
    args: { query: string, projects: string[] }
) {
    const { query, projects } = args;

    if (query.length < 3) {
        console.warn('DataplexSearch: Search term must be at least 3 characters.');
        this.searchWrapper.updateState(query, [], false, projects, []); 
        return;
    }

    this.searchWrapper.updateState(query, [], true, projects, []);
    
    console.log(`DataplexSearch: Initiating search for query: "${query}" across projects:`, projects);

    try {
        const searchPromises = projects.map(async (projectName) => {
            console.log(`DataplexSearch: Starting BigQuery Search for project: ${projectName}`);

            let searchResult: any = null;
            const setSearchLoading = (value: boolean) => { /* handled by global state */ };
            const setSearchResponse = (data: any) => { searchResult = data; };

            await BigQueryService.getBigQuerySearchAPIService(
                query,
                setSearchLoading,
                setSearchResponse
            );

            if (searchResult) {
                console.log(`DataplexSearch: Received result from project ${projectName}`, searchResult);
                return { project: projectName, result: searchResult };
            }
            return null;
        });

        const combinedRawResults = (await Promise.all(searchPromises)).filter(
            (result): result is { project: string; result: any } =>
              result !== null
        );

        console.log("DataplexSearch: Combined Search Results for all projects (RAW):", combinedRawResults);
        
        const flatResults = this.processSearchResults(combinedRawResults);
        
        console.log("DataplexSearch: Final Processed Flat Results:", flatResults);

        this.searchWrapper.updateState(
            query,
            flatResults, // Pass the processed flat results
            false,
            projects,
            combinedRawResults
        );

    } catch (error) {
        console.error('DataplexSearch: Error during BigQuery search:', error);
        this.searchWrapper.updateState(
            query,
            [],
            false,
            projects,
            []
        );
    }
}

}
