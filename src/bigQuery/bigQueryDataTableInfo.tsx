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
  type MRT_ColumnDef,
  type MRT_ColumnFiltersState,
  type MRT_SortingState,
  type MRT_PaginationState
} from 'material-react-table';
import { Box } from '@mui/material';
import { BigQueryService } from './bigQueryService';

interface IPreviewColumn {
  Header: string;
  accessor: string;
}

// Helper types to match what BigQueryService likely expects from the previous MUI DataGrid implementation
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

  // Debounce State for Filtering
  const [debouncedColumnFilters, setDebouncedColumnFilters] =
    useState<MRT_ColumnFiltersState>([]);

  // Handle Window Resize (Optional, MRT handles scroll internally better, but keeping for layout consistency)
  const [previewHeight, setPreviewHeight] = useState(window.innerHeight - 180);
  useEffect(() => {
    const handleUpdateHeight = () => setPreviewHeight(window.innerHeight - 180);
    window.addEventListener('resize', handleUpdateHeight);
    return () => window.removeEventListener('resize', handleUpdateHeight);
  }, []);

  // Debounce Filter Logic
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedColumnFilters(columnFilters);
    }, 300);

    return () => clearTimeout(handler);
  }, [columnFilters]);

  // Define Columns
  const columns = useMemo<MRT_ColumnDef<any>[]>(() => {
    if (!column) return [];

    return column.map((col: any) => {
      const bqType = col.type?.toUpperCase();
      let filterVariant: 'text' | 'range' | 'checkbox' = 'text';
      let size = 180;

      // Map BigQuery types to MRT Filter Variants
      if (
        ['INTEGER', 'FLOAT', 'NUMERIC', 'DECIMAL', 'INT64', 'FLOAT64'].includes(
          bqType
        )
      ) {
        filterVariant = 'range'; // Range slider/inputs for numbers
        size = 120;
      } else if (['BOOLEAN', 'BOOL'].includes(bqType)) {
        filterVariant = 'checkbox';
        size = 100;
      }

      return {
        accessorKey: col.name,
        header: col.name,
        filterVariant: filterVariant,
        size: size,
        // Custom Cell Render to handle nulls
        Cell: ({ cell }: any) => {
          const val = cell.getValue();
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
        }
      };
    });
  }, [column]);

  // Prepare Service Columns (kept for compatibility with Service)
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

      // --- ADAPTER: Convert MRT State to MUI DataGrid format for Service Compatibility ---

      // Convert MRT Sorting to GridSortModel
      const sortModel: GridSortModel = sorting.map(sort => ({
        field: sort.id,
        sort: sort.desc ? 'desc' : 'asc'
      }));

      // Convert MRT Filters to GridFilterModel
      // Note: MRT 'range' filters usually come as [min, max].
      // You might need to adjust logic here depending on how your BigQueryService parses 'value'.
      const filterModel: GridFilterModel = {
        items: debouncedColumnFilters.map(filter => ({
          field: filter.id,
          // Defaulting operator to 'contains' or generic equals.
          // If the service logic uses specific operators like '>', '<', this adapter needs specific tuning.
          operator: Array.isArray(filter.value) ? 'between' : 'contains',
          value: filter.value
        }))
      };

      // ---------------------------------------------------------------------------------

      BigQueryService.bigQueryPreviewAPIService(
        serviceColumns,
        tableId,
        dataSetId,
        setIsLoading,
        projectId,
        pagination.pageSize,
        pagination.pageIndex, // MRT uses 0-based index, ensure service expects 0-based
        setTotalRowSize,
        setPreviewDataList,
        filterModel, // Passing adapted filter model
        sortModel // Passing adapted sort model
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
    sorting
  ]);

  return (
    <MaterialReactTable
      columns={columns}
      data={previewDataList}
      // State Management
      state={{
        columnFilters,
        isLoading,
        pagination,
        sorting,
        showProgressBars: isLoading
      }}
      // Event Handlers
      onColumnFiltersChange={setColumnFilters}
      onPaginationChange={setPagination}
      onSortingChange={setSorting}
      // Server-Side Logic Flags
      manualFiltering={true}
      manualPagination={true}
      manualSorting={true}
      rowCount={Number(totalRowSize)}
      // Styling & Options
      enableRowSelection={false}
      enableColumnActions={false}
      enableDensityToggle={false}
      initialState={{ density: 'compact' }}
      muiTableProps={{
        sx: {
          minHeight: '720px !important', // Adjust this based on your expected total column width
          maxHeight: '720px !important' // Ensure maxHeight is enforced for scroll
        }
      }}
      muiTableContainerProps={{
        sx: {
          height: previewHeight,
          maxHeight: previewHeight,
          overflowX: 'auto'
        }
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
