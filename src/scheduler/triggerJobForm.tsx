import {
  Autocomplete,
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
  TextField,
  Typography
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { Cron } from 'react-js-cron';
import tzdata from 'tzdata';
import { scheduleValueExpression } from '../utils/const';
import { scheduleMode } from '../utils/const';

function TriggerJobForm({ id, data, nodes }: any) {
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
    data.scheduleValue = scheduleValue;
    data.timeZone = timeZoneSelected;
  };

  const handleTimeZoneSelected = (value: string | null) => {
    if (value) {
      const selectedTimeZone = value.toString();
      setTimeZoneSelected(selectedTimeZone);
      data.timeZone = selectedTimeZone;
      // let clickedNode = nodes.find((node: any) => node.id === id);
      // clickedNode.data=data;
    }
  };

  useEffect(() => {
    console.log("data",data)
    if (scheduleMode === 'runNow' && data.scheduleValue === '') {
      data.scheduleValue = '';
      data.timeZone = '';
    }
  }, [scheduleMode]);

  useEffect(() => {
    if (data.timeZone) {
      setScheduleMode('runSchedule')
      setScheduleValue(data.scheduleValue);
      setTimeZoneSelected(data.timeZone)
    }
  },[data]);

  return (
    <>
      {/* { isFormVisible && */}
      <div>
        <form>
          <div className="create-scheduler-form-element-trigger">
            <FormControl className= "trigger-form">
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
              <div className="create-scheduler-form-element-trigger">
                <Cron value={scheduleValue} setValue={setScheduleValue} />
              </div>
              <div className="create-scheduler-form-element-trigger">
                <Autocomplete
                  className="create-scheduler-style-trigger"
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
        </form>
      </div>
    </>
  );
}

export default TriggerJobForm;
