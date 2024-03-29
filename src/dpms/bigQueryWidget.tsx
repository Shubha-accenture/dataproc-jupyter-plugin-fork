/**
 * @license
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { JupyterLab } from '@jupyterlab/application';
import React, { useEffect, useState } from 'react';
import { Tree, NodeRendererProps, NodeApi } from 'react-arborist';
import { LabIcon } from '@jupyterlab/ui-components';
import bigQueryProjectIcon from '../../style/icons/bigquery_project_icon.svg';
import datasetIcon from '../../style/icons/dataset_icon.svg';
import tableIcon from '../../style/icons/table_icon.svg';
import columnsIcon from '../../style/icons/columns_icon.svg';
import databaseWidgetIcon from '../../style/icons/database_widget_icon.svg';
import datasetsIcon from '../../style/icons/datasets_icon.svg';
import searchIcon from '../../style/icons/search_icon.svg';
import rightArrowIcon from '../../style/icons/right_arrow_icon.svg';
import downArrowIcon from '../../style/icons/down_arrow_icon.svg';
import searchClearIcon from '../../style/icons/search_clear_icon.svg';
import { Database } from './databaseInfo';
import { MainAreaWidget } from '@jupyterlab/apputils';
import { v4 as uuidv4 } from 'uuid';
import { auto } from '@popperjs/core';
import { Table } from './tableInfo';
import { ClipLoader } from 'react-spinners';
import { IThemeManager } from '@jupyterlab/apputils';
import { IconButton, InputAdornment, TextField } from '@mui/material';
import { TitleComponent } from '../controls/SidePanelTitleWidget';
import { DpmsService } from './dpmsService';
import { authApi } from '../utils/utils';

const iconDatasets = new LabIcon({
  name: 'launcher:datasets-icon',
  svgstr: datasetsIcon
});
const iconDatabaseWidget = new LabIcon({
  name: 'launcher:databse-widget-icon',
  svgstr: databaseWidgetIcon
});
const iconRightArrow = new LabIcon({
  name: 'launcher:right-arrow-icon',
  svgstr: rightArrowIcon
});
const iconDownArrow = new LabIcon({
  name: 'launcher:down-arrow-icon',
  svgstr: downArrowIcon
});
const calculateDepth = (node: NodeApi): number => {
  let depth = 0;
  let currentNode = node;
  while (currentNode.parent) {
    depth++;
    currentNode = currentNode.parent;
  }
  return depth;
};
const BigQueryComponent = ({
  app,
  themeManager
}: {
  app: JupyterLab;
  themeManager: IThemeManager;
}): JSX.Element => {
  const iconSearchClear = new LabIcon({
    name: 'launcher:search-clear-icon',
    svgstr: searchClearIcon
  });
  const iconBigQueryProject = new LabIcon({
    name: 'launcher:bigquery-project-icon',
    svgstr: bigQueryProjectIcon
  });
  const iconDataset = new LabIcon({
    name: 'launcher:dataset-icon',
    svgstr: datasetIcon
  });
  const iconTable = new LabIcon({
    name: 'launcher:table-icon',
    svgstr: tableIcon
  });

  const iconColumns = new LabIcon({
    name: 'launcher:columns-icon',
    svgstr: columnsIcon
  });
  const iconSearch = new LabIcon({
    name: 'launcher:search-icon',
    svgstr: searchIcon
  });

  const [projectNameInfo, setProjectNameInfo] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [notebookValue, setNotebookValue] = useState<string>('');
  const [dataprocMetastoreServices, setDataprocMetastoreServices] =
    useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [noDpmsInstance, setNoDpmsInstance] = useState(false);
  const [entries, setEntries] = useState<string[]>([]);
  const [databaseNames, setDatabaseNames] = useState<string[]>([]);
  const [emptyDatabaseNames, setEmptyDatabaseNames] = useState<any>([]);
  const [schemaError, setSchemaError] = useState(false);
  const [totalDatabases, setTotalDatabases] = useState<number>(0);
  const [totalTables, setTotalTables] = useState<number>(0);
  const [columnResponse, setColumnResponse] = useState<IColumn[]>([]);
  const [databaseDetails, setDatabaseDetails] = useState<
    Record<string, string>
  >({});
  const [tableDescription, setTableDescription] = useState<
    Record<string, string>
  >({});
  const [datasetTableMappingDetails, setDatasetTableMappingDetails] = useState<
    Record<string, string>
  >({});

  const getBigQueryColumnDetails = async (tableId: string) => {
    await DpmsService.getBigQueryColumnDetailsAPIService(
      datasetTableMappingDetails[tableId],
      tableId,
      setColumnResponse,
      setIsLoading
    );
  };

  interface IColumn {
    dataPolicies: any;
    policyTags: any;
    defaultValue: any;
    key: any;
    collation: string;
    tableDescription: string;
    name: string;
    schema: {
      columns: {
        column: string;
        type: string;
        mode: string;
        description: string;
      }[];
    };
    fullyQualifiedName: string;
    displayName: string;
    column: string;
    type: string;
    mode: string;
    description: string;
  }
  interface IDataEntry {
    id: string;
    name: string;
    type: string;
    description: string;
    children: any;
  }

  const databases: { [dbName: string]: { [tableName: string]: IColumn[] } } =
    {};

  columnResponse.forEach((res: any) => {
    /* fullyQualifiedName : dataproc_metastore:projectId.location.metastore_instance.database_name.table_name
      fetching database name from fully qualified name structure */
    const dbName = res.tableReference.datasetId;
    const tableName = res.tableReference.tableId;
    const columns: IColumn[] = res.schema.fields.map(
      (column: {
        name: string;
        type: string;
        mode: string;
        description: string;
        key: string;
        collation: string;
        defaultValue: string;
        policyTags: string;
        dataPolicies: string;
      }) => ({
        name: `${column.name}`,
        schema: res.schema.fields, // Include the schema object
        // fullyQualifiedName: res.fullyQualifiedName,
        // displayName: res.entrySource.displayName,
        // column: res.column, //no response
        type: column.type,
        mode: column.mode,
        key: column.key,
        collation: column.collation,
        defaultValue: column.defaultValue,
        policyTags: column.policyTags,
        dataPolicies: column.dataPolicies,
        tableDescription: res.description,
        description: column.description
      })
    );

    if (!databases[dbName]) {
      databases[dbName] = {};
    }

    if (!databases[dbName][tableName]) {
      databases[dbName][tableName] = [];
    }

    databases[dbName][tableName].push(...columns);
  });

  const data = [
    {
      id: uuidv4(),
      name: projectNameInfo,
      children: Object.entries(databases).map(([dbName, tables]) => ({
        id: uuidv4(),
        name: dbName,
        children: Object.entries(tables).map(([tableName, columns]) => ({
          id: uuidv4(),
          name: tableName,
          description: '',
          children: columns.map((column: IColumn) => ({
            id: uuidv4(),
            name: column.name,
            type: column.type,
            mode: column.mode,
            key: column.key,
            collation: column.collation,
            defaultValue: column.defaultValue,
            policyTags: column.policyTags,
            dataPolicies: column.dataPolicies,
            tableDescription: column.tableDescription,
            description: column.description
          }))
        }))
      }))
    }
  ];

  if (
    data[0].children.length > 0 &&
    data[0].children.length + emptyDatabaseNames.length === totalDatabases
  ) {
    if (
      data[0].children[totalDatabases - emptyDatabaseNames.length - 1].children
        .length === totalTables
    ) {
      emptyDatabaseNames.forEach((databaseName: string) => {
        data[0].children.push({
          id: uuidv4(),
          name: databaseName,
          children: []
        });
      });
    }
  }

  data.sort((a, b) => a.name.localeCompare(b.name));

  data.forEach(db => {
    db.children.sort((a, b) => a.name.localeCompare(b.name));
  });

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };
  const searchMatch = (node: { data: { name: string } }, term: string) => {
    return node.data.name.toLowerCase().includes(term.toLowerCase());
  };
  const openedWidgets: Record<string, boolean> = {};
  const handleNodeClick = (node: NodeApi) => {
    const depth = calculateDepth(node);
    const widgetTitle = node.data.name;
    if (!openedWidgets[widgetTitle]) {
      if (depth === 2) {
        const content = new Database(
          node.data.name,
          dataprocMetastoreServices,
          databaseDetails,
          themeManager
        );
        const widget = new MainAreaWidget<Database>({ content });
        const widgetId = 'node-widget-db';
        widget.id = widgetId;
        widget.title.label = node.data.name;
        widget.title.closable = true;
        widget.title.icon = iconDatabaseWidget;
        app.shell.add(widget, 'main');
        widget.disposed.connect(() => {
          const widgetTitle = widget.title.label;
          delete openedWidgets[widgetTitle];
        });
      } else if (depth === 3 && node.parent) {
        const database = node.parent.data.name;
        const column = node.data.children;

        const content = new Table(
          node.data.name,
          dataprocMetastoreServices,
          database,
          column,
          tableDescription,
          themeManager
        );
        const widget = new MainAreaWidget<Table>({ content });
        const widgetId = `node-widget-${uuidv4()}`;
        widget.id = widgetId;
        widget.title.label = node.data.name;
        widget.title.closable = true;
        widget.title.icon = iconDatasets;
        app.shell.add(widget, 'main');
        widget.disposed.connect(() => {
          const widgetTitle = widget.title.label;
          delete openedWidgets[widgetTitle];
        });
      }
      openedWidgets[widgetTitle] = node.data.name;
    }
  };
  const handleSearchClear = () => {
    setSearchTerm('');
  };
  type NodeProps = NodeRendererProps<IDataEntry> & {
    onClick: (node: NodeRendererProps<IDataEntry>['node']) => void;
  };
  const Node = ({ node, style, onClick }: NodeProps) => {
    const handleToggle = () => {
      node.toggle();
    };
    const handleIconClick = (event: React.MouseEvent) => {
      if (event.currentTarget.classList.contains('caret-icon')) {
        handleToggle();
      }
    };
    const handleTextClick = (event: React.MouseEvent) => {
      event.stopPropagation();
      onClick(node);
    };
    const renderNodeIcon = () => {
      const depth = calculateDepth(node);
      const hasChildren = node.children && node.children.length > 0;
      const arrowIcon = hasChildren ? (
        node.isOpen ? (
          <>
            <div
              role="treeitem"
              className="caret-icon right"
              onClick={handleIconClick}
            >
              <iconDownArrow.react
                tag="div"
                className="icon-white logo-alignment-style"
              />
            </div>
          </>
        ) : (
          <div
            role="treeitem"
            className="caret-icon down"
            onClick={handleIconClick}
          >
            <iconRightArrow.react
              tag="div"
              className="icon-white logo-alignment-style"
            />
          </div>
        )
      ) : (
        <div style={{ width: '29px' }}></div>
      );
      if (searchTerm) {
        const arrowIcon = hasChildren ? (
          node.isOpen ? (
            <>
              <div
                role="treeitem"
                className="caret-icon right"
                onClick={handleIconClick}
              >
                <iconDownArrow.react
                  tag="div"
                  className="icon-white logo-alignment-style"
                />
              </div>
            </>
          ) : (
            <div
              role="treeitem"
              className="caret-icon down"
              onClick={handleIconClick}
            >
              <iconRightArrow.react
                tag="div"
                className="icon-white logo-alignment-style"
              />
            </div>
          )
        ) : (
          <div style={{ width: '29px' }}></div>
        );
        if (depth === 1) {
          return (
            <>
              {arrowIcon}
              <div role="img" className="db-icon" onClick={handleIconClick}>
                <iconBigQueryProject.react
                  tag="div"
                  className="icon-white logo-alignment-style"
                />
              </div>
            </>
          );
        } else if (depth === 2) {
          return (
            <>
              {arrowIcon}
              <div role="img" className="db-icon" onClick={handleIconClick}>
                <iconDataset.react
                  tag="div"
                  className="icon-white logo-alignment-style"
                />
              </div>
            </>
          );
        } else if (depth === 3) {
          return (
            <>
              {arrowIcon}
              <div role="img" className="table-icon" onClick={handleIconClick}>
                <iconTable.react
                  tag="div"
                  className="icon-white logo-alignment-style"
                />
              </div>
            </>
          );
        }

        return (
          <>
            <iconColumns.react
              tag="div"
              className="icon-white logo-alignment-style"
            />
          </>
        );
      }
      if (depth === 1) {
        return (
          <>
            {arrowIcon}
            <div role="img" className="db-icon" onClick={handleIconClick}>
              <iconBigQueryProject.react
                tag="div"
                className="icon-white logo-alignment-style"
              />
            </div>
          </>
        );
      } else if (depth === 2) {
        return (
          <>
            {arrowIcon}
            <div role="img" className="db-icon" onClick={handleIconClick}>
              <iconDataset.react
                tag="div"
                className="icon-white logo-alignment-style"
              />
            </div>
          </>
        );
      } else if (depth === 3) {
        return (
          <>
            {arrowIcon}
            <div role="img" className="table-icon" onClick={handleIconClick}>
              <iconTable.react
                tag="div"
                className="icon-white logo-alignment-style"
              />
            </div>
          </>
        );
      }

      return (
        <>
          <iconColumns.react
            tag="div"
            className="icon-white logo-alignment-style"
          />
        </>
      );
    };

    return (
      <div style={style}>
        {renderNodeIcon()}
        <div
          role="treeitem"
          title={
            node.data.children && node.data.children.length > 0
              ? node.data.children[0]?.tableDescription
              : ''
          }
          onClick={handleTextClick}
        >
          {node.data.name}
        </div>
        <div className="dpms-column-type-text">{node.data.type}</div>
      </div>
    );
  };

  const getBigQueryDatasets = async () => {
    const credentials: any = await authApi();
    if (credentials) {
      setProjectNameInfo(credentials.project_id);
    }
    await DpmsService.getBigQueryDatasetsAPIService(
      notebookValue,
      setDatabaseDetails,
      setDatabaseNames,
      setTotalDatabases,
      setSchemaError,
      setEntries,
      setTableDescription
    );
  };

  const getBigQueryTables = async (datasetId: string) => {
    await DpmsService.getBigQueryTableAPIService(
      notebookValue,
      datasetId,
      setDatabaseDetails,
      setDatabaseNames,
      setEmptyDatabaseNames,
      setTotalDatabases,
      setTotalTables,
      setSchemaError,
      setEntries,
      setTableDescription,
      setDatasetTableMappingDetails
    );
  };

  const getActiveNotebook = () => {
    const notebookVal = localStorage.getItem('notebookValue');
    if (notebookVal?.includes('bigframes')) {
      setNotebookValue('bigframes');
      setDataprocMetastoreServices('bigframes');
    } else {
      setNoDpmsInstance(true);
    }
  };
  useEffect(() => {
    getActiveNotebook();
    return () => {
      setNotebookValue('');
    };
  }, [notebookValue]);

  useEffect(() => {
    getBigQueryDatasets();
  }, [dataprocMetastoreServices]);

  useEffect(() => {
    Promise.all(databaseNames.map(db => getBigQueryTables(db)))
      .then(results => {})
      .catch(error => {
        console.log(error);
      });
  }, [databaseNames]);

  useEffect(() => {
    Promise.all(entries.map(entry => getBigQueryColumnDetails(entry)))
      .then(results => {})
      .catch(error => {
        console.log(error);
      });
  }, [entries]);

  return (
    <div className="dpms-Wrapper">
      <TitleComponent titleStr="Dataset Explorer" isPreview />
      {!noDpmsInstance ? (
        <>
          <div>
            {isLoading ? (
              <div className="database-loader">
                <div>
                  <ClipLoader
                    color="#3367d6"
                    loading={true}
                    size={20}
                    aria-label="Loading Spinner"
                    data-testid="loader"
                  />
                </div>
                Loading databases
              </div>
            ) : (
              <>
                <div className="search-field">
                  <TextField
                    placeholder="Search your DBs and tables"
                    type="text"
                    variant="outlined"
                    fullWidth
                    size="small"
                    onChange={handleSearch}
                    value={searchTerm}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <iconSearch.react
                            tag="div"
                            className="icon-white logo-alignment-style"
                          />
                        </InputAdornment>
                      ),
                      endAdornment: searchTerm && (
                        <IconButton
                          aria-label="toggle password visibility"
                          onClick={handleSearchClear}
                        >
                          <iconSearchClear.react
                            tag="div"
                            className="icon-white logo-alignment-style search-clear-icon"
                          />
                        </IconButton>
                      )
                    }}
                  />
                </div>
                <div className="tree-container">
                  {data[0].children.length === totalDatabases ? (
                    <Tree
                      className="dataset-tree"
                      initialData={data}
                      openByDefault={false}
                      indent={24}
                      width={auto}
                      height={675}
                      rowHeight={36}
                      overscanCount={1}
                      paddingTop={30}
                      paddingBottom={10}
                      padding={25}
                      searchTerm={searchTerm}
                      searchMatch={searchMatch}
                      idAccessor={node => node.id}
                    >
                      {(props: NodeRendererProps<any>) => (
                        <Node {...props} onClick={handleNodeClick} />
                      )}
                    </Tree>
                  ) : (
                    ''
                  )}
                </div>
              </>
            )}
          </div>
        </>
      ) : schemaError ? (
        <div className="dpms-error">No schema available</div>
      ) : (
        <div className="dpms-error">DPMS schema explorer not set up</div>
      )}
    </div>
  );
};

export default BigQueryComponent;