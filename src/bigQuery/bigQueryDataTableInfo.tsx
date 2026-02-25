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

import React, {
  useEffect,
  useState,
  useMemo,
  useCallback,
  useRef
} from 'react';
import { Notification } from '@jupyterlab/apputils';
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
  Tooltip
} from '@mui/material';
import { BigQueryService } from './bigQueryService';
import {
  AggregationRule,
  BigQueryDataTableInfoProps,
  GridFilterModel,
  GridSortModel,
  IPreviewColumn
} from '../interfaces/bigQuery/BigQueryDataTableInfoInterface';
import { isNumericType } from '../utils/utils';
import { COPY_SQL_QUERY_BTN_TEXT, DEFAULT_SQL_QUERY } from '../utils/const';
import { BigQueryTableAddButton } from './BigQueryDataTableInfo.styles';
import AddAggregationIcon from '../../style/icons/add_icon_aggregation.svg';
import { LabIcon } from '@jupyterlab/ui-components';
import { transformBigQueryRows } from '../utils/bigQueryHelper';

const iconAddAggregation = new LabIcon({
  name: 'launcher:add-aggregation-icon',
  svgstr: AddAggregationIcon
});

const BigQueryDataTableInfo: React.FC<BigQueryDataTableInfoProps> = ({
  column,
  node,
  dataSetId,
  projectId,
  app
}) => {
  // Data State
  const [previewDataList, setPreviewDataList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalRowSize, setTotalRowSize] = useState('0');
  const [generatedSql, setGeneratedSql] = useState<string>('');

  // MRT State
  const [columnFilters, setColumnFilters] = useState<MRT_ColumnFiltersState>(
    []
  );
  const [debouncedColumnFilters, setDebouncedColumnFilters] =
    useState<MRT_ColumnFiltersState>([]);
  const [sorting, setSorting] = useState<MRT_SortingState>([]);
  const [pagination, setPagination] = useState<MRT_PaginationState>({
    pageIndex: 0,
    pageSize: 50
  });
  const [grouping, setGrouping] = useState<MRT_GroupingState>([]);

  // Aggregation State
  const [aggregations, setAggregations] = useState<AggregationRule[]>([]);
  const [selectedAggFunc, setSelectedAggFunc] = useState<string>('');
  const [selectedAggCol, setSelectedAggCol] = useState<string>('');

  // UI State
  const [previewHeight, setPreviewHeight] = useState(500);

  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * Determines whether to show the aggregation panel based on the presence of active groupings.
   */
  const showAggregationPanel = useMemo(() => grouping.length > 0, [grouping]);

  /**
   * Handle aggregation addition and removal
   */
  const handleAddAggregation = useCallback(() => {
    if (selectedAggFunc && selectedAggCol) {
      setAggregations(prev => [
        ...prev,
        { func: selectedAggFunc, col: selectedAggCol }
      ]);
      setSelectedAggFunc('');
      setSelectedAggCol('');
    }
  }, [selectedAggFunc, selectedAggCol]);

  /**
   * Removes an aggregation rule at the specific index
   * @param {Number} index The index of the aggregation rule to remove
   */
  const handleRemoveAggregation = useCallback((index: number) => {
    setAggregations(prev => prev.filter((_, i) => i !== index));
  }, []);

  /**
   * Handles copying the generated SQL query to a new Jupyter notebook cell and inserts the SQL query into the active cell.
   */
  const handleCopySQLQuery = useCallback(async () => {
    if (!generatedSql) return;

    try {
      const notebookPanel = await app.commands.execute('notebook:create-new', {
        kernelName: 'python3'
      });

      if (notebookPanel) {
        if (notebookPanel.context?.ready) {
          await notebookPanel.context.ready;
        } else {
          await new Promise(resolve => setTimeout(resolve, 500));
        }

        if (notebookPanel.id) {
          app.shell.activateById(notebookPanel.id);
        }

        const activeCell = notebookPanel.content?.activeCell;
        const sqlText = `%%bqsql\n${generatedSql}`;

        if (activeCell?.model?.sharedModel) {
          activeCell.model.sharedModel.setSource(sqlText);
        } else if (activeCell?.model?.value) {
          activeCell.model.value.text = sqlText;
        } else {
          await app.commands.execute('notebook:replace-selection', {
            text: sqlText
          });
        }
      }
    } catch (error) {
      console.error('Error creating notebook:', error);
    }
  }, [app, generatedSql]);

  /**
   * Render a cell value
   * @params cell, row - the cell and row objects from MRT, colName - the column name to access the value
   */
  const renderCell = useCallback(({ cell, row }: any, colName: string) => {
    let val = cell.getValue();
    if (val === undefined || val === null) {
      val = row?.original?.[colName];
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
  }, []);

  /**
   * Column definitions for Material React Table, memoized to prevent unnecessary re-renders. Determines filter type and cell rendering based on BigQuery data types.
   */
  const columns = useMemo<MRT_ColumnDef<any>[]>(() => {
    if (!column) return [];

    return column.map(col => {
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

      return {
        accessorKey: col.name,
        header: col.name,
        filterVariant,
        size,
        enableGrouping: true,
        Cell: props => renderCell(props, col.name),
        GroupedCell: props => renderCell(props, col.name),
        AggregatedCell: props => renderCell(props, col.name)
      };
    });
  }, [column, renderCell]);

  /**
   * Service columns are derived from the original column metadata and are used for API calls
   */
  const serviceColumns: IPreviewColumn[] = useMemo(() => {
    return (
      column?.map(col => ({
        Header: col.name,
        accessor: col.name
      })) || []
    );
  }, [column]);

  /**
   * Fetches preview data from the BigQuery API based on the current state of filters, sorting, pagination, grouping, and aggregations. Updates the loading state and total row size accordingly.
   */
  const fetchBigQueryTableData = useCallback(async () => {
    // Cancel the previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setIsLoading(true);

    const sortModel: GridSortModel = sorting.map(sort => ({
      field: sort.id,
      sort: sort.desc ? 'desc' : 'asc'
    }));

    const filterModel: GridFilterModel = {
      items: debouncedColumnFilters.map(filter => ({
        field: filter.id as string,
        operator: Array.isArray(filter.value) ? 'between' : 'contains',
        value: filter.value
      }))
    };

    try {
      const data = await BigQueryService.bigQueryPreviewAPIService(
        node?.data?.name,
        dataSetId,
        projectId,
        pagination.pageSize,
        pagination.pageIndex,
        filterModel,
        sortModel,
        grouping,
        aggregations,
        abortControllerRef.current.signal
      );

      if (!data?.rows || data.totalRows === 0) {
        setPreviewDataList([]);
        setTotalRowSize('0');
      } else {
        const transformedData = transformBigQueryRows(
          data.rows,
          serviceColumns
        );

        setPreviewDataList(transformedData);
        setTotalRowSize((data.totalRows || 0).toString());
        if (data.sqlQuery) setGeneratedSql(data.sqlQuery);
      }
    } catch (error: any) {
      // Ignore AbortErrors as they are intentional when overriding previous requests
      if (error.name === 'AbortError') return;

      Notification.emit(
        `Error in calling BigQuery Preview API: ${error.message || error}`,
        'error',
        { autoClose: 5000 }
      );
      setPreviewDataList([]);
    } finally {
      // Ensure we don't turn off loading if another request was just fired
      if (!abortControllerRef.current?.signal.aborted) {
        setIsLoading(false);
      }
    }
  }, [
    serviceColumns,
    node?.data?.name,
    dataSetId,
    projectId,
    pagination.pageSize,
    pagination.pageIndex,
    debouncedColumnFilters,
    sorting,
    grouping,
    aggregations
  ]);

  /**
   * Handle table state
   * @returns an object containing the current state of column filters, loading status, pagination, sorting, grouping, and whether to show progress bars.
   */
  const tableState = useMemo(
    () => ({
      columnFilters,
      isLoading,
      pagination,
      sorting,
      grouping,
      showProgressBars: isLoading
    }),
    [columnFilters, isLoading, pagination, sorting, grouping]
  );

  /**
   * Handle dynamic height based on window size and event handlers to prevent drag-and-drop interactions from propagating to parent elements.
   * @returns an object containing styles for height, maxHeight, overflow, and flexGrow, as well as event handlers for drag events that stop propagation.
   */
  const muiTableContainerProps = useMemo(
    () => ({
      sx: {
        height: `${previewHeight}px`,
        maxHeight: `${previewHeight}px`,
        overflowX: 'auto',
        flexGrow: 1
      },
      onDragStart: (e: React.DragEvent) => e.stopPropagation(),
      onDragOver: (e: React.DragEvent) => e.stopPropagation(),
      onDrop: (e: React.DragEvent) => e.stopPropagation()
    }),
    [previewHeight]
  );

  /**
   * Renders internal toolbar actions including filter toggle, column visibility toggle, and a button to copy the generated SQL query to a new notebook.
   * @returns a JSX element containing the toolbar actions.
   */
  const renderToolbarInternalActions = useCallback(
    ({ table }: any) => (
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
              variant="text"
              color="primary"
              size="small"
              onClick={handleCopySQLQuery}
              disabled={isLoading}
              sx={{ textTransform: 'none', border: 'none' }}
            >
              {COPY_SQL_QUERY_BTN_TEXT}
            </Button>
          </span>
        </Tooltip>
      </Box>
    ),
    [generatedSql, isLoading, handleCopySQLQuery]
  );

  /**
   * Renders the top toolbar which includes the default MRT toolbar and an additional aggregation panel that allows users to select aggregation functions and columns when grouping is active. Displays active aggregations as chips that can be removed.
   * @returns a JSX element containing the top toolbar and aggregation panel.
   */
  const renderTopToolbar = useCallback(
    ({ table }: any) => (
      <Box>
        <MRT_TopToolbar table={table} />
        {showAggregationPanel && (
          <Box
            sx={{
              p: '8px 16px',
              borderBottom: '1px solid #e0e0e0',
              '& .MuiChip-root': {
                backgroundColor: '#C2E7FF !important',
                color: '#004A77' // Ensures the text remains readable
              }
            }}
          >
            <Stack direction="row" spacing={2} alignItems="center">
              <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel sx={{ color: '#5F6368' }}>Aggregation</InputLabel>
                <Select
                  value={selectedAggFunc}
                  label="Aggregation"
                  onChange={e => setSelectedAggFunc(e.target.value)}
                >
                  {['MIN', 'MAX', 'SUM', 'AVG', 'COUNT'].map(func => (
                    <MenuItem key={func} value={func}>
                      {func}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel sx={{ color: '#5F6368' }}>Column</InputLabel>
                <Select
                  value={selectedAggCol}
                  label="Column"
                  onChange={e => setSelectedAggCol(e.target.value)}
                >
                  {column
                    ?.filter(
                      col =>
                        isNumericType(col.type) && !grouping.includes(col.name)
                    )
                    .map(col => (
                      <MenuItem
                        key={col.name}
                        value={col.name}
                        disabled={aggregations.some(
                          agg => agg.col === col.name
                        )}
                      >
                        {col.name}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>

              {(() => {
                const addDisabled = !selectedAggFunc || !selectedAggCol;
                return (
                  <BigQueryTableAddButton
                    variant="outlined"
                    size="small"
                    onClick={handleAddAggregation}
                    disabled={addDisabled}
                    startIcon={
                      <span
                        style={{
                          paddingTop: '4px',
                          opacity: addDisabled ? 0.5 : 1,
                          filter: addDisabled ? 'grayscale(100%)' : 'none',
                          pointerEvents: 'none'
                        }}
                      >
                        <iconAddAggregation.react />
                      </span>
                    }
                  >
                    Add
                  </BigQueryTableAddButton>
                );
              })()}
            </Stack>

            {aggregations.length > 0 && (
              <Stack
                direction="row"
                spacing={1}
                sx={{ mt: 2, flexWrap: 'wrap', gap: 1 }}
              >
                <Typography
                  variant="body2"
                  sx={{ alignSelf: 'center', mr: 1, color: 'text.secondary' }}
                >
                  Aggregations:
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
    ),
    [
      showAggregationPanel,
      selectedAggFunc,
      selectedAggCol,
      column,
      grouping,
      aggregations,
      handleAddAggregation,
      handleRemoveAggregation
    ]
  );

  /**
   * Renders a fallback UI when there are no rows to display in the table, showing a message indicating that no data is available.
   * @returns a JSX element containing the fallback message.
   */
  const renderEmptyRowsFallback = useCallback(
    () => (
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
    ),
    []
  );

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedColumnFilters(columnFilters);
    }, 300);
    return () => clearTimeout(handler);
  }, [columnFilters]);

  useEffect(() => {
    const calculateHeight = () => {
      let offset = 300;
      if (showAggregationPanel) offset += 100;
      setPreviewHeight(Math.max(300, window.innerHeight - offset));
    };

    calculateHeight();
    window.addEventListener('resize', calculateHeight);
    return () => window.removeEventListener('resize', calculateHeight);
  }, [showAggregationPanel]);

  useEffect(() => {
    if (grouping.length === 0) {
      setAggregations([]);
    }
  }, [grouping]);

  useEffect(() => {
    fetchBigQueryTableData();
  }, [fetchBigQueryTableData]);

  useEffect(() => {
    if (!generatedSql) {
      setGeneratedSql(
        `${DEFAULT_SQL_QUERY} ${projectId}.${dataSetId}.${node?.data?.name}`
      );
    }
  }, [generatedSql, projectId, dataSetId, node?.data?.name]);

  return (
    <MaterialReactTable
      columns={columns}
      data={previewDataList}
      enableGrouping={true}
      groupedColumnMode={false}
      enableExpanding={false}
      isMultiSortEvent={() => true}
      maxMultiSortColCount={3}
      state={tableState}
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
      renderToolbarInternalActions={renderToolbarInternalActions}
      renderTopToolbar={renderTopToolbar}
      enableRowSelection={false}
      enableColumnActions={true}
      enableDensityToggle={false}
      initialState={{ density: 'compact' }}
      muiTableProps={{ sx: { tableLayout: 'fixed' } }}
      muiTableContainerProps={muiTableContainerProps as any}
      muiTableHeadCellProps={{ onDragStart: e => e.stopPropagation() }}
      renderEmptyRowsFallback={renderEmptyRowsFallback}
    />
  );
};

export default BigQueryDataTableInfo;
