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

interface IJobPayload{
    jobName:string,
    jobcomposer_environment_name: string,
    email_failure:boolean,
    email_retry: boolean,
    email_success: boolean,
    email: string[]
}

const JobForm = ({ jobPayload: initialJobPayload, onJobPayloadChange }: { jobPayload: IJobPayload, onJobPayloadChange: (payload: IJobPayload) => void }) => {
  const [jobNameSelected, setJobNameSelected] = useState('');
  const [composerList, setComposerList] = useState<string[]>([]);
  const [composerSelected, setComposerSelected] = useState('');
  const [emailOnFailure, setEmailOnFailure] = useState(false);
  const [emailOnRetry, setEmailonRetry] = useState(false);
  const [emailOnSuccess, setEmailOnSuccess] = useState(false);
  const [emailList, setEmailList] = useState<string[]>([]);
  //const [creatingScheduler] = useState(false);
  const [jobNameValidation, setJobNameValidation] = useState(true);
  const [jobNameSpecialValidation, setJobNameSpecialValidation] =
    useState(false);
  const [jobNameUniqueValidation, setJobNameUniqueValidation] = useState(true);
  const [dagList, setDagList] = useState<IDagList[]>([]);
  const [editMode] = useState(false);
  const [dagListCall, setDagListCall] = useState(false);
  const [isJobFormVisible, setIsJobFormVisible] = useState(true);

  const [jobPayload, setJobPayload] = useState<IJobPayload>(initialJobPayload);

  useEffect(() => {
    setJobPayload((prev:any) => ({
      ...prev,
      jobName: jobNameSelected,
      jobcomposer_environment_name: composerSelected,
      email_failure: emailOnFailure,
      email_retry: emailOnRetry,
      email_success: emailOnSuccess,
      email: emailList,
    }));
  }, [jobNameSelected, composerSelected, emailOnFailure, emailOnRetry, emailOnSuccess, emailList]);

  useEffect(() => {
    if (typeof onJobPayloadChange === 'function') {
      onJobPayloadChange(jobPayload);
    }
  }, [jobPayload, onJobPayloadChange]);


console.log(dagListCall)
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
      setComposerSelected(selectedComposer);
     // jobPayload. jobcomposer_environment_name=selectedComposer
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
    setEmailOnFailure(event.target.checked);
   // jobPayload.email_failure=event.target.checked;
  };

  const handleRetryChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setEmailonRetry(event.target.checked);
   // jobPayload.email_retry=event.target.checked
  };

  const handleSuccessChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setEmailOnSuccess(event.target.checked);
   // jobPayload.email_success=event.target.checked
  };

  const handleEmailList = (data: string[]) => {
    setEmailList(data);
   // jobPayload.email=data
  };

//   const handleCreateJobScheduler = async () => {
//     let outputFormats = [];
// //     outputFormats.push('ipynb');
//  jobPayload = {
//       jobcomposer_environment_name: composerSelected,
//       email_failure: emailOnFailure,
//       email_retry: emailOnRetry,
//       email_success: emailOnSuccess,
//       email: emailList
//     };
//     console.log('jobpayload', jobPayload);
// //  };

  const handleJobNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    event.target.value.length > 0
      ? setJobNameValidation(true)
      : setJobNameValidation(false);

    //Regex to check job name must contain only letters, numbers, hyphens, and underscores
    const regexp = /^[a-zA-Z0-9-_]+$/;
    event.target.value.search(regexp)
      ? setJobNameSpecialValidation(true)
      : setJobNameSpecialValidation(false);
    setJobNameSelected(event.target.value);

    setJobNameSelected(event.target.value);
   // jobPayload.jobName=event.target.value
  };

//   const isSaveDisabled = () => {
//     return (
//       dagListCall ||
//       jobNameSelected === '' ||
//       (!jobNameValidation && !editMode) ||
//       (jobNameSpecialValidation && !editMode) ||
//       (!jobNameUniqueValidation && !editMode) ||
//       composerSelected === '' ||
//       ((emailOnFailure || emailOnRetry || emailOnSuccess) &&
//         emailList.length === 0)
//     );
//   };

