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
  type MRT_PaginationState,
  type MRT_GroupingState // 1. Import Grouping Type
} from 'material-react-table';
import { Box } from '@mui/material';
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

  // 2. Add Grouping State
  const [grouping, setGrouping] = useState<MRT_GroupingState>([]);

  // Debounce State for Filtering
  const [debouncedColumnFilters, setDebouncedColumnFilters] =
    useState<MRT_ColumnFiltersState>([]);

  // Handle Window Resize
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

      if (
        ['INTEGER', 'FLOAT', 'NUMERIC', 'DECIMAL', 'INT64', 'FLOAT64'].includes(
          bqType
        )
      ) {
        filterVariant = 'range';
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
        // Enable grouping for all columns by default
        enableGrouping: true,
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
        sortModel
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
      // 3. Enable Grouping Features
      enableGrouping={true}
      groupedColumnMode="reorder" // Matches the demo default
      // State Management
      state={{
        columnFilters,
        isLoading,
        pagination,
        sorting,
        grouping, // Pass grouping state here
        showProgressBars: isLoading
      }}
      // Event Handlers
      onColumnFiltersChange={setColumnFilters}
      onPaginationChange={setPagination}
      onSortingChange={setSorting}
      onGroupingChange={setGrouping} // Pass grouping setter here
      // Server-Side Logic Flags
      manualFiltering={true}
      manualPagination={true}
      manualSorting={true}
      rowCount={Number(totalRowSize)}
      // Styling & Options
      enableRowSelection={false}
      enableColumnActions={true}
      enableDensityToggle={false}
      initialState={{ density: 'compact' }}
      muiTableProps={{
        sx: {
          minHeight: '720px !important',
          maxHeight: '720px !important'
        }
      }}
      muiTableContainerProps={{
        sx: {
          height: previewHeight,
          maxHeight: previewHeight,
          overflowX: 'auto'
        },
        onDragStart: e => {
          // Allows MRT to handle the start, but hides it from Jupyter
          e.stopPropagation();
        },
        onDragOver: e => {
          // Critical: Prevents Jupyter from cancelling the "drop" potential
          e.stopPropagation();
        },
        onDrop: e => {
          // Ensures the final drop event stays within the React Tree
          e.stopPropagation();
        }
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
