/**
 * @license
 * Copyright 2024 Google LLC
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

import React, { Suspense, useEffect, useState, useTransition } from 'react';
import { IThemeManager } from '@jupyterlab/apputils';
import { JupyterLab } from '@jupyterlab/application';
import { DataprocWidget } from '../controls/DataprocWidget';
import BigQueryTableInfo from './bigQueryTableInfo';
import BigQuerySchemaInfo from './bigQuerySchema';
import { BigQueryService } from './bigQueryService';
import { Box, CircularProgress } from '@mui/material';

const BigQueryDataTableInfo = React.lazy(
  () => import('./bigQueryDataTableInfo')
);

interface IDatabaseProps {
  node: any;
  database: string;
  projectId: string;
  app: JupyterLab;
}
const BigQueryTableInfoWrapper = ({
  node,
  database,
  projectId,
  app
}: IDatabaseProps): React.JSX.Element => {
  type Mode = 'Details' | 'Schema' | 'Preview';

  const [selectedMode, setSelectedMode] = useState<Mode>('Details');
  const [schemaInfoResponse, setSchemaInfoResponse] = useState<any>();

  const [isPending, startTransition] = useTransition();

  const selectedModeChange = (mode: Mode) => {
    startTransition(() => {
      setSelectedMode(mode);
    });
  };

  const toggleStyleSelection = (toggleItem: string) => {
    if (selectedMode === toggleItem) {
      return 'selected-header';
    } else {
      return 'unselected-header';
    }
  };

  useEffect(() => {
    BigQueryService.getBigQuerySchemaInfoAPIService(
      database,
      node?.data?.name,
      projectId,
      setSchemaInfoResponse
    );
  }, []);

  return (
    <div className="dpms-Wrapper">
      <div className="table-info-overlay">
        <div className="title-overlay">{node?.data?.name}</div>
        <div className="clusters-list-overlay" role="tab">
          <div
            role="tabpanel"
            className={toggleStyleSelection('Details')}
            onClick={() => selectedModeChange('Details')}
          >
            Details
          </div>
          <div
            role="tabpanel"
            className={toggleStyleSelection('Schema')}
            onClick={() => selectedModeChange('Schema')}
          >
            Schema
          </div>
          <div
            role="tabpanel"
            className={toggleStyleSelection('Preview')}
            onClick={() => selectedModeChange('Preview')}
            style={{ opacity: isPending ? 0.7 : 1 }}
          >
            Preview
          </div>
        </div>
        {selectedMode === 'Details' && (
          <BigQueryTableInfo
            node={node}
            dataset={database}
            projectId={projectId}
          />
        )}
        {selectedMode === 'Schema' &&
          schemaInfoResponse &&
          (schemaInfoResponse.length === 0 ? (
            <div className="no-data-style">No rows to display</div>
          ) : (
            <>
              <div className="db-title">Schema</div>
              <BigQuerySchemaInfo column={schemaInfoResponse} />
            </>
          ))}
        {selectedMode === 'Preview' &&
          schemaInfoResponse &&
          schemaInfoResponse.length > 0 && (
            <>
              <Suspense
                fallback={
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'center',
                      p: 4,
                      mt: 4
                    }}
                  >
                    <CircularProgress />
                  </Box>
                }
              >
                <BigQueryDataTableInfo
                  column={schemaInfoResponse}
                  node={node}
                  dataSetId={database}
                  projectId={projectId}
                  app={app}
                />
              </Suspense>
            </>
          )}
      </div>
    </div>
  );
};

export class BigQueryTableWrapper extends DataprocWidget {
  constructor(
    public treeNode: any,
    private database: string,
    private projectId: string,
    themeManager: IThemeManager,
    private app: JupyterLab
  ) {
    super(themeManager);
  }

  renderInternal(): React.JSX.Element {
    return (
      <BigQueryTableInfoWrapper
        node={this.treeNode}
        database={this.database}
        projectId={this.projectId}
        app={this.app}
      />
    );
  }
}
