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

interface IPreviewColumn {
  Header: string;
  accessor: string;
}

// Helper types
interface GridFilterItem {
  field: string;
  operator?: string;
  value?: any;
}
interface GridFilterModel {
  items: GridFilterItem[];
}
interface GridSortItem {
  field: string;
  sort: 'asc' | 'desc' | null | undefined;
}
type GridSortModel = GridSortItem[];

// Helper to check for numeric BQ types
const isNumericType = (type: string) => {
  const t = type?.toUpperCase();
  return [
    'INTEGER',
    'FLOAT',
    'NUMERIC',
    'DECIMAL',
    'INT64',
    'FLOAT64'
  ].includes(t);
};

interface AggregationRule {
  col: string;
  func: string;
}

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

  // Debounce Filter Logic
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedColumnFilters(columnFilters);
    }, 300);
    return () => clearTimeout(handler);
  }, [columnFilters]);

  // Determine Visibility of Aggregation Section
  const showAggregationPanel = useMemo(() => {
    if (!column || grouping.length === 0) return false;
    return grouping.some(gCol => {
      const colDef = column.find((c: any) => c.name === gCol);
      return colDef && isNumericType(colDef.type);
    });
  }, [grouping, column]);

  // --- Dynamic Height Calculation Effect ---
  useEffect(() => {
    const calculateHeight = () => {
      // 1. Base Offset: Includes Jupyter Headers (~120px) + MRT Toolbar (~60px) + Pagination (~60px)
      let offset = 240;

      // 2. Aggregation Panel Offset: Add extra space if the panel is visible
      if (showAggregationPanel) {
        offset += 100;
      }

      // 3. Calculate remaining space
      const calculatedHeight = window.innerHeight - offset;

      // 4. Safety floor: Don't let it shrink below 300px
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

  // Handle Adding Aggregation
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

  // Handle Removing Aggregation
  const handleRemoveAggregation = (index: number) => {
    setAggregations(prev => prev.filter((_, i) => i !== index));
  };

  // Define Columns
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

      // --- CRITICAL FIX: Custom Renderer Closure ---
      // We define this INSIDE the map so we can access `col.name` directly.
      // This guarantees we find the data even if MRT's `cell.getValue()` is confused by grouping.
      const renderCell = ({ cell, row }: any) => {
        let val = cell.getValue();

        // Fallback: If cell value is missing (common in GroupedCell), fetch from original row data
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
        GroupedCell: renderCell, // Fixes empty column when grouped
        AggregatedCell: renderCell // Fixes empty column when aggregated
      };
    });
  }, [column]);

  // Prepare Service Columns
  const serviceColumns: IPreviewColumn[] = useMemo(() => {
    return column.map((col: any) => ({
      Header: col.name,
      accessor: col.name
    }));
  }, [column]);

  // Fetch Data Effect
  useEffect(() => {
    const fetchData = () => {
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

    fetchData();
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
    console.log('modified'),
    (
      <MaterialReactTable
        columns={columns}
        data={previewDataList}
        // Grouping Configuration
        enableGrouping={true}
        groupedColumnMode={false} // Keeps the column in the table
        enableExpanding={false} // Disables accordion behavior
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
    )
  );
};

export default BigQueryDataTableInfo;
