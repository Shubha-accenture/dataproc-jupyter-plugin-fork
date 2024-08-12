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
  const [composerSelected] = useState('');//check n remove*
  const [createCompleted, setCreateCompleted] =
    context !== '' ? useState(false) : useState(true);
  const [creatingScheduler, setCreatingScheduler] = useState(false);//check
  const [editMode, setEditMode] = useState(false);//remove**
  const [nodeDataValidation, setNodeDataValidation] = useState(false);
  const [jobPayloadValidation, setJobPayloadValidation] = useState(false);

  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);

  const initialPayload = {
    job_name: '',
    composer_environment_name: '',
    email_failure: false,
    email_delay: false,
    email_success: false,
    email_ids: []
  };

  const [jobPayload, setJobPayload] = useState(initialPayload);

  const validateJobPayload = () => {
    return (
      jobPayload.job_name === '' ||
      jobPayload.composer_environment_name === '' ||
      ((jobPayload.email_failure ||
        jobPayload.email_delay ||
        jobPayload.email_success) &&
        jobPayload.email_ids.length === 0)
    );
  };

  const validateTaskPayload = () => {
    let allNodesHaveData = true;
    nodes.forEach((e: any) => {
      if (nodes.length === 1) {
        allNodesHaveData = false;
      }
      if (e.data.nodeType === '') {
        allNodesHaveData = false;
      }
      if (e.data.nodeType === 'Cluster') {
        let inputFile = e.data.inputFile;
        if (!inputFile || inputFile.trim() === '') {
          allNodesHaveData = false;
        }
        let name = e.data.clusterName;
        if (!name || name.trim() === '') {
          allNodesHaveData = false;
        }
      } else if (e.data.nodeType === 'Serverless') {
        let inputFile = e.data.inputFile;
        if (!inputFile || inputFile.trim() === '') {
          allNodesHaveData = false;
        }
        let serverless = e.data.serverless;
        if (!serverless) {
          allNodesHaveData = false;
        }
      }
      setNodeDataValidation(allNodesHaveData);
      return allNodesHaveData;//remove return statement
    });
  };
  useEffect(() => {
    setJobPayloadValidation(!validateJobPayload());//need to refactor store variable and get it in set
  }, [jobPayload]);

  useEffect(() => {
    validateTaskPayload();
  }, [nodes]);

  const handleNodesChange = (updatedNodes: []) => {
    setNodes(updatedNodes);
  };

  const handleEdgesChange = (updatedEdges: []) => {
    setEdges(updatedEdges);
  };

  const handleCreateJobScheduler = async () => {
    const payload = {
      ...jobPayload,
      nodes: nodes,
      edges: edges
    };
    await SchedulerService.createJobSchedulerService(
      payload,
      app,
      setCreateCompleted,
      setCreatingScheduler,
      editMode
    );
    setEditMode(false);
    setJobPayload(initialPayload)//after save
  };
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
    setCreateCompleted(true);
    setJobPayload(initialPayload);
  };

  return (
    <>
      {createCompleted ? (
        <NotebookJobComponent
          app={app}
          themeManager={themeManager}
          composerSelectedFromCreate={composerSelected}//check n remove
          setCreateCompleted={setCreateCompleted}
          setEditMode={setEditMode}//check
        />
      ) : (
        <>
          <div className="scheduler-header">
            <div className="scheduler-header-left">
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

              {editMode ? (//check
                <div className="create-job-scheduler-title">
                  Update A Scheduled Job
                </div>
              ) : (
                <div className="create-job-scheduler-title">
                  Create A Scheduled Job
                </div>
              )}
            </div>
            <div className="scheduler-button-parent">
              <Button
                sx={{ width: '100px' }}
                variant="outlined"
                disabled={!nodeDataValidation || !jobPayloadValidation}
                aria-label="Save scheduler"
                onClick={handleCreateJobScheduler}
              >
                <div>SAVE</div>
              </Button>
              <Button
                sx={{ width: '100px' }}
                variant="outlined"
                disabled={creatingScheduler}//check
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
              jobPayload={jobPayload}
              setJobPayload={setJobPayload}
            />
          </Grid>
        </>
      )}
    </>
  );
};

export default CreateNotebookScheduler;
