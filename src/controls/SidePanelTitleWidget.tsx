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
import React from 'react';
import { ReactWidget } from '@jupyterlab/apputils';
import { LabIcon } from '@jupyterlab/ui-components';
import refreshDatasetIcon from '../../style/icons/refresh_icon.svg';
import { CircularProgress } from '@mui/material';
import searchIconLight from '../../style/icons/search_icon.svg';
const iconRefreshDatasetExplorer = new LabIcon({
  name: 'launcher:refresh-dataset-explorer-icon',
  svgstr: refreshDatasetIcon
});

const iconSearchLight = new LabIcon({
  name: 'launcher:search-icon-light',
  svgstr: searchIconLight
});

export const TitleComponent = function ({
  titleStr,
  isPreview,
  getBigQueryProjects,
  onSearchClick,
  isLoading,
  styles
}: {
  titleStr: string;
  isPreview: boolean;
  getBigQueryProjects?: () => void;
  onSearchClick?: () => void;
  isLoading?: boolean;
  styles?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        padding: '10px 14px',
        textTransform: 'none',
        fontFamily: 'Roboto',
        fontSize: '15px',
        fontWeight: 600,
        letterSpacing: 0,
        borderBottom: 'var(--jp-border-width) solid var(--jp-border-color2)',
        background: 'var(--jp-layout-color1)',
        ...styles
      }}
    >
      <div className="dataset-explorer-refresh-container">
        <div>
          <span>{titleStr}</span>
          {isPreview && (
            <span
              style={{
                marginLeft: '5px',
                fontSize: '13px',
                padding: '2px',
                backgroundColor: 'var(--jp-inverse-layout-color2)',
                color: 'var(--jp-ui-inverse-font-color1)'
              }}
            >
              PREVIEW
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span
            onClick={onSearchClick}
            aria-label="Open Dataplex Natural Language Search"
            style={{
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <iconSearchLight.react tag="div" />
          </span>

          {getBigQueryProjects && (
            <span
              onClick={() => {
                if (!isLoading) {
                  getBigQueryProjects();
                }
              }}
              aria-label="dataset-explorer-refresh"
              style={{
                cursor: isLoading ? 'wait' : 'pointer',
                display: 'flex'
              }}
            >
              {isLoading ? (
                <CircularProgress
                  className="spin-loader-custom-style"
                  size={16}
                  aria-label="Loading Spinner"
                />
              ) : (
                <iconRefreshDatasetExplorer.react tag="div" />
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export class TitleWidget extends ReactWidget {
  constructor(private titleStr: string, private isPreview: boolean) {
    super();
    this.node.style.flexShrink = '0';
  }
  render() {
    return (
      <TitleComponent titleStr={this.titleStr} isPreview={this.isPreview} />
    );
  }
}
