import { Panel } from '@lumino/widgets'; 
import { JupyterLab } from '@jupyterlab/application';
import { IThemeManager, ReactWidget } from '@jupyterlab/apputils';
// import { ISettingRegistry } from '@jupyterlab/settingregistry';
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

const iconBigQueryProject = new LabIcon({ name: 'launcher:bigquery-project-icon', svgstr: bigQueryProjectIcon });

export interface INLSearchFilters {
    scope: string; systems: string; projects: string; type: string; 
    subtype: string; locations: string; annotations: string;
}
export interface ISearchResult { name: string; description?: string; }
const initialFilterState: INLSearchFilters = {
    scope: '', systems: '', projects: '', type: '', subtype: '', locations: '', annotations: ''
};

// Removed: calculateDepth, NodeRenderer (Tree logic)

interface IDataplexSearchComponentProps {
    initialQuery: string;
    searchLoading: boolean;
    results?: ISearchResult[]; // Added results to props for rendering cards
    onQueryChanged: (query: string) => void;
    onSearchExecuted: (query: string) => void;
    onFiltersChanged: (filters: INLSearchFilters) => void;
}

const DataplexSearchComponent: React.FC<IDataplexSearchComponentProps> = ({ 
    initialQuery, searchLoading, results = [], // Default results to empty array
    onQueryChanged, onSearchExecuted, onFiltersChanged 
}) => {
    const [filters, setFilters] = useState<INLSearchFilters>(initialFilterState);

    useEffect(() => {
        onFiltersChanged(filters);
    }, [filters, onFiltersChanged]);

    const handleFilterChange = useCallback((name: keyof INLSearchFilters, value: string) => {
        setFilters(prev => ({ ...prev, [name]: value }));
    }, []);

    const handleClearFilters = useCallback(() => {
        setFilters(initialFilterState);
    }, []);
    
    const renderDropdown = (name: keyof INLSearchFilters, label: string, options: string[]) => (
        <FormControl key={name} variant="outlined" fullWidth size="small">
            <InputLabel id={`${name}-label`}>{label}</InputLabel>
            <Select
                labelId={`${name}-label`}
                value={filters[name]}
                onChange={(e) => handleFilterChange(name, e.target.value as string)}
                label={label}
                sx={{ '.MuiOutlinedInput-notchedOutline': { borderColor: 'var(--jp-border-color1)' } }}
            >
                <MenuItem value="">{`Select ${label}`}</MenuItem>
                {options.map(opt => (
                    <MenuItem key={opt} value={opt.toLowerCase().replace(/\s/g, '-')}>{opt}</MenuItem>
                ))}
            </Select>
        </FormControl>
    );

    const showFlatResults = useMemo(() => !searchLoading, [searchLoading]);

    const renderCard = (result: ISearchResult, index: number) => (
        <li key={index} className="search-result-item" style={{ 
            padding: '12px 16px', 
            border: '1px solid var(--jp-border-color2)',
            borderRadius: '4px',
            marginBottom: '10px',
            backgroundColor: 'var(--jp-layout-color2)'
        }}>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '4px'
            }}>
                <div role="img" className="db-icon" style={{marginRight: '8px'}}>
                    <iconBigQueryProject.react tag="div" />
                </div>
                <div style={{fontWeight: 600, color: 'var(--jp-ui-font-color0)', fontSize: 16}}>{result.name}</div>
            </div>
            <div style={{fontSize: 13, color: 'var(--jp-ui-font-color2)', paddingLeft: '28px'}}>{result.description || 'No description provided.'}</div>
        </li>
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'row', height: '100%', width: '100%' }}>
            <div style={{ 
                padding: '8px 12px 16px 12px', 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '12px',
                width: '290px', 
                minWidth: '290px',
                borderRight: '1px solid var(--jp-border-color2)',
                overflowY: 'auto'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ color: 'var(--jp-ui-font-color1)', fontWeight: 500, margin: 0 }}>Filters</h3>
                    <Button onClick={handleClearFilters} size="small"
                        style={{ color: 'var(--jp-brand-color1)', minWidth: 'unset', padding: '2px 8px' }}>
                        Clear
                    </Button>
                </div>
                <hr style={{ borderTop: '1px solid var(--jp-border-color2)', margin: '4px 0 6px 0' }}/>
                
                {/* DROPDOWN LIST */}
                {renderDropdown('scope', 'Scope', ['Current organization', 'All Organizations', 'Project'])}
                {renderDropdown('systems', 'Systems', ['BigQuery', 'Dataplex', 'Cloud Storage'])}
                {renderDropdown('projects', 'Projects', ['Finance', 'Marketing', 'Default'])}
                {renderDropdown('type', 'Type', ['Table', 'View', 'External Table', 'Data Stream'])}
                {renderDropdown('locations', 'Locations', ['US-Central1', 'Europe-West4', 'Global'])}
                {renderDropdown('annotations', 'Annotations', ['Confidential', 'Public', 'PII'])}
            </div>

            <div style={{ flexGrow: 1, padding: '16px 32px 32px 32px', display: 'flex', flexDirection: 'column', gap: '16px', height: '100%' }}>
                
                <div className="nl-query-bar" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <TextField
                        fullWidth
                        variant="outlined"
                        size="small"
                        placeholder="What dataset are you looking for?"
                        value={initialQuery}
                        onChange={(e) => onQueryChanged(e.target.value)} 
                        onKeyDown={(e) => { if (e.key === 'Enter') onSearchExecuted(initialQuery.trim()); }} 
                        InputProps={{
                            startAdornment: <Search style={{ color: 'var(--jp-ui-font-color1)' }} />,
                            endAdornment: (
                                <IconButton onClick={() => onSearchExecuted(initialQuery.trim())}>
                                    <Search style={{ color: 'var(--jp-ui-font-color1)' }} />
                                </IconButton>
                            )
                        }}
                    />
                </div>

                <div className="nl-search-results-list" style={{ flexGrow: 1, overflowY: 'auto' }}>
                    <h2 style={{fontSize: 20, fontWeight: 500, margin: '0 0 16px 0', color: 'var(--jp-ui-font-color0)'}}>
                        {initialQuery.trim() === '' ? 'Dataset Search' : 'Search Results'}
                    </h2>
                    
                    {searchLoading ? ( 
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--jp-ui-font-color2)'}}>
                            <CircularProgress size={16} /> 
                            <span>Searching...</span>
                        </div>
                    ) : showFlatResults ? (
                        <>
                            {initialQuery.trim() !== '' && (
                                <p style={{fontSize: 13, color: 'var(--jp-ui-font-color2)', margin: '0 0 12px 0'}}>
                                    Query: "{initialQuery}" ({results.length} found)
                                </p>
                            )}
                            {results.length > 0 ? (
                                <ul style={{ listStyleType: 'none', paddingLeft: 0, margin: 0 }}>
                                    {results.map(renderCard)}
                                </ul>
                            ) : initialQuery.trim() === '' ? (
                                <p style={{ color: 'var(--jp-ui-font-color2)' }}>
                                    Enter a query in the search bar above to find Dataplex assets (tables, views, etc.).
                                </p>
                            ) : (
                                <p style={{ color: 'var(--jp-ui-font-color2)' }}>
                                    No results found for your query. Try adjusting your filters or search term.
                                </p>
                            )}
                        </>
                    ) : null /* Should not happen with showFlatResults logic, but kept for completeness */}
                </div>
            </div>
        </div>
    );
};


