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
import SavePopup from '../utils/savePopup';
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
  const [createCompleted, setCreateCompleted] =
    context !== '' ? useState(false) : useState(true);
  const [creatingScheduler, setCreatingScheduler] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [nodeDataValidation, setNodeDataValidation] = useState(false);
  const [jobPayloadValidation, setJobPayloadValidation] = useState(false);
  // const [editPayloadValidation, setEditPayloadValidation] = useState(false)// need for future use
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [editPayload, setEditPayload] = useState<any>([]);
  const [editPayloadFixed, setEditPayloadFixed] = useState<any>([]);
  const [savePopupOpen, setSavePopupOpen] = useState(false);
  const [savingNotebook, setSavingNotebook] = useState(false);

  console.log('editPayload fixed ', editPayloadFixed);

  const initialPayload = {
    job_name: '',
    composer_environment_name: '',
    email_failure: false,
    email_delay: false,
    email_success: false,
    email_ids: []
  };

  const EditInitialPayload = {
    job_name: editPayload.job_name,
    composer_environment_name: editPayload.composer_environment_name,
    email_failure: editPayload?.email_failure || false,
    email_delay: editPayload?.email_delay || false,
    email_success: editPayload?.email_success || false,
    email_ids: editPayload?.email_ids || []
  };
  const defaultPayload = editMode ? EditInitialPayload : initialPayload;
  const [jobPayload, setJobPayload] = useState(defaultPayload);

  useEffect(() => {
    setJobPayload(defaultPayload);
  }, [editMode]);

  const validateJobPayload = () => {
    // const isEmailChanged =
    //   jobPayload.email_failure !== editPayload.email_failure ||
    //   jobPayload.email_delay !== editPayload.email_delay ||
    //   jobPayload.email_success !== editPayload.email_success ||
    //   JSON.stringify(jobPayload.email_ids) !==
    //     JSON.stringify(editPayload.email_ids); //commented for now needed for save button logic
    return (
      jobPayload.job_name === '' ||
      jobPayload.composer_environment_name === '' ||
      ((jobPayload.email_failure ||
        jobPayload.email_delay ||
        jobPayload.email_success) &&
        jobPayload.email_ids.length === 0)
        // ||
      //!isEmailChanged // New condition: check if any email-related field has changed
    );
  };
// need for svae button 
  //  const editFlowValidation=()=>{
  //   console.log(nodes, editPayload.nodes)
  //   if (nodes.length !== editPayload.nodes.length) {
  //     return true; // If the number of nodes is different, return true (data changed)
  //   }
  //   const isNodeDataChanged = nodes.some((node:any, index) => {
  //     console.log("inside")
  //     const editNode = editPayload.nodes[index];
  //     return (
  //       node.data.inputFile !== editNode.data.inputFile ||
  //       node.data.retryCount !== editNode.data.retryCount ||
  //       node.data.nodeType !== editNode.data.nodeType ||
  //       node.data.clusterName !== editNode.data.clusterName ||
  //       node.data.serverless !== editNode.data.serverless
  //       // Add other
  //     );
  //   });
  //   console.log("is data changed", isNodeDataChanged)
  //  // return isNodeDataChanged; // True if any node data is different, false otherwise
  //   setEditPayloadValidation(isNodeDataChanged)
  //   console.log(editPayloadValidation)
  //  }

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
      } else if (
        e.data.nodeType === 'Serverless' ||
        e.data.nodeType === 'Bigquery-Serverless'
      ) {
        let inputFile = e.data.inputFile;
        if (!inputFile || inputFile.trim() === '') {
          allNodesHaveData = false;
        }
        let serverless = e.data.serverless;
        if (!serverless) {
          allNodesHaveData = false;
        }
      }
      else if(e.data.nodeType === 'Bigquery-Sql')
      {
        let inputFile = e.data.inputFile;
        if (!inputFile || inputFile.trim() === '') {
          allNodesHaveData = false;
        }
        let saveQuery = e.data.isSaveQuery ?? false; 
          if (saveQuery) {
            let datasetId = e.data.datasetId;
            let tableId = e.data.tableId;
          
            // Check if either datasetId or tableId is missing or empty
            if (!datasetId || datasetId.trim() === '' || !tableId || tableId.trim() === '') {
              allNodesHaveData = false;
            }
          }
        let autoRegion = e.data.isAutoRegion
        if (!autoRegion) {
          let location = e.data.location;  
          if (!location || location.trim() === '') {
            allNodesHaveData = false;
          }
        }
      }
      setNodeDataValidation(allNodesHaveData);
    });
  };
  useEffect(() => {
    const tempValidateJobPayload = validateJobPayload();
    setJobPayloadValidation(!tempValidateJobPayload);
  }, [jobPayload]);

  useEffect(() => {
    validateTaskPayload();
  }, [nodes]); //calling this multiple times // handle it using data only

  const handleNodesChange = (updatedNodes: []) => {
    setNodes(updatedNodes);
  };

  const handleEdgesChange = (updatedEdges: []) => {
    setEdges(updatedEdges);
  };

  const handleSavePopUp= async () => {
    setSavePopupOpen(true);
  };
  const handleCancelSavePopup= async () => {
    setSavePopupOpen(false);
  };

  const handleCreateJobScheduler = async () => {
    setSavingNotebook(true);
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
    setJobPayload(initialPayload); //after save
    setSavingNotebook(false);
  };

  const handleCancel = async () => {
    setCreateCompleted(true);
    setJobPayload(initialPayload);
    setEditMode(false);
    // setSavePopupOpen(false);
  };

  return (
    <>
      {createCompleted ? (
        <NotebookJobComponent
          app={app}
          // themeManager={themeManager}
          composerSelectedFromCreate={composerSelected}
          setCreateCompleted={setCreateCompleted}
          setEditMode={setEditMode}
          setEditPayload={setEditPayload}
          setEditPayloadFixed={setEditPayloadFixed}
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

              {editMode ? (
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
                disabled={
                  !nodeDataValidation ||
                  !jobPayloadValidation ||
                  creatingScheduler
                }
                aria-label="Save scheduler"
                onClick={editMode ? handleSavePopUp : handleCreateJobScheduler}
              >
                <div>{creatingScheduler ? 'SAVING...' : 'SAVE'}</div>
              </Button>
              {savePopupOpen && (
                  <SavePopup
                    onCancel={() => handleCancelSavePopup()}
                    onSave={() => handleCreateJobScheduler()}
                    savePopupOpen={savePopupOpen}
                    saveMsg={`Do you want to save the changes ?`}
                    savingNotebook={savingNotebook}
                  />
                )}
              <Button
                sx={{ width: '100px' }}
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
              jobPayload={jobPayload}
              setJobPayload={setJobPayload}
              nodesFromEditPayload={editMode ? [...editPayload.nodes] : ''}
              edgesFromEditPayload={editMode ? editPayload.edges : ''}
              editMode={editMode}
            />
          </Grid>
        </>
      )}
    </>
  );
};

export default CreateNotebookScheduler;