//   const handleCancel = async () => {
//     // if (!editMode) {
//     //   setCreateCompleted(false);
//     //   app.shell.activeWidget?.close();
//     // } else {
//     //   setCreateCompleted(true);
//     // }
//     // setIsFormVisible(false);
//     console.log('cancel');
//   };

  //     const kernelSpecs: any = await KernelSpecAPI.getSpecs();
  //     const kernels = kernelSpecs.kernelspecs;

  //     if (kernels && context.sessionContext.kernelPreference.name) {
  //       if (
  //         kernels[context.sessionContext.kernelPreference.name].resources
  //           .endpointParentResource
  //       ) {
  //         if (
  //           kernels[
  //             context.sessionContext.kernelPreference.name
  //           ].resources.endpointParentResource.includes('/sessions')
  //         ) {
  //           const selectedData: any = serverlessDataList.filter(
  //             (serverless: any) => {
  //               return context.sessionContext.kernelDisplayName.includes(
  //                 serverless.serverlessName
  //               );
  //             }
  //           );
  //           if (selectedData.length > 0) {
  //             setServerlessDataSelected(selectedData[0].serverlessData);
  //             setServerlessSelected(selectedData[0].serverlessName);
  //           } else {
  //             setServerlessDataSelected({});
  //             setServerlessSelected('');
  //           }
  //         } else {
  //           const selectedData: any = clusterList.filter((cluster: string) => {
  //             return context.sessionContext.kernelDisplayName.includes(cluster);
  //           });
  //           if (selectedData.length > 0) {
  //             setClusterSelected(selectedData[0]);
  //           } else {
  //             setClusterSelected('');
  //           }
  //         }
  //       }
  //     }
  //   };

  useEffect(() => {
    listComposersAPI();
  }, []);

  useEffect(() => {
    if (composerSelected !== '' && dagList.length > 0) {
      const isUnique = !dagList.some(
        dag => dag.notebookname === jobNameSelected
      );
      setJobNameUniqueValidation(isUnique);
    }
  }, [dagList, jobNameSelected, composerSelected]);

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
                    value={jobNameSelected}
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
                    value={composerSelected}
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
                          checked={emailOnFailure}
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
                          checked={emailOnRetry}
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
                          checked={emailOnSuccess}
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
                  {(emailOnFailure || emailOnRetry || emailOnSuccess) && (
                    <MuiChipsInput
                      className="select-job-style"
                      onChange={e => handleEmailList(e)}
                      addOnBlur={true}
                      value={emailList}
                      inputProps={{ placeholder: '' }}
                      label="Email recipients"
                    />
                  )}
                </div>
                {(emailOnFailure || emailOnRetry || emailOnSuccess) &&
                  !emailList.length && (
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
                {/* <div className="save-overlay">
                  <Button
                    onClick={() => {
                      if (!isSaveDisabled()) {
                        handleCreateJobScheduler();
                      }
                    }}
                    variant="contained"
                    disabled={isSaveDisabled()}
                    aria-label={
                      editMode ? ' Update Schedule' : 'Create Schedule'
                    }
                  >
                    <div>
                      {editMode
                        ? creatingScheduler
                          ? 'UPDATING'
                          : 'UPDATE'
                        : creatingScheduler
                        ? 'CREATING'
                        : 'CREATE'}
                    </div>
                  </Button>
                  <Button
                    variant="outlined"
                    disabled={creatingScheduler}
                    aria-label="cancel Batch"
                    onClick={!creatingScheduler ? handleCancel : undefined}
                  >
                    <div>CANCEL</div>
                  </Button>
                </div> */}
              </div>
            </div>
          </Grid>
        )}
      </Grid>
    </>
  );
};

export default JobForm;
