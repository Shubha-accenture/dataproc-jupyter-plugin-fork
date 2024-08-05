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
import React, { useState } from 'react';
import { IThemeManager } from '@jupyterlab/apputils';
import { JupyterLab } from '@jupyterlab/application';
import 'react-js-cron/dist/styles.css';
import { SchedulerService } from './schedulerServices';
import NotebookJobComponent from './notebookJobs';
import LeftArrowIcon from '../../style/icons/left_arrow_icon.svg';
import { LabIcon } from '@jupyterlab/ui-components';
import { Button } from '@mui/material';
import Grid from '@mui/material/Grid';
import GraphicalScheduler from './graphicalScheduler';
import { IFileBrowserFactory } from '@jupyterlab/filebrowser';
import { eventEmitter } from '../utils/signalEmitter';

interface INodeData {
  data: {
    inputFile: string;
    retryCount: number;
    retryDelay: number;
  };
}
const iconLeftArrow = new LabIcon({
  name: 'launcher:left-arrow-icon',
  svgstr: LeftArrowIcon
});

const CreateNotebookScheduler = ({
  themeManager,
  app,
  context,
  factory
}: {
  themeManager: IThemeManager;
  app: JupyterLab;
  context: any;
  factory: IFileBrowserFactory;
}): JSX.Element => {

  const [composerSelected] = useState('');
  // const [emailOnFailure, setEmailOnFailure] = useState(false);
  // const [emailOnRetry, setEmailonRetry] = useState(false);
  // const [emailOnSuccess, setEmailOnSuccess] = useState(false);
  // const [emailList, setEmailList] = useState<string[]>([]);
  const [createCompleted, setCreateCompleted] =
    context !== '' ? useState(false) : useState(true);
  const [creatingScheduler, setCreatingScheduler] = useState(false);
  const [editMode, setEditMode] = useState(false);
  // const [isLoadingKernelDetail, setIsLoadingKernelDetail] = useState(false);
  const [inputFilesValidation, setInputFilesValidation] = useState(false);
  console.log(inputFilesValidation)

  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);

  const [jobPayload, setJobPayload] = useState({
    job_name: '',
    composer_environment_name: '',
    email_failure: false,
    email_delay: false,
    email_success: false,
    email_ids: [],
  });

  const handleJobPayload=(jobFormPayload:any)=>{
    setJobPayload(jobFormPayload)
    // console.log("in create scheduler",jobPayload)
  }

  eventEmitter.on('closeJobForm', () => {
   // setIsJobFormVisible(false);
  });

  eventEmitter.on('closeTaskForm', () => {
    //setIsJobFormVisible(true);
  });

  const handleNodesChange = (updatedNodes: []) => {
    setNodes(updatedNodes);
    //const allInputFiles: string[] = [];
    let allNodesHaveInputFiles = true;
    updatedNodes.forEach((e: INodeData) => {
      const inputFile = e.data.inputFile;
      if (!inputFile || inputFile.trim() === '') {
        allNodesHaveInputFiles = false;
      }
      // } else {
      //   allInputFiles.push(inputFile);
      // }
    });
    setInputFilesValidation(allNodesHaveInputFiles);//need this line
  };



  const handleEdgesChange = (updatedEdges: []) => {
    setEdges(updatedEdges);
  };


  const handleCreateJobScheduler = async () => {
    // let outputFormats = [];
    // outputFormats.push('ipynb');
    //let randomDagId = uuidv4();
    const payload = { 
      ...jobPayload,
      nodes: nodes,
      edges: edges
    };
    console.log("final payload",payload)
    await SchedulerService.createJobSchedulerService(
      payload,
      app,
      setCreateCompleted,
      setCreatingScheduler,
      editMode
    );
    setEditMode(false);
  };


  // const isSaveDisabled = () => {
  //   return (
  //    // !inputFilesValidation ||
  //     dagListCall ||
  //     //creatingScheduler ||
  //     jobNameSelected === '' ||
  //     (!jobNameValidation && !editMode) ||
  //     (jobNameSpecialValidation && !editMode) ||
  //     (!jobNameUniqueValidation && !editMode) ||
  //    // inputFileSelected === '' ||
  //     composerSelected === '' ||
  //     //(selectedMode === 'cluster' && clusterSelected === '') ||
  //     //(selectedMode === 'serverless' && serverlessSelected === '') ||
  //     ((emailOnFailure || emailOnRetry || emailOnSuccess) &&
  //       emailList.length === 0)
  //   );
  // };

  const handleCancel = async () => {
    if (!editMode) {
      setCreateCompleted(false);
      app.shell.activeWidget?.close();
    } else {
      setCreateCompleted(true);
    }
    // setIsFormVisible(false);
  };

  // const getKernelDetail = async () => {
  //   const kernelSpecs: any = await KernelSpecAPI.getSpecs();
  //   const kernels = kernelSpecs.kernelspecs;

  //   if (kernels && context.sessionContext.kernelPreference.name) {
  //     if (
  //       kernels[context.sessionContext.kernelPreference.name].resources
  //         .endpointParentResource
  //     ) {
  //       if (
  //         kernels[
  //           context.sessionContext.kernelPreference.name
  //         ].resources.endpointParentResource.includes('/sessions')
  //       ) {
  //         const selectedData: any = serverlessDataList.filter(
  //           (serverless: any) => {
  //             return context.sessionContext.kernelDisplayName.includes(
  //               serverless.serverlessName
  //             );
  //           }
  //         );
  //         if (selectedData.length > 0) {
  //           setServerlessDataSelected(selectedData[0].serverlessData);
  //           setServerlessSelected(selectedData[0].serverlessName);
  //         } else {
  //           setServerlessDataSelected({});
  //           setServerlessSelected('');
  //         }
  //       } else {
  //         const selectedData: any = clusterList.filter((cluster: string) => {
  //           return context.sessionContext.kernelDisplayName.includes(cluster);
  //         });
  //         if (selectedData.length > 0) {
  //           setClusterSelected(selectedData[0]);
  //         } else {
  //           setClusterSelected('');
  //         }
  //       }
  //     }
  //   }
  // };


  // useEffect(() => {
  //   if (composerSelected !== '' && dagList.length > 0) {
  //     const isUnique = !dagList.some(
  //       dag => dag.notebookname === jobNameSelected
  //     );
  //     setJobNameUniqueValidation(isUnique);
  //   }
  // }, [dagList, jobNameSelected, composerSelected]);

  // useEffect(() => {
  //   if (context !== '') {
  //     getKernelDetail();
  //   }
  // }, [serverlessDataList, clusterList]);

  return (
    <>
      {createCompleted ? (
        <NotebookJobComponent
          app={app}
          themeManager={themeManager}
          composerSelectedFromCreate={composerSelected}
          setCreateCompleted={setCreateCompleted}
         // setJobNameSelected={setJobNameSelected}
         // setComposerSelected={setComposerSelected}
          //setScheduleMode={setScheduleMode}
          //setScheduleValue={setScheduleValue}
          //setInputFileSelected={setInputFileSelected}
          // setParameterDetail={setParameterDetail}
          //setParameterDetailUpdated={setParameterDetailUpdated}
         // setSelectedMode={setSelectedMode}
          //setClusterSelected={setClusterSelected}
          //setServerlessSelected={setServerlessSelected}
          //setServerlessDataSelected={setServerlessDataSelected}
          //serverlessDataList={serverlessDataList}
          //setServerlessDataList={setServerlessDataList}
          //setServerlessList={setServerlessList}
         // setRetryCount={setRetryCount}
          //setRetryDelay={setRetryDelay}
         // setEmailOnFailure={setEmailOnFailure}
          //setEmailonRetry={setEmailonRetry}
         // setEmailOnSuccess={setEmailOnSuccess}
          //setEmailList={setEmailList}
          //setStopCluster={setStopCluster}
          //setTimeZoneSelected={setTimeZoneSelected}
          setEditMode={setEditMode}
         // setIsLoadingKernelDetail={setIsLoadingKernelDetail}
        />
      ) : (
        <>
          <div className="cluster-details-header">
            <div
              role="button"
              className="back-arrow-icon"
              onClick={handleCancel}
            >
              <iconLeftArrow.react
                tag="div"
                className="icon-white logo-alignment-style"
              />
            </div>
            {editMode ? (
              <div className="create-job-scheduler-title">
                Update A Scheduled Job
              </div>
            ) : (
              <div className="create-job-scheduler-title">
                Create A Scheduled Job
              </div>
            )}
            <div className="button-container-save">
              <Button
                variant="outlined"
                // disabled={isSaveDisabled()}
                aria-label="Save scheduler"
                 onClick= {handleCreateJobScheduler}    //{!creatingScheduler ? handleCancel : undefined}
              >
                <div>SAVE</div>
              </Button>
              <Button
                variant="outlined"
                disabled={creatingScheduler}
                aria-label="cancel scheduler"
                onClick={!creatingScheduler ? handleCancel : undefined}
              >
                <div>CANCEL</div>
              </Button>
            </div>
          </div>
          <Grid container spacing={0} style={{ height: '100vh' }}>
              <GraphicalScheduler
                inputFileSelected={context.path}
                NodesChange={handleNodesChange}
                EdgesChange={handleEdgesChange}
                app={app}
                factory={factory}
                //isJobFormVisible={isJobFormVisible}
               jobPayloadChange={handleJobPayload}
              //  setJobPayload={setJobPayload}
              />
          </Grid>
        </>
      )}
    </>
  );
};

export default CreateNotebookScheduler;
