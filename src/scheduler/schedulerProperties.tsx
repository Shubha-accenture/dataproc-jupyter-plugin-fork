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

import React, { useEffect } from 'react';
import { LabIcon } from '@jupyterlab/ui-components';
import plusIcon from '../../style/icons/plus_icon.svg';
import plusIconDisable from '../../style/icons/plus_icon_disable.svg';
import deleteIcon from '../../style/icons/delete_icon.svg';
import errorIcon from '../../style/icons/error_icon.svg';
import { DEFAULT_LABEL_DETAIL } from '../utils/const';
import { Input } from '../controls/MuiWrappedInput';
import { Autocomplete, TextField } from '@mui/material';

const iconPlus = new LabIcon({
  name: 'launcher:plus-icon',
  svgstr: plusIcon
});
const iconPlusDisable = new LabIcon({
  name: 'launcher:plus-disable-icon',
  svgstr: plusIconDisable
});
const iconDelete = new LabIcon({
  name: 'launcher:delete-icon',
  svgstr: deleteIcon
});
const iconError = new LabIcon({
  name: 'launcher:error-icon',
  svgstr: errorIcon
});

function SchedulerProperties({
  labelDetail,
  setLabelDetail,
  labelDetailUpdated,
  setLabelDetailUpdated
}: any) {
  /*
  labelDetail used to store the permanent label details when onblur
  labelDetailUpdated used to store the temporay label details when onchange
  */
  useEffect(() => {
    setLabelDetailUpdated([]);
    setLabelDetail([]);
  }, []); //try removing complete useeffect

  const handleAddLabel = (event: React.MouseEvent<HTMLElement>) => {
    event.preventDefault();
    const labelAdd = [...labelDetail];
    labelAdd.push('::');
    setLabelDetailUpdated(labelAdd);
    setLabelDetail(labelAdd);
  };

  const handleDeleteLabel = (index: number, value: string) => {
    const labelDelete = [...labelDetail];
    labelDelete.splice(index, 1);
    setLabelDetailUpdated(labelDelete);
    setLabelDetail(labelDelete);
  };

  const handleEditLabelSwitch = () => {
    setLabelDetail(labelDetailUpdated);
  };

  const handleEditLabel = (value: string, index: number, keyValue: string) => {
    const labelEdit = [...labelDetail];
    labelEdit.forEach((data, dataNumber: number) => {
      if (index === dataNumber) {
        /*
          allowed aplhanumeric and spaces and underscores
        */
        if (keyValue === 'key') {
          data = data.replace(data.split(':')[0], value);
        } else if (keyValue === 'value') {
          data = data.split(':')[0] + ':' + value + ':' + data.split(':')[2];
        } else if (keyValue === 'type') {
          data = data.split(':')[0] + ':' + data.split(':')[1] + ':' + value;
        }
      }
      labelEdit[dataNumber] = data;
    });
    setLabelDetailUpdated(labelEdit);
  };

  const styleAddLabelButton = (buttonText: string, labelDetail: string) => {
    if (
      buttonText !== 'ADD LABEL' &&
      (labelDetail.length === 0 ||
        labelDetail[labelDetail.length - 1].split(':')[0].length > 0)
    ) {
      return 'job-add-property-button';
    } else {
      return 'job-add-property-button-disabled';
    }
  };

  const Types = [
    'STRING',
    'BYTES',
    'INTEGER',
    'FLOAT',
    'NUMERIC',
    'BIGNUMERIC',
    'TIMESTAMP',
    'DATE',
    'TIME',
    'DATETIME',
    'GEOGRAPHY',
    'RECORD',
    'JSON',
    'RANGE'
  ];

  return (
    <div>
      <div className={'job-label-react-flow-parent'}>
        {labelDetail.length > 0 &&
          labelDetail.map((label: string, index: number) => {
            const labelSplit = label.split(':');

            return (
              <div key={label}>
                <div className="job-label-edit-row">
                  <div className="key-message-wrapper">
                    <div className="select-text-overlay-label">
                      <Input
                        sx={{ margin: 0 }}
                        className="edit-input-style"
                        onBlur={() => handleEditLabelSwitch()}
                        onChange={e =>
                          handleEditLabel(e.target.value, index, 'key')
                        }
                        defaultValue={labelSplit[0]}
                        Label={`Key ${index + 1}*`}
                      />
                    </div>

                    {labelDetailUpdated[index].split(':')[0] === '' &&
                      labelDetailUpdated[index] !== '' && (
                        <div role="alert" className="error-key-parent">
                          <iconError.react
                            tag="div"
                            className="logo-alignment-style"
                          />
                          <div className="error-key-missing">
                            key is required
                          </div>
                        </div>
                      )}
                  </div>
                  <div className="key-message-wrapper">
                    <div className="select-text-overlay-label">
                      <Input
                        sx={{ margin: 0 }}
                        className="edit-input-style "
                        onBlur={() => handleEditLabelSwitch()}
                        onChange={e =>
                          handleEditLabel(e.target.value, index, 'value')
                        }
                        defaultValue={labelSplit[1]}
                        Label={`Value ${index + 1}`}
                      />
                    </div>
                  </div>
                  <div className="key-message-wrapper">
                    <div className="select-text-overlay-label">
                      <Autocomplete
                        options={Types}
                        value={
                          Types.find(
                            option =>
                              option === labelDetail[index].split(':')[2]
                          ) || null
                        }
                        onBlur={() => handleEditLabelSwitch()}
                        onChange={(e, newValue) =>
                          handleEditLabel(newValue || '', index, 'type')
                        }
                        renderInput={params => (
                          <TextField {...params} label={`Type ${index + 1}`} />
                        )}
                      />
                    </div>
                  </div>
                  <div
                    role="button"
                    className={
                      label === DEFAULT_LABEL_DETAIL
                        ? 'labels-delete-icon-hide'
                        : 'labels-delete-icon'
                    }
                    onClick={() => {
                      if (!(label === DEFAULT_LABEL_DETAIL)) {
                        handleDeleteLabel(index, labelSplit[0]);
                      }
                    }}
                  >
                    <iconDelete.react
                      tag="div"
                      className="logo-alignment-style"
                    />
                  </div>
                  <></>
                </div>
              </div>
            );
          })}
        <button
          className={styleAddLabelButton('ADD PARAMETER', labelDetail)}
          onClick={e => {
            const buttonClasses = e.currentTarget.className;
            const isDisabled =
              buttonClasses.includes('job-add-label-button-disabled') ||
              buttonClasses.includes('job-add-property-button-disabled');

            if (!isDisabled) {
              if (
                labelDetail.length === 0 ||
                labelDetail[labelDetail.length - 1].split(':')[0].length > 0
              ) {
                handleAddLabel(e);
              }
            } else {
              e.preventDefault();
            }
          }}
        >
          {labelDetail.length === 0 ||
          labelDetail[labelDetail.length - 1].split(':')[0].length > 0 ? (
            <iconPlus.react
              tag="div"
              className="icon-black logo-alignment-style"
            />
          ) : (
            <iconPlusDisable.react
              tag="div"
              className="icon-black-disable logo-alignment-style"
            />
          )}
          <span
            className={
              labelDetail.length === 0 ||
              labelDetail[labelDetail.length - 1].split(':')[0].length > 0
                ? 'job-react-flow-text'
                : 'job-react-flow-text-disabled'
            }
          >
            ADD PARAMETER
          </span>
        </button>
      </div>
    </div>
  );
}

export default SchedulerProperties;
