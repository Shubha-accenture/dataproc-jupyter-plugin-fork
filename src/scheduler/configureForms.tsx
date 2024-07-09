import React, { useState } from 'react';
import { eventEmitter } from '../utils/signalEmitter';
import { Autocomplete, IconButton, TextField } from '@mui/material';
import SchedulerForm from './schedulerForm';
import { LabIcon } from '@jupyterlab/ui-components';
import searchClearIcon from '../../style/icons/search_clear_icon.svg';

const iconSearchClear = new LabIcon({
  name: 'launcher:search-clear-icon',
  svgstr: searchClearIcon
});

function ConfigureForm({ id, data }: any) {
  const [isFormVisible, setIsFormVisible] = useState(true);
  const nodeType = [
    'Run a notebook on dataproc serverless',
    'Run a notebook on dataproc cluster',
    'Execute a SQL on BigQuery',
    'Move, copy, delete, etc. files & folders on GCS',
    'Ingest data into a BQ table from GCS',
    'Export data from BQ table to GCS'
  ];
  const [nodeTypeSelected, setnodeTypeSelected] = useState('');

  const handleNodeTypeChange = (_event: any, value: any) => {
    setnodeTypeSelected(value);
    eventEmitter.emit(`nodeType`, value, id);
  };

  const handleCancel = () => {
    setIsFormVisible(false);
    console.log('form cancel', isFormVisible);
    eventEmitter.emit(`closeForm`, setIsFormVisible);
  };

  return (
    <>
      <>
        <form>
          <div className="submit-job-container">
            <div className="submit-job-label-header">
              Configure Node
              <IconButton
                aria-label="cancel"
                onClick={handleCancel}
              >
                <iconSearchClear.react
                  tag="div"
                  className="icon-white logo-alignment-style search-clear-icon"
                />
              </IconButton>
            </div>
            <Autocomplete
              className="create-scheduler-style"
              options={nodeType}
              value={nodeTypeSelected}
              onChange={handleNodeTypeChange}
              renderInput={params => (
                <TextField {...params} label="Node Type*" />
              )}
            />
            {(nodeTypeSelected === 'Run a notebook on dataproc serverless' ||
              nodeTypeSelected === 'Run a notebook on dataproc cluster') && (
              <SchedulerForm id={id} data={data} />
            )}
            {/* <Button
              variant="outlined"
              aria-label="cancel"
              onClick={handleCancel}
            >
              <div>CANCEL</div>
            </Button> */}
          </div>
        </form>
      </>
    </>
  );
}

export default ConfigureForm;
