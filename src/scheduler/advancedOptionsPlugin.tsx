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
import {
  Autocomplete,
  Checkbox,
  FormControl,
  FormControlLabel,
  FormGroup,
  Radio,
  RadioGroup,
  TextField
} from '@mui/material';
import { HTTP_METHOD } from '../utils/const';
import { DataprocLoggingService, LOG_LEVEL } from '../utils/loggingService';
import { authenticatedFetch, toastifyCustomStyle } from '../utils/utils';
import { toast } from 'react-toastify';
import { DropdownProps } from 'semantic-ui-react';
import { MuiChipsInput } from 'mui-chips-input';

const AdvancedOptionsComponent = (props: {
  options: Scheduler.IAdvancedOptionsProps;
}) => {
  const [clusterList, setClusterList] = useState([{}]);
  const [serverlessList, setServerlessList] = useState([{}]);
  const [clusterSelected, setClusterSelected] = useState('');
  const [serverlessSelected, setServerlessSelected] = useState('');
  const [retryCount, setRetryCount] = useState<number | undefined>(2);
  const [retryDelay, setRetryDelay] = useState<number | undefined>(5);

  const [emailOnFailure, setEmailOnFailure] = useState(true);
  const [emailOnRetry, setEmailonRetry] = useState(true);
  const [emailList, setEmailList] = useState<string[]>([]);

  const [selectedMode, setSelectedMode] = useState('cluster');
  const [jobDetailTags, setJobDetailTags] = useState<any>({});

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
            return {
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
        let transformClusterListData = allClustersData;

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

  const listSessionTemplatesAPI = async (
    nextPageToken?: string,
    previousSessionTemplatesList?: object
  ) => {
    const pageToken = nextPageToken ?? '';
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('pageSize', '50');
      queryParams.append('pageToken', pageToken);

      const response = await authenticatedFetch({
        uri: 'sessionTemplates',
        regionIdentifier: 'locations',
        method: HTTP_METHOD.GET,
        queryParams: queryParams
      });
      const formattedResponse = await response.json();
      let transformSessionTemplateListData = [];
      if (formattedResponse && formattedResponse.sessionTemplates) {
        transformSessionTemplateListData =
          formattedResponse.sessionTemplates.map((data: any) => {
            return {
              serverlessName: data.jupyterSession.displayName
            };
          });
      }
      const existingSessionTemplateData = previousSessionTemplatesList ?? [];
      //setStateAction never type issue
      const allSessionTemplatesData: any = [
        ...(existingSessionTemplateData as []),
        ...transformSessionTemplateListData
      ];

      if (formattedResponse.nextPageToken) {
        listSessionTemplatesAPI(
          formattedResponse.nextPageToken,
          allSessionTemplatesData
        );
      } else {
        let transformSessionTemplateListData = allSessionTemplatesData;

        const keyLabelStructure = transformSessionTemplateListData.map(
          (obj: { serverlessName: string }) => obj.serverlessName
        );

        setServerlessList(keyLabelStructure);
      }
      if (formattedResponse?.error?.code) {
        toast.error(formattedResponse?.error?.message, toastifyCustomStyle);
      }
    } catch (error) {
      DataprocLoggingService.log(
        'Error listing session templates',
        LOG_LEVEL.ERROR
      );
      console.error('Error listing session templates', error);
      toast.error('Failed to fetch session templates', toastifyCustomStyle);
    }
  };

  const handleAdditionalOptionsModel = (tagKey: string, tagValue: any) => {
    let additionalValues: string[];
    let defaultPayload: any = {
      selectedMode: 'cluster',
      cluster: '',
      serverless: '',
      retryCount: 2,
      retryDelay: 5,
      emailOnFailure: true,
      emailOnRetry: true,
      emailList: []
    };
    if (props.options.model.tags) {
      let currentPayload = JSON.parse(props.options.model.tags[0]);
      currentPayload[tagKey] = tagValue;
      additionalValues = [JSON.stringify(currentPayload)];
    } else {
      defaultPayload[tagKey] = tagValue;
      additionalValues = [JSON.stringify(defaultPayload)];
    }

    //@ts-ignore
    props.options.handleModelChange({
      ...props.options.model,
      tags: additionalValues
    });
  };

  const handleSelectedModeChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setSelectedMode((event.target as HTMLInputElement).value);
    handleAdditionalOptionsModel('selectedMode', event.target.value);
  };

  const handleClusterSelected = (data: DropdownProps | null) => {
    if (data) {
      const selectedCluster = data.toString();
      setClusterSelected(selectedCluster);
      handleAdditionalOptionsModel('cluster', selectedCluster);
    }
  };

  const handleServerlessSelected = (data: DropdownProps | null) => {
    if (data) {
      const selectedServerless = data.toString();
      setServerlessSelected(selectedServerless);
      handleAdditionalOptionsModel('serverless', selectedServerless);
    }
  };

  const handleRetryCount = (data: number) => {
    if (data >= 0) {
      setRetryCount(data);
    }
    handleAdditionalOptionsModel('retryCount', data);
  };

  const handleRetryDelay = (data: number) => {
    if (data >= 0) {
      setRetryDelay(data);
    }
    handleAdditionalOptionsModel('retryDelay', data);
  };

  const handleFailureChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setEmailOnFailure(event.target.checked);
    handleAdditionalOptionsModel('emailOnFailure', event.target.checked);
  };

  const handleRetryChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setEmailonRetry(event.target.checked);
    handleAdditionalOptionsModel('emailOnRetry', event.target.checked);
  };

  const handleEmailList = (data: string[]) => {
    setEmailList(data);
    handleAdditionalOptionsModel('emailList', data);
  };

  useEffect(() => {
    listClustersAPI();
    listSessionTemplatesAPI();
    if (props.options.jobsView === 5 || props.options.jobsView === 6) {
      if (props.options.model.tags) {
        setJobDetailTags(JSON.parse(props.options.model.tags[0]));
      }
    }
  }, []);
  return (
    <>
      {props.options.jobsView === 1 && (
        <div>
          {
            <div className="select-text-overlay-scheduler">
              <FormControl>
                <RadioGroup
                  aria-labelledby="demo-controlled-radio-buttons-group"
                  name="controlled-radio-buttons-group"
                  value={selectedMode}
                  onChange={handleSelectedModeChange}
                  row={true}
                >
                  <FormControlLabel
                    value="cluster"
                    control={<Radio />}
                    label="Cluster"
                  />
                  <FormControlLabel
                    value="serverless"
                    control={<Radio />}
                    label="Serverless"
                  />
                </RadioGroup>
              </FormControl>
              {selectedMode === 'cluster' &&
                (clusterList.length === 0 ? (
                  <Input
                    className="input-style-scheduler"
                    value="No clusters available"
                    readOnly
                  />
                ) : (
                  <Autocomplete
                    options={clusterList}
                    value={clusterSelected}
                    onChange={(_event, val) => handleClusterSelected(val)}
                    renderInput={params => (
                      <TextField {...params} label="Cluster" />
                    )}
                  />
                ))}
              {selectedMode === 'serverless' &&
                (serverlessList.length === 0 ? (
                  <Input
                    className="input-style-scheduler"
                    value="No session templates available"
                    readOnly
                  />
                ) : (
                  <Autocomplete
                    options={serverlessList}
                    value={serverlessSelected}
                    onChange={(_event, val) => handleServerlessSelected(val)}
                    renderInput={params => (
                      <TextField {...params} label="Serverless" />
                    )}
                  />
                ))}
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
              <FormGroup row={true}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={emailOnFailure}
                      onChange={handleFailureChange}
                    />
                  }
                  label="Email on failure"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={emailOnRetry}
                      onChange={handleRetryChange}
                    />
                  }
                  label="Email on retry"
                />
              </FormGroup>
              {(emailOnFailure || emailOnRetry) && (
                <MuiChipsInput
                  className="select-job-style-scheduler"
                  onChange={e => handleEmailList(e)}
                  addOnBlur={true}
                  value={emailList}
                  inputProps={{ placeholder: '' }}
                  label="Email recipients"
                />
              )}
            </div>
          }
        </div>
      )}
      {(props.options.jobsView === 5 || props.options.jobsView === 6) &&
        jobDetailTags.retryCount && (
          <div>
            {jobDetailTags.selectedMode === 'cluster' ? (
              <div className="job-details-scheduler-wrapper">
                <span className="jp-jobs-LabeledValue-label">Cluster</span>
                {jobDetailTags.cluster}
              </div>
            ) : (
              <div className="job-details-scheduler-wrapper">
                <span className="jp-jobs-LabeledValue-label">Serverless</span>
                {jobDetailTags.serverless}
              </div>
            )}
            <div className="job-details-scheduler-wrapper">
              <span className="jp-jobs-LabeledValue-label">Retry count</span>
              {jobDetailTags.retryCount}
            </div>
            <div className="job-details-scheduler-wrapper">
              <span className="jp-jobs-LabeledValue-label">
                Retry delay (in minutes)
              </span>
              {jobDetailTags.retryDelay}
            </div>
            {jobDetailTags.emailList && jobDetailTags.emailList.length > 0 && (
              <div className="job-details-scheduler-wrapper">
                <span className="jp-jobs-LabeledValue-label">
                  Email recipients
                </span>
                {jobDetailTags.emailList.map((emailData: string) => {
                  return <div>{emailData}</div>;
                })}
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
