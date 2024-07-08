import React, { useState } from 'react';
import { eventEmitter } from '../utils/signalEmitter';
import { Autocomplete, Button, TextField } from '@mui/material';

function ConfigureForm({ id, data }: any) {
  const [isFormVisible, setIsFormVisible] = useState(true);

  // console.log('############## in form element');
  const jobType = [
    'Run a notebook on dataproc serverless',
    'Run a notebook on dataproc cluster',
    'Execute a SQL on BigQuery',
    'Move, copy, delete, etc. files & folders on GCS',
    'Ingest data into a BQ table from GCS',
    'Export data from BQ table to GCS'
  ];
  const [jobTypeSelected, setJobTypeSelected] = useState('');

  const handleJobTypeChange = (_event: any, value: any) => {
    setJobTypeSelected(value);
  };

  const handleCancel = () => {
    setIsFormVisible(false);
    console.log('cancel is clicked');
    console.log('form cancel', isFormVisible);
    eventEmitter.emit(`closeForm`, setIsFormVisible);
  };

  return (
    <>
      {/* { isFormVisible && */}
      <>
        <form>

          <div className="submit-job-container">
           <div className="submit-job-label-header">Configure Node</div>
            <Autocomplete
              className="create-scheduler-style"
              options={jobType}
              value={jobTypeSelected}
              onChange={handleJobTypeChange}
              renderInput={params => <TextField {...params} label="Node Type*" />}
            />
            <Button
              variant="outlined"
              aria-label="cancel"
              onClick={handleCancel}
            >
              <div>CANCEL</div>
            </Button>
            </div>
        </form>
      </>
      {/* } */}
    </>
  );
}

export default ConfigureForm;
