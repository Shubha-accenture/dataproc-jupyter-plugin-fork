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
import React, { useEffect, useState } from 'react';
import { Input } from '../controls/MuiWrappedInput';
import {
  Autocomplete,
  Checkbox,
  FormControlLabel,
  FormGroup,
  TextField,
  Typography
} from '@mui/material';
import { MuiChipsInput } from 'mui-chips-input';
import 'react-js-cron/dist/styles.css';
import { SchedulerService } from './schedulerServices';
import { LabIcon } from '@jupyterlab/ui-components';
import errorIcon from '../../style/icons/error_icon.svg';
//import { Button } from '@mui/material';
import Grid from '@mui/material/Grid';
import { eventEmitter } from '../utils/signalEmitter';

interface IDagList {
  jobid: string;
  notebookname: string;
  schedule: string;
  scheduleInterval: string;
}

const iconError = new LabIcon({
  name: 'launcher:error-icon',
  svgstr: errorIcon
});

interface IJobPayload {
  job_name: string;
  composer_environment_name: string;
  email_failure: boolean;
  email_delay: boolean;
  email_success: boolean;
  email_ids: string[];
}

const JobForm = ({
  jobPayload: initialJobPayload,
  setJobPayload
}: {
  jobPayload: IJobPayload;
  setJobPayload: any;
}) => {
  const [composerList, setComposerList] = useState<string[]>([]);
  const [jobNameValidation, setJobNameValidation] = useState(true);
  const [jobNameSpecialValidation, setJobNameSpecialValidation] =
    useState(false);
  const [jobNameUniqueValidation, setJobNameUniqueValidation] = useState(true);
  const [dagList, setDagList] = useState<IDagList[]>([]);
  const [editMode] = useState(false);
  const [dagListCall, setDagListCall] = useState(false);
  const [isJobFormVisible, setIsJobFormVisible] = useState(true);

  console.log("daglist",dagListCall);
  eventEmitter.on('closeJobForm', () => {
    setIsJobFormVisible(false);
  });

  eventEmitter.on('closeTaskForm', () => {
    setIsJobFormVisible(true);
  });

  const listComposersAPI = async () => {
    await SchedulerService.listComposersAPIService(setComposerList);
  };

  const handleComposerSelected = (data: string | null) => {
    if (data) {
      const selectedComposer = data.toString();
      setJobPayload((prev: any) => ({
        ...prev,
        composer_environment_name: selectedComposer
      }));
      if (selectedComposer) {
        const unique = getDaglist(selectedComposer);
        if (!unique) {
          setJobNameUniqueValidation(true);
        }
      }
    }
  };
  const getDaglist = async (composer: string) => {
    setDagListCall(true);
    try {
      await SchedulerService.listDagInfoAPIServiceForCreateNotebook(
        setDagList,
        composer
      );
      setDagListCall(false);
      return true;
    } catch (error) {
      setDagListCall(false);
      console.error('Error checking job name uniqueness:', error);
      return false;
    }
  };

  const handleFailureChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setJobPayload((prev: any) => ({
      ...prev,
      email_failure: event.target.checked
    }));
  };

  const handleRetryChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setJobPayload((prev: any) => ({
      ...prev,
      email_delay: event.target.checked
    }));
  };

  const handleSuccessChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setJobPayload((prev: any) => ({
      ...prev,
      email_success: event.target.checked
    }));
  };

  const handleEmailList = (data: string[]) => {
    setJobPayload((prev: any) => ({
      ...prev,
      email_ids: data
    }));
  };

  const handleJobNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    event.target.value.length > 0
      ? setJobNameValidation(true)
      : setJobNameValidation(false);

    //Regex to check job name must contain only letters, numbers, hyphens, and underscores
    const regexp = /^[a-zA-Z0-9-_]+$/;
    event.target.value.search(regexp)
      ? setJobNameSpecialValidation(true)
      : setJobNameSpecialValidation(false);

    console.log(event.target.value);

    setJobPayload((prev: any) => ({
      ...prev,
      job_name: event.target.value
    }));
  };

  useEffect(() => {
    listComposersAPI();
  }, []);

  useEffect(() => {
    if (
      initialJobPayload.composer_environment_name !== '' &&
      dagList.length > 0
    ) {
      const isUnique = !dagList.some(
        dag => dag.notebookname === initialJobPayload.job_name
      );
      setJobNameUniqueValidation(isUnique);
    }
  }, [
    dagList,
    initialJobPayload.job_name,
    initialJobPayload.composer_environment_name
  ]);
  //console.log(initialJobPayload);
  return (
    <>
      <Grid container spacing={0} style={{ height: '100vh' }}>
        {isJobFormVisible && (
          <Grid item xs={3}>
            <div>
              <div className="submit-job-container">
                <div className="create-scheduler-form-element">
                  <Input
                    className="create-scheduler-style"
                    value={initialJobPayload.job_name}
                    onChange={e => handleJobNameChange(e)}
                    type="text"
                    placeholder=""
                    Label="Job name*"
                    disabled={editMode}
                  />
                </div>
                {!jobNameValidation && !editMode && (
                  <div className="error-key-parent">
                    <iconError.react
                      tag="div"
                      className="logo-alignment-style"
                    />
                    <div className="error-key-missing">Name is required</div>
                  </div>
                )}
                {jobNameSpecialValidation && jobNameValidation && !editMode && (
                  <div className="error-key-parent">
                    <iconError.react
                      tag="div"
                      className="logo-alignment-style"
                    />
                    <div className="error-key-missing">
                      Name must contain only letters, numbers, hyphens, and
                      underscores
                    </div>
                  </div>
                )}
                {!jobNameUniqueValidation && !editMode && (
                  <div className="error-key-parent">
                    <iconError.react
                      tag="div"
                      className="logo-alignment-style"
                    />
                    <div className="error-key-missing">
                      Job name must be unique for the selected environment
                    </div>
                  </div>
                )}
                <div className="create-scheduler-form-element">
                  <Autocomplete
                    className="create-scheduler-style"
                    options={composerList}
                    value={initialJobPayload.composer_environment_name}
                    onChange={(_event, val) => handleComposerSelected(val)}
                    renderInput={params => (
                      <TextField {...params} label="Environment*" />
                    )}
                    disabled={editMode}
                  />
                </div>
                <div className="create-scheduler-form-element">
                  <FormGroup row={true}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          size="small"
                          checked={initialJobPayload.email_failure}
                          onChange={handleFailureChange}
                        />
                      }
                      className="create-scheduler-label-style"
                      label={
                        <Typography sx={{ fontSize: 13 }}>
                          Email on failure
                        </Typography>
                      }
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          size="small"
                          checked={initialJobPayload.email_delay}
                          onChange={handleRetryChange}
                        />
                      }
                      className="create-scheduler-label-style"
                      label={
                        <Typography sx={{ fontSize: 13 }}>
                          Email on retry
                        </Typography>
                      }
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          size="small"
                          checked={initialJobPayload.email_success}
                          onChange={handleSuccessChange}
                        />
                      }
                      className="create-scheduler-label-style"
                      label={
                        <Typography sx={{ fontSize: 13 }}>
                          Email on success
                        </Typography>
                      }
                    />
                  </FormGroup>
                </div>
                <div className="create-scheduler-form-element">
                  {(initialJobPayload.email_failure ||
                    initialJobPayload.email_delay ||
                    initialJobPayload.email_success) && (
                    <MuiChipsInput
                      className="select-job-style"
                      onChange={e => handleEmailList(e)}
                      addOnBlur={true}
                      value={initialJobPayload.email_ids}
                      inputProps={{ placeholder: '' }}
                      label="Email recipients"
                    />
                  )}
                </div>
                {(initialJobPayload.email_failure ||
                  initialJobPayload.email_delay ||
                  initialJobPayload.email_success) &&
                  !initialJobPayload.email_ids.length && (
                    <div className="error-key-parent">
                      <iconError.react
                        tag="div"
                        className="logo-alignment-style"
                      />
                      <div className="error-key-missing">
                        Email recipients is required field
                      </div>
                    </div>
                  )}
              </div>
            </div>
          </Grid>
        )}
      </Grid>
    </>
  );
};

export default JobForm;
