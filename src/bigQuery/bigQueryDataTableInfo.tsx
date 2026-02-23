/**
 * @license
 * Copyright 2026 Google LLC
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

import React, { useEffect, useState, useMemo } from 'react';
import {
  MaterialReactTable,
  MRT_TopToolbar,
  type MRT_ColumnDef,
  type MRT_ColumnFiltersState,
  type MRT_SortingState,
  type MRT_PaginationState,
  type MRT_GroupingState,
  MRT_ShowHideColumnsButton,
  MRT_ToggleFiltersButton
} from 'material-react-table';
import {
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Chip,
  Typography,
  Tooltip,
  TextField,
  CircularProgress
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'; // Added for AI styling
import { BigQueryService } from './bigQueryService';
import {
  AggregationRule,
  GridFilterModel,
  GridSortModel,
  IPreviewColumn
} from '../interfaces/bigQuery/BigQueryDataTableInfoInterface';
import { isNumericType } from '../utils/utils';
import { DEFAULT_SQL_QUERY } from '../utils/const';

const BigQueryDataTableInfo = ({
  column,
  node,
  dataSetId,
  projectId,
  app
}: any) => {
  // Data State
  const [previewDataList, setPreviewDataList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalRowSize, setTotalRowSize] = useState('0');

  // Store the generated SQL from the API response
  const [generatedSql, setGeneratedSql] = useState<string>('');

  // AI / Gemini State
  const [nlQuery, setNlQuery] = useState<string>('');
  const [isGeneratingAiSql, setIsGeneratingAiSql] = useState(false);

  // MRT State
  const [columnFilters, setColumnFilters] = useState<MRT_ColumnFiltersState>(
    []
  );
  const [sorting, setSorting] = useState<MRT_SortingState>([]);
  const [pagination, setPagination] = useState<MRT_PaginationState>({
    pageIndex: 0,
    pageSize: 50
  });

  // Grouping State
  const [grouping, setGrouping] = useState<MRT_GroupingState>([]);

  // Aggregation State
  const [aggregations, setAggregations] = useState<AggregationRule[]>([]);
  const [selectedAggFunc, setSelectedAggFunc] = useState<string>('');
  const [selectedAggCol, setSelectedAggCol] = useState<string>('');

  // Debounce State for Filtering
  const [debouncedColumnFilters, setDebouncedColumnFilters] =
    useState<MRT_ColumnFiltersState>([]);

  // State for Table Container Height
  const [previewHeight, setPreviewHeight] = useState(500);

  /**
   * Determines whether to show the aggregation panel based on the presence of active groupings.
   */
  const showAggregationPanel = useMemo(() => {
    return grouping.length > 0;
  }, [grouping]);

  const handleAddAggregation = () => {
    if (selectedAggFunc && selectedAggCol) {
      setAggregations(prev => [
        ...prev,
        { func: selectedAggFunc, col: selectedAggCol }
      ]);
      setSelectedAggFunc('');
      setSelectedAggCol('');
    }
  };

  const handleRemoveAggregation = (index: number) => {
    setAggregations(prev => prev.filter((_, i) => i !== index));
  };

  /**
   * Column Definitions with Robust Cell Rendering
   */
  const columns = useMemo<MRT_ColumnDef<any>[]>(() => {
    if (!column) return [];

    return column.map((col: any) => {
      const bqType = col.type?.toUpperCase();
      let filterVariant: 'text' | 'range' | 'checkbox' = 'text';
      let size = 180;

      if (isNumericType(bqType)) {
        filterVariant = 'range';
        size = 1920;
      } else if (['BOOLEAN', 'BOOL'].includes(bqType)) {
        filterVariant = 'checkbox';
        size = 100;
      }

      const renderCell = ({ cell, row }: any) => {
        let val = cell.getValue();

        if (val === undefined || val === null) {
          val = row?.original?.[col.name];
        }

        if (val === null || val === undefined || val === '') {
          return (
            <Box
              component="span"
              sx={{ color: 'text.disabled', fontStyle: 'italic' }}
            >
              null
            </Box>
          );
        }
        return String(val);
      };

      return {
        accessorKey: col.name,
        header: col.name,
        filterVariant: filterVariant,
        size: size,
        enableGrouping: true,
        Cell: renderCell,
        GroupedCell: renderCell,
        AggregatedCell: renderCell
      };
    });
  }, [column]);

  const serviceColumns: IPreviewColumn[] = useMemo(() => {
    return column.map((col: any) => ({
      Header: col.name,
      accessor: col.name
    }));
  }, [column]);

  /**
   * Handles natural language to SQL queries using the Gemini API.
   * NOTE: This calls a backend service to prevent exposing Gemini API keys on the frontend.
   */
  const handleAiQuerySubmit = async () => {
    if (!nlQuery.trim()) return;

    setIsGeneratingAiSql(true);
    setIsLoading(true);

    try {
      // Create a context string of the table's schema (columns and their types)
      // to send to Gemini so it understands what it is querying.
      const tableSchemaContext = column
        .map((col: any) => `${col.name} (${col.type})`)
        .join(', ');

      const fullyQualifiedTableName = `${projectId}.${dataSetId}.${node?.data?.name}`;

      // Call the backend service. This service should:
      // 1. Ask Gemini to convert `nlQuery` to a SQL string using `tableSchemaContext`.
      // 2. Execute that generated SQL against BigQuery.
      // 3. Return both the generated SQL and the resulting dataset.
      const response = await BigQueryService.generateAndExecuteAiSql(
        nlQuery,
        tableSchemaContext,
        fullyQualifiedTableName
      );

      if (response) {
        setGeneratedSql(response.sqlQuery);
        setPreviewDataList(response.data);
        setTotalRowSize(response.data.length.toString());
        // You may also need to dynamically update the columns/serviceColumns
        // if the SELECT statement alters the standard columns.
      }
    } catch (error) {
      console.error('Error executing AI query:', error);
    } finally {
      setIsGeneratingAiSql(false);
      setIsLoading(false);
    }
  };

  const fetchBigQueryTableData = () => {
    setIsLoading(true);

    const sortModel: GridSortModel = sorting.map(sort => ({
      field: sort.id,
      sort: sort.desc ? 'desc' : 'asc'
    }));

    const filterModel: GridFilterModel = {
      items: debouncedColumnFilters.map(filter => ({
        field: filter.id,
        operator: Array.isArray(filter.value) ? 'between' : 'contains',
        value: filter.value
      }))
    };

    BigQueryService.bigQueryPreviewAPIService(
      serviceColumns,
      node?.data?.name,
      dataSetId,
      setIsLoading,
      projectId,
      pagination.pageSize,
      pagination.pageIndex,
      setTotalRowSize,
      setPreviewDataList,
      filterModel,
      sortModel,
      grouping,
      aggregations,
      setGeneratedSql
    );
  };

  const handleCopySQLQuery = async () => {
    if (!generatedSql) return;

    try {
      // Create a new notebook
      const notebookPanel = await app.commands.execute('notebook:create-new', {
        kernelName: 'python3'
      });
      await new Promise(resolve => setTimeout(resolve, 300));

      // Activate the notebook
      app.shell.activateById(notebookPanel.id);

      // Insert the generated SQL from API
      await app.commands.execute('notebook:replace-selection', {
        text: `%%bqsql\n${generatedSql}`
      });
    } catch (error) {
      console.error('Error creating notebook:', error);
    }
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedColumnFilters(columnFilters);
    }, 300);
    return () => clearTimeout(handler);
  }, [columnFilters]);

  useEffect(() => {
    const calculateHeight = () => {
      let offset = 240;
      if (showAggregationPanel) offset += 100;
      // Add a slight offset for our new AI toolbar input
      offset += 60;

      const calculatedHeight = window.innerHeight - offset;
      setPreviewHeight(Math.max(300, calculatedHeight));
    };

    calculateHeight();
    window.addEventListener('resize', calculateHeight);
    return () => window.removeEventListener('resize', calculateHeight);
  }, [showAggregationPanel]);

  useEffect(() => {
    if (grouping.length === 0) setAggregations([]);
  }, [grouping]);

  useEffect(() => {
    // Only trigger default fetch if we aren't generating AI SQL
    // to prevent race conditions or overwriting AI results.
    if (!isGeneratingAiSql) {
      fetchBigQueryTableData();
    }
  }, [
    serviceColumns,
    node?.data?.name,
    dataSetId,
    projectId,
    pagination.pageIndex,
    pagination.pageSize,
    debouncedColumnFilters,
    sorting,
    aggregations
  ]);

  useEffect(() => {
    if (!generatedSql) {
      setGeneratedSql(
        `${DEFAULT_SQL_QUERY} ${projectId}.${dataSetId}.${node?.data?.name}`
      );
    }
  }, [generatedSql]);

  return (
    <MaterialReactTable
      columns={columns}
      data={previewDataList}
      enableGrouping={true}
      groupedColumnMode={false}
      enableExpanding={false}
      isMultiSortEvent={() => true}
      maxMultiSortColCount={3}
      state={{
        columnFilters,
        isLoading,
        pagination,
        sorting,
        grouping,
        showProgressBars: isLoading
      }}
      onColumnFiltersChange={setColumnFilters}
      onPaginationChange={setPagination}
      onSortingChange={setSorting}
      onGroupingChange={setGrouping}
      manualFiltering={true}
      manualPagination={true}
      manualSorting={true}
      manualGrouping={true}
      rowCount={Number(totalRowSize)}
      enableGlobalFilter={false}
      enableFullScreenToggle={false}
      renderToolbarInternalActions={({ table }) => (
        <Box sx={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <MRT_ToggleFiltersButton table={table} />
          <MRT_ShowHideColumnsButton table={table} />

          <Tooltip
            title={
              generatedSql ? 'Open SQL in new notebook' : 'Query not available'
            }
          >
            <span>
              <Button
                variant="outlined"
                color="primary"
                size="small"
                startIcon={<ContentCopyIcon />}
                onClick={handleCopySQLQuery}
                disabled={isLoading}
              >
                Copy SQL Query
              </Button>
            </span>
          </Tooltip>
        </Box>
      )}
      renderTopToolbar={({ table }) => (
        <Box>
          {/* Gemini AI Input Bar */}
          <Box
            sx={{
              p: '8px 16px',
              display: 'flex',
              gap: 2,
              alignItems: 'center',
              borderBottom: '1px solid #e0e0e0',
              backgroundColor: '#fafafa'
            }}
          >
            <TextField
              size="small"
              fullWidth
              variant="outlined"
              placeholder="Ask Gemini to query this data (e.g., 'Show me users from NY with age > 30')"
              value={nlQuery}
              onChange={e => setNlQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAiQuerySubmit()}
              disabled={isGeneratingAiSql || isLoading}
            />
            <Button
              variant="contained"
              color="secondary"
              onClick={handleAiQuerySubmit}
              disabled={isGeneratingAiSql || isLoading || !nlQuery.trim()}
              startIcon={
                isGeneratingAiSql ? (
                  <CircularProgress size={16} color="inherit" />
                ) : (
                  <AutoAwesomeIcon />
                )
              }
              sx={{ whiteSpace: 'nowrap' }}
            >
              Ask AI
            </Button>
          </Box>

          <MRT_TopToolbar table={table} />

          {showAggregationPanel && (
            <Box
              sx={{
                p: '8px 16px',
                backgroundColor: '#f5f5f5',
                borderBottom: '1px solid #e0e0e0'
              }}
            >
              <Stack direction="row" spacing={2} alignItems="center">
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>Aggregation</InputLabel>
                  <Select
                    value={selectedAggFunc}
                    label="Aggregation"
                    onChange={e => setSelectedAggFunc(e.target.value)}
                  >
                    <MenuItem value="MIN">MIN</MenuItem>
                    <MenuItem value="MAX">MAX</MenuItem>
                    <MenuItem value="SUM">SUM</MenuItem>
                    <MenuItem value="AVG">AVG</MenuItem>
                    <MenuItem value="COUNT">COUNT</MenuItem>
                  </Select>
                </FormControl>

                <FormControl size="small" sx={{ minWidth: 200 }}>
                  <InputLabel>Column</InputLabel>
                  <Select
                    value={selectedAggCol}
                    label="Column"
                    onChange={e => setSelectedAggCol(e.target.value)}
                  >
                    {column
                      ?.filter((col: any) => {
                        const isNumeric = isNumericType(col.type);
                        const isGrouped = grouping.includes(col.name);
                        return isNumeric && !isGrouped;
                      })
                      .map((col: any) => {
                        const isDisabled = aggregations.some(
                          agg => agg.col === col.name
                        );
                        return (
                          <MenuItem
                            key={col.name}
                            value={col.name}
                            disabled={isDisabled}
                          >
                            {col.name}
                          </MenuItem>
                        );
                      })}
                  </Select>
                </FormControl>

                <Button
                  variant="contained"
                  size="small"
                  onClick={handleAddAggregation}
                  disabled={!selectedAggFunc || !selectedAggCol}
                >
                  Add
                </Button>
              </Stack>

              {aggregations.length > 0 && (
                <Stack
                  direction="row"
                  spacing={1}
                  sx={{ mt: 2, flexWrap: 'wrap', gap: 1 }}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      alignSelf: 'center',
                      mr: 1,
                      color: 'text.secondary'
                    }}
                  >
                    Active Aggregations:
                  </Typography>
                  {aggregations.map((agg, index) => (
                    <Chip
                      key={`${agg.col}-${agg.func}`}
                      label={`${agg.col} (${agg.func})`}
                      onDelete={() => handleRemoveAggregation(index)}
                      color="primary"
                      variant="outlined"
                      size="small"
                    />
                  ))}
                </Stack>
              )}
            </Box>
          )}
        </Box>
      )}
      enableRowSelection={false}
      enableColumnActions={true}
      enableDensityToggle={false}
      initialState={{ density: 'compact' }}
      muiTableProps={{
        sx: {
          tableLayout: 'fixed'
        }
      }}
      muiTableContainerProps={{
        sx: {
          height: `${previewHeight}px`,
          maxHeight: `${previewHeight}px`,
          overflowX: 'auto',
          flexGrow: 1
        },
        onDragStart: e => e.stopPropagation(),
        onDragOver: e => e.stopPropagation(),
        onDrop: e => e.stopPropagation()
      }}
      muiTableHeadCellProps={{
        onDragStart: e => e.stopPropagation()
      }}
      renderEmptyRowsFallback={() => (
        <Box
          sx={{
            p: 2,
            textAlign: 'center',
            fontStyle: 'italic',
            color: 'text.secondary'
          }}
        >
          No data available
        </Box>
      )}
    />
  );
};

export default BigQueryDataTableInfo;
