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
    return column.map((col: any) => ({
      field: col.name,
      headerName: col.name,
      flex: 1,
      minWidth: 150,
      renderCell: (params: any) => {
        if (
          params.value === null ||
          params.value === undefined ||
          params.value === ''
        ) {
          return (
            <Box sx={{ color: 'text.disabled', fontStyle: 'italic' }}>null</Box>
          );
        }
        return String(params.value);
      }
    }));
  }, [column]);

  useEffect(() => {
    // const dataSetterWrapper = (rawData: any[]) => {
    //   setIsLoading(false);

    //   // DEBUG LOG 1: See the raw structure from BigQuery
    //   console.log("RAW DATA FROM SERVICE:", rawData);

    //   if (Array.isArray(rawData) && rawData.length > 0) {
    //     const transformedRows = rawData.map((row, rowIndex) => {
    //       const newRow: any = { id: `row-${pageIndex}-${rowIndex}` };

    //       let rowValues: any[] = [];

    //       // DEBUG LOG 2: See an individual row structure
    //       if (rowIndex === 0) console.log("INDIVIDUAL ROW STRUCTURE:", row);

    //       if (row.f && Array.isArray(row.f)) {
    //         rowValues = row.f.map((item: any) => item.v);
    //       } else if (Array.isArray(row)) {
    //         rowValues = row;
    //       } else if (typeof row === 'object' && row !== null) {
    //         // If it's an object, check if it has the keys we need or just values
    //         rowValues = Object.values(row);
    //       }

    //       // DEBUG LOG 3: See the extracted values before mapping
    //       if (rowIndex === 0) console.log("EXTRACTED VALUES ARRAY:", rowValues);

    //       column.forEach((col: any, colIndex: number) => {
    //         newRow[col.name] = rowValues[colIndex] ?? null;
    //       });

    //       return newRow;
    //     });

    //     setPreviewDataList(transformedRows);
    //   } else {
    //     setPreviewDataList([]);
    //   }
    // };

    setIsLoading(true);
    // BigQueryService.bigQueryPreviewAPIService(
    //   muiColumns as any,
    //   tableId,
    //   dataSetId,
    //   setIsLoading,
    //   projectId,
    //   pageSize,
    //   pageIndex,
    //   setTotalRowSize,
    //   dataSetterWrapper
    // );
    // Inside PreviewDataInfo.tsx
    BigQueryService.bigQueryPreviewAPIService(
      muiColumns,
      tableId,
      dataSetId,
      setIsLoading,
      projectId,
      pageSize,
      pageIndex,
      setTotalRowSize,
      setPreviewDataList // Back to the normal setter!
    );
  }, [pageSize, pageIndex, tableId, dataSetId, projectId, column]);

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
        getRowId={(row: any) => {
          // If your data ever has a unique column like 'uuid', use that.
          // Otherwise, we use the row's position in the current list.
          return previewDataList.indexOf(row);
        }}
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
