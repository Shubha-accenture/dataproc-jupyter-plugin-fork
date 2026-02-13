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
  type MRT_GroupingState
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
  Typography
} from '@mui/material';
import { BigQueryService } from './bigQueryService';
import {
  AggregationRule,
  GridFilterModel,
  GridSortModel,
  IPreviewColumn
} from '../interfaces/bigQuery/BigQueryDataTableInfoInterface';
import { isNumericType } from '../utils/utils';

const BigQueryDataTableInfo = ({
  column,
  tableId,
  dataSetId,
  projectId
}: any) => {
  // Data State
  const [previewDataList, setPreviewDataList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalRowSize, setTotalRowSize] = useState('0');

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

  /**
   * Handles adding a new aggregation rule based on the selected function and column.
   * Validates that both an aggregation function and column are selected before adding.
   * Resets the selection after adding the rule.
   */
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

  /**
   * Handles removing an aggregation rule based on its index in the current list.
   * @param {Number} index - The index of the aggregation rule to remove.
   */
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
        size = 120;
      } else if (['BOOLEAN', 'BOOL'].includes(bqType)) {
        filterVariant = 'checkbox';
        size = 100;
      }

      // Custom Renderer to ensure data is always visible
      const renderCell = ({ cell, row }: any) => {
        let val = cell.getValue();

        // Fallback: If cell value is missing, fetch from original row data
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
        // Apply the robust renderer to ALL cell types
        Cell: renderCell,
        GroupedCell: renderCell,
        AggregatedCell: renderCell
      };
    });
  }, [column]);

  /***
   * Prepare Service Columns
   */
  const serviceColumns: IPreviewColumn[] = useMemo(() => {
    return column.map((col: any) => ({
      Header: col.name,
      accessor: col.name
    }));
  }, [column]);

  /**
   * Fetches BigQuery table data based on current state parameters such as sorting, filtering, pagination, grouping, and aggregations.
   */
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
      tableId,
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
      aggregations
    );
  };

  // Debounce Filter Logic
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedColumnFilters(columnFilters);
    }, 300);
    return () => clearTimeout(handler);
  }, [columnFilters]);

  //Dynamic Height Calculation
  useEffect(() => {
    const calculateHeight = () => {
      // Base Offset: Includes Jupyter Headers (~120px) + MRT Toolbar (~60px) + Pagination (~60px)
      let offset = 240;

      // Aggregation Panel Offset: Add extra space if the panel is visible
      if (showAggregationPanel) {
        offset += 100;
      }

      // Calculate remaining space
      const calculatedHeight = window.innerHeight - offset;

      // Safety floor: Don't let it shrink below 300px
      setPreviewHeight(Math.max(300, calculatedHeight));
    };

    // Calculate immediately
    calculateHeight();

    // Recalculate on resize
    window.addEventListener('resize', calculateHeight);
    return () => window.removeEventListener('resize', calculateHeight);
  }, [showAggregationPanel]);

  // Reset aggregations if grouping is cleared
  useEffect(() => {
    if (grouping.length === 0) {
      setAggregations([]);
    }
  }, [grouping]);

  // Fetch Data Effect
  useEffect(() => {
    fetchBigQueryTableData();
  }, [
    serviceColumns,
    tableId,
    dataSetId,
    projectId,
    pagination.pageIndex,
    pagination.pageSize,
    debouncedColumnFilters,
    sorting,
    aggregations
  ]);

  return (
    <MaterialReactTable
      columns={columns}
      data={previewDataList}
      // Grouping Configuration
      enableGrouping={true}
      groupedColumnMode={false}
      enableExpanding={false}
      // State Management
      state={{
        columnFilters,
        isLoading,
        pagination,
        sorting,
        grouping,
        showProgressBars: isLoading
      }}
      // Event Handlers
      onColumnFiltersChange={setColumnFilters}
      onPaginationChange={setPagination}
      onSortingChange={setSorting}
      onGroupingChange={setGrouping}
      // Server-Side Logic Flags
      manualFiltering={true}
      manualPagination={true}
      manualSorting={true}
      manualGrouping={true}
      rowCount={Number(totalRowSize)}
      // Custom Toolbar Rendering
      renderTopToolbar={({ table }) => (
        <Box>
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
                        // Must be Numeric Type
                        const isNumeric = isNumericType(col.type);
                        // Must NOT be the one currently used for grouping
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
      // Styling & Options
      enableRowSelection={false}
      enableColumnActions={true}
      enableDensityToggle={false}
      initialState={{ density: 'compact' }}
      muiTableProps={{
        sx: {
          tableLayout: 'fixed'
        }
      }}
      // Applied calculated height
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
