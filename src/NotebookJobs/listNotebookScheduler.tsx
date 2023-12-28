import React, { useState } from "react";
import { useTable, usePagination } from 'react-table';
import { ClipLoader } from 'react-spinners';
import TableData from '../utils/tableData';
//import { PaginationView } from '../utils/paginationView';
import { ICellProps } from '../utils/utils';
import { JupyterFrontEnd } from '@jupyterlab/application';

function listNotebookScheduler({ app }: { app: JupyterFrontEnd }) {
        const [templateList ] = useState<any[]>([]);
        const [isLoading ] = useState(true);
        const data = templateList;


        const columns = React.useMemo(
          () => [
            {
              Header: 'Job defination name',
              accessor: 'jobdefinationname'
            },
            {
              Header: 'Inpute files name',
              accessor: 'inputefilesname'
            },
            {
              Header: 'Created At',
              accessor: 'createdat'
            },
            {
              Header: 'Schedule',
              accessor: 'schedule'
            },
            {
              Header: 'Status',
              accessor: 'status'
            },
            {
              Header: 'Actions',
              accessor: 'actions'
            }
          ],
          []
        );

        const {
            getTableProps,
            getTableBodyProps,
            headerGroups,
            rows,
            prepareRow,
            //state,
            //preGlobalFilteredRows,
            // setGlobalFilter,
            page,
            //canPreviousPage,
            //canNextPage,
            //nextPage,
            //previousPage,
            //setPageSize,
            //state: { pageIndex, pageSize }
          } = useTable(
            //@ts-ignore react-table 'columns' which is declared here on type 'TableOptions<ICluster>'
            { columns, data, autoResetPage: false, initialState: { pageSize: 50 } },
            //useGlobalFilter,
            usePagination
          );
        
          const tableDataCondition = (cell: ICellProps) => {
            return (
              <td {...cell.getCellProps()} className="notebook-scheduler-table-data">
                {cell.render('Cell')}
              </td>
            );
          };
        
          return (
            <div>
                <>
                 <div className="notebook-templates-list-table-parent">
                      <TableData
                        getTableProps={getTableProps}
                        headerGroups={headerGroups}
                        getTableBodyProps={getTableBodyProps}
                        isLoading={isLoading}
                        rows={rows}
                        page={page}
                        prepareRow={prepareRow}
                        tableDataCondition={tableDataCondition}
                        fromPage="Notebook Scheduler"
                      />
                        {/* <PaginationView
                          pageSize={pageSize}
                          setPageSize={setPageSize}
                          pageIndex={pageIndex}
                          allData={templateList}
                          previousPage={previousPage}
                          nextPage={nextPage}
                          canPreviousPage={canPreviousPage}
                          canNextPage={canNextPage}
                        /> */}
                    </div>
                  <div>
                    {isLoading && (
                      <div className="spin-loader-main">
                        <ClipLoader
                          color="#3367d6"
                          loading={true}
                          size={18}
                          aria-label="Loading Spinner"
                          data-testid="loader"
                        />
                        Loading Notebook Scheduler
                      </div>
                    )}
                    {!isLoading && (
                      <div className="no-data-style">No rows to display</div>
                    )}
                  </div>
              </>
            </div>
          );
};
export default listNotebookScheduler;