class DataplexSearchPanelWrapper extends ReactWidget {
    public initialQuery: string = '';
    public searchResults: ISearchResult[] = [];
    public searchLoading: boolean = false; 

    private _queryChanged = new Signal<this, string>(this);
    get queryChanged(): Signal<this, string> { return this._queryChanged; }
    private _searchExecuted = new Signal<this, string>(this);
    get searchExecuted(): Signal<this, string> { return this._searchExecuted; }
    private _filtersChanged = new Signal<this, INLSearchFilters>(this);
    get filtersChanged(): Signal<this, INLSearchFilters> { return this._filtersChanged; }

    public updateState(query: string, results: ISearchResult[], loading: boolean): void { 
        this.initialQuery = query; 
        this.searchResults = results;
        this.searchLoading = loading; 
        this.update();
    }

    render(): JSX.Element {
        return (
            <DataplexSearchComponent 
                initialQuery={this.initialQuery} 
                results={this.searchResults} // Pass flat results to component
                searchLoading={this.searchLoading}
                onQueryChanged={(q) => this._queryChanged.emit(q)}
                onSearchExecuted={(q) => this._searchExecuted.emit(q)}
                onFiltersChanged={(f) => this._filtersChanged.emit(f)}
            />
        );
    }
}


export class DataplexSearchWidget extends Panel { 
    // private app: JupyterLab; 
    
    private searchWrapper: DataplexSearchPanelWrapper; 

    constructor(app: JupyterLab, themeManager: IThemeManager, initialSearchTerm: string = '') {
        super(); 
        
        this.title.label = 'NL Dataset Search';
        this.addClass('jp-DataplexSearchWidget');
        this.searchWrapper = new DataplexSearchPanelWrapper();
        
        this.searchWrapper.initialQuery = initialSearchTerm; 
        
        this.addWidget(this.searchWrapper); 
        this.node.style.height = '100%';
        this.node.style.minWidth = '800px'; 
        
        this.searchWrapper.update(); 
    }
}
