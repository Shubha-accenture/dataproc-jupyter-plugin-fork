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

const TriggerJobForm = ({ data }: { data: any }) => {
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
    }
  };

  useEffect(() => {
    if (scheduleMode === 'runNow') {
      data.scheduleValue = '';
      data.timeZone = '';
    }
  }, [scheduleMode]);

  useEffect(() => {
    if (data.timeZone) {
      setScheduleMode('runSchedule');
      setScheduleValue(data.scheduleValue);
      setTimeZoneSelected(data.timeZone);
    }
  }, [data]);

  return (
    <>
      <div>
        <form>
          <div className="create-scheduler-form-element-trigger">
            <FormControl className="trigger-form">
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
};

export default TriggerJobForm;
