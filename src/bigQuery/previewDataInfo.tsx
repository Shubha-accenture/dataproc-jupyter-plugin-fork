// /**
//  * @license
//  * Copyright 2024 Google LLC
//  *
//  * Licensed under the Apache License, Version 2.0 (the "License");
//  * you may not use this file except in compliance with the License.
//  * You may obtain a copy of the License at
//  *
//  *   http://www.apache.org/licenses/LICENSE-2.0
//  *
//  * Unless required by applicable law or agreed to in writing, software
//  * distributed under the License is distributed on an "AS IS" BASIS,
//  * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//  * See the License for the specific language governing permissions and
//  * limitations under the License.
//  */
import React, { useEffect, useState, useMemo } from 'react';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Paper, Box, CircularProgress } from '@mui/material';
import { BigQueryService } from './bigQueryService';
import { handleDebounce } from '../utils/utils';

interface IPreviewColumn {
  Header: string;
  accessor: string;
}

const PreviewDataInfo = ({ column, tableId, dataSetId, projectId }: any) => {
  const [previewDataList, setPreviewDataList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalRowSize, setTotalRowSize] = useState('0');
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(50);
  const [previewHeight, setPreviewHeight] = useState(window.innerHeight - 180);
  

  useEffect(() => {
    const handleUpdateHeight = () => setPreviewHeight(window.innerHeight - 180);
    const debounced = handleDebounce(handleUpdateHeight, 500);
    window.addEventListener('resize', debounced);
    return () => window.removeEventListener('resize', debounced);
  }, []);

  const muiColumns: GridColDef[] = useMemo(() => {
    return column.map((col: any) => {
      // 1. Determine the logic type
      let columnType: 'string' | 'number' | 'boolean' = 'string';
      const bqType = col.type?.toUpperCase();

      if (
        ['INTEGER', 'FLOAT', 'NUMERIC', 'DECIMAL', 'INT64', 'FLOAT64'].includes(
          bqType
        )
      ) {
        columnType = 'number';
      } else if (['BOOLEAN', 'BOOL'].includes(bqType)) {
        columnType = 'boolean';
      }

      return {
        field: col.name,
        headerName: col.name,
        type: columnType, // Enables the correct filter icons (=, >, <)
        flex: 1,
        minWidth: 150,

        // 2. Add the valueGetter here
        valueGetter: (value: any) => {
          if (
            columnType === 'number' &&
            value !== null &&
            value !== undefined
          ) {
            const parsed = Number(value);
            return isNaN(parsed) ? value : parsed;
          }
          return value;
        },

        renderCell: (params: any) => {
          if (
            params.value === null ||
            params.value === undefined ||
            params.value === ''
          ) {
            return (
              <Box sx={{ color: 'text.disabled', fontStyle: 'italic' }}>
                null
              </Box>
            );
          }
          return String(params.value);
        }
      };
    });
  }, [column]);

  const serviceColumns: IPreviewColumn[] = useMemo(() => {
    return column.map((col: any) => ({
      Header: col.name,
      accessor: col.name
    }));
  }, [column]);

  useEffect(() => {
    setIsLoading(true);
    BigQueryService.bigQueryPreviewAPIService(
      serviceColumns,
      tableId,
      dataSetId,
      setIsLoading,
      projectId,
      pageSize,
      pageIndex,
      setTotalRowSize,
      setPreviewDataList
    );
  }, [serviceColumns, tableId, dataSetId, projectId, pageSize, pageIndex]);

  return (
    <Paper
      sx={{
        height: previewHeight,
        width: '100%',
        border: '1px solid #e0e0e0',
        boxShadow: 'none'
      }}
    >
      <DataGrid
        className="custom-data-grid"
        rows={previewDataList}
        columns={muiColumns}
        loading={isLoading}
        rowCount={Number(totalRowSize)}
        getRowId={(row: any) => previewDataList.indexOf(row)}
        paginationMode="server"
        paginationModel={{ page: pageIndex, pageSize: pageSize }}
        onPaginationModelChange={model => {
          setPageIndex(model.page);
          setPageSize(model.pageSize);
        }}
        pageSizeOptions={[10, 25, 50, 100]}
        disableRowSelectionOnClick
        density="compact"
        sx={{
          border: 0,
          '& .MuiDataGrid-columnHeaderTitle': { fontWeight: 'bold' },
          '& .MuiDataGrid-cell:focus': { outline: 'none' }
        }}
        slots={{
          noRowsOverlay: () => (
            <Box sx={{ p: 2, textAlign: 'center' }}>No data available</Box>
          ),
          loadingOverlay: () => (
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100%'
              }}
            >
              <CircularProgress size={30} />
            </Box>
          )
        }}
      />
    </Paper>
  );
};

export default PreviewDataInfo;
