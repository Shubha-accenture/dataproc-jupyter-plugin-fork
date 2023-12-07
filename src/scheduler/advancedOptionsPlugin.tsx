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
import React, { useEffect, useState } from 'react';
import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import { Scheduler } from '@jupyterlab/scheduler';
import { Input } from '../controls/MuiWrappedInput';
import { Autocomplete, TextField } from '@mui/material';
import { HTTP_METHOD, STATUS_RUNNING } from '../utils/const';
import { DataprocLoggingService, LOG_LEVEL } from '../utils/loggingService';
import {
  authenticatedFetch,
  statusValue,
  toastifyCustomStyle
} from '../utils/utils';
import { toast } from 'react-toastify';
import { DropdownProps } from 'semantic-ui-react';
import { MuiChipsInput } from 'mui-chips-input';

const AdvancedOptionsComponent = (props: {
  options: Scheduler.IAdvancedOptionsProps;
}) => {
  const [clusterList, setClusterList] = useState([{}]);
  const [clusterSelected, setClusterSelected] = useState('');
  const [retryCount, setRetryCount] = useState<number | undefined>(0);
  const [retryDelay, setRetryDelay] = useState<number | undefined>(5);
  const [emailList, setEmailList] = useState<string[]>([]);

  const listClustersAPI = async (
    nextPageToken?: string,
    previousClustersList?: object
  ) => {
    const pageToken = nextPageToken ?? '';
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('pageSize', '50');
      queryParams.append('pageToken', pageToken);

      const response = await authenticatedFetch({
        uri: 'clusters',
        regionIdentifier: 'regions',
        method: HTTP_METHOD.GET,
        queryParams: queryParams
      });
      const formattedResponse = await response.json();
      let transformClusterListData = [];
      if (formattedResponse && formattedResponse.clusters) {
        transformClusterListData = formattedResponse.clusters.map(
          (data: any) => {
            const statusVal = statusValue(data);
            return {
              status: statusVal,
              clusterName: data.clusterName
            };
          }
        );
      }
      const existingClusterData = previousClustersList ?? [];
      //setStateAction never type issue
      const allClustersData: any = [
        ...(existingClusterData as []),
        ...transformClusterListData
      ];

      if (formattedResponse.nextPageToken) {
        listClustersAPI(formattedResponse.nextPageToken, allClustersData);
      } else {
        let transformClusterListData = [];
        transformClusterListData = allClustersData.filter((data: any) => {
          if (data.status === STATUS_RUNNING) {
            return data.clusterName;
          }
        });

        const keyLabelStructure = transformClusterListData.map(
          (obj: { clusterName: string }) => obj.clusterName
        );

        setClusterList(keyLabelStructure);
      }
      if (formattedResponse?.error?.code) {
        toast.error(formattedResponse?.error?.message, toastifyCustomStyle);
      }
    } catch (error) {
      DataprocLoggingService.log('Error listing clusters', LOG_LEVEL.ERROR);
      console.error('Error listing clusters', error);
      toast.error('Failed to fetch clusters', toastifyCustomStyle);
    }
  };

  const handleClusterSelected = (data: DropdownProps | null) => {
    if (data) {
      const selectedCluster = data.toString();
      setClusterSelected(selectedCluster);

      // const newTags = props.options.model.tags ?? [];
      // props.options.handleModelChange({
      //   ...props.options.model,
      //   tags: newTags,
      // });
    }
  };

  const handleRetryCount = (data: number) => {
    setRetryCount(data);
  };

  const handleRetryDelay = (data: number) => {
    setRetryDelay(data);
  };

  const handleEmailList = (data: string[]) => {
    setEmailList(data);
  };

  useEffect(() => {
    listClustersAPI();
  }, []);
  return (
    <>
      {props.options.jobsView === 1 && (
        <div>
          {clusterList.length === 0 ? (
            <Input
              className="input-style-scheduler"
              value="No clusters running"
              readOnly
            />
          ) : (
            <div className="select-text-overlay-scheduler">
              <Autocomplete
                options={clusterList}
                value={clusterSelected}
                onChange={(_event, val) => handleClusterSelected(val)}
                renderInput={params => (
                  <TextField {...params} label="Cluster" />
                )}
              />
              <Input
                className="input-style-scheduler"
                onChange={e => handleRetryCount(Number(e.target.value))}
                value={retryCount}
                Label="Retry count"
                type="number"
              />
              <Input
                className="input-style-scheduler"
                onChange={e => handleRetryDelay(Number(e.target.value))}
                value={retryDelay}
                Label="Retry delay (minutes)"
                type="number"
              />
              <MuiChipsInput
                className="select-job-style-scheduler"
                onChange={e => handleEmailList(e)}
                addOnBlur={true}
                value={emailList}
                inputProps={{ placeholder: '' }}
                label="Email recipients"
              />
            </div>
          )}
        </div>
      )}
    </>
  );
};

export const schedulerAdvancedOptionsPlugin: JupyterFrontEndPlugin<Scheduler.IAdvancedOptions> =
  {
    activate:
      (app: JupyterFrontEnd) => (props: Scheduler.IAdvancedOptionsProps) =>
        <AdvancedOptionsComponent options={props} />,
    id: 'dataproc_jupyter_plugin:IAdvancedOptions',
    provides: Scheduler.IAdvancedOptions,
    autoStart: true
  };
