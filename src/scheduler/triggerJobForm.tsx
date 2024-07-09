import { Autocomplete, Button, FormControl, FormControlLabel, Radio, RadioGroup, TextField, Typography } from '@mui/material';
import React, { useState } from 'react';
import { Cron } from 'react-js-cron';
import tzdata from 'tzdata';
import { scheduleValueExpression } from '../utils/const';
import { scheduleMode } from '../utils/const';
import { eventEmitter } from '../utils/signalEmitter';

function TriggerJobForm({ id, data }: any) {

  console.log('############## in trigger form element',id,data);

  const [scheduleMode, setScheduleMode] = useState<scheduleMode>('runNow');
  const [scheduleValue, setScheduleValue] = useState(scheduleValueExpression);
  const [timeZoneSelected, setTimeZoneSelected] = useState(
    Intl.DateTimeFormat().resolvedOptions().timeZone
  );
  const timezones = Object.keys(tzdata.zones).sort();
  const handleSchedulerModeChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const newValue = (event.target as HTMLInputElement).value;
    setScheduleMode(newValue as scheduleMode);
    if (newValue === 'runSchedule' && scheduleValue === '') {
      setScheduleValue(scheduleValueExpression);
    }
  };

  const handleTimeZoneSelected = (data: string | null) => {
    if (data) {
      const selectedTimeZone = data.toString();
      setTimeZoneSelected(selectedTimeZone);
    }
  };

  const handleCancel = () => {
    setIsFormVisible(false);
    // console.log('cancel is clicked');
    // console.log('form cancel', isFormVisible);
    eventEmitter.emit(`closeForm1`, setIsFormVisible);
  };

  return (
    <>
      {/* { isFormVisible && */}
      <div>
        <form>
          <div className="create-scheduler-form-element">
            <FormControl>
              <RadioGroup
                aria-labelledby="demo-controlled-radio-buttons-group"
                name="controlled-radio-buttons-group"
                value={scheduleMode}
                onChange={handleSchedulerModeChange}
              >
                <FormControlLabel
                  value="runNow"
                  className="create-scheduler-label-style"
                  control={<Radio size="small" />}
                  label={<Typography sx={{ fontSize: 13 }}>Run now</Typography>}
                />
                <FormControlLabel
                  value="runSchedule"
                  className="create-scheduler-label-style"
                  control={<Radio size="small" />}
                  label={
                    <Typography sx={{ fontSize: 13 }}>
                      Run on a schedule
                    </Typography>
                  }
                />
              </RadioGroup>
            </FormControl>
          </div>
          {scheduleMode === 'runSchedule' && (
            <>
              <div className="create-scheduler-form-element">
                <Cron value={scheduleValue} setValue={setScheduleValue} />
              </div>
              <div className="create-scheduler-form-element">
                <Autocomplete
                  className="create-scheduler-style"
                  options={timezones}
                  value={timeZoneSelected}
                  onChange={(_event, val) => handleTimeZoneSelected(val)}
                  renderInput={params => (
                    <TextField {...params} label="Time Zone" />
                  )}
                />
              </div>
            </>
          )}
            <Button
              variant="outlined"
              aria-label="cancel"
              onClick={handleCancel}
            >
              <div>CANCEL</div>
            </Button>
        </form>
      </div>
    </>
  );
}

export default TriggerJobForm;
function setIsFormVisible(arg0: boolean) {
    throw new Error('Function not implemented.');
}

