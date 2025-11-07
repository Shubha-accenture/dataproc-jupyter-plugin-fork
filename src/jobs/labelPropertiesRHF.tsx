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

import React, { useEffect } from 'react';
import { LabIcon } from '@jupyterlab/ui-components';
import plusIcon from '../../style/icons/plus_icon.svg';
import plusIconDisable from '../../style/icons/plus_icon_disable.svg';
import deleteIcon from '../../style/icons/delete_icon.svg';
import errorIcon from '../../style/icons/error_icon.svg';
import {
  DATAPROC_LIGHTNING_ENGINE_PROPERTY,
  DATAPROC_TIER_PROPERTY,
  DEFAULT_LABEL_DETAIL
} from '../utils/const';
import { Input } from '../controls/MuiWrappedInput';

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

interface KeyValuePair {
  key: string;
  value: string;
}

interface LabelPropertiesRHFProps {
  value: KeyValuePair[];
  onChange: (value: KeyValuePair[]) => void;
  error?: string;
  buttonText: string;
  selectedJobClone?: any;
  selectedRuntimeClone?: any;
  batchInfoResponse?: any;
  createBatch?: boolean;
  fromPage?: string;
  labelEditMode?: boolean;
}

function LabelPropertiesRHF({
  value = [],
  onChange,
  error,
  buttonText,
  selectedJobClone,
  selectedRuntimeClone,
  batchInfoResponse,
  createBatch,
  fromPage,
  labelEditMode
}: LabelPropertiesRHFProps) {
  const [keyValidation, setKeyValidation] = React.useState<number>(-1);
  const [valueValidation, setValueValidation] = React.useState<number>(-1);
  const [duplicateKeyError, setDuplicateKeyError] = React.useState<number>(-1);

  useEffect(() => {
    if (!labelEditMode && fromPage !== 'scheduler') {
      if (
        buttonText === 'ADD LABEL' &&
        !selectedJobClone &&
        selectedRuntimeClone === undefined &&
        !createBatch
      ) {
        // Initialize with default label
        if (value.length === 0) {
          const [key, val] = DEFAULT_LABEL_DETAIL.split(':');
          onChange([{ key: key || '', value: val || '' }]);
        }
      } else {
        if (!selectedRuntimeClone && value.length > 0) {
          onChange([]);
        }
      }
    }
  }, []);

  const handleAddLabel = (event: React.MouseEvent<HTMLElement>) => {
    event.preventDefault();
    const newValue = [...value, { key: '', value: '' }];
    onChange(newValue);
  };

  const handleDeleteLabel = (index: number) => {
    const newValue = [...value];
    newValue.splice(index, 1);
    onChange(newValue);
    setDuplicateKeyError(-1);
    setKeyValidation(-1);
    setValueValidation(-1);
  };

  const handleEditKey = (newKey: string, index: number) => {
    const newValue = [...value];
    newValue[index] = { ...newValue[index], key: newKey };

    // Validate key format
    const regexp = /^[a-z0-9-_]+$/;
    if (
      (newKey.search(regexp) === -1 ||
        newKey.charAt(0) !== newKey.charAt(0).toLowerCase()) &&
      buttonText === 'ADD LABEL' &&
      newKey !== ''
    ) {
      setKeyValidation(index);
    } else {
      setKeyValidation(-1);
    }

    // Check for duplicate keys
    const duplicateIndex = newValue.findIndex(
      (item, i) => i !== index && item.key === newKey && newKey !== ''
    );
    if (duplicateIndex !== -1 && buttonText === 'ADD LABEL') {
      setDuplicateKeyError(index);
    } else {
      setDuplicateKeyError(-1);
    }

    onChange(newValue);
  };

  const handleEditValue = (newVal: string, index: number) => {
    const newValue = [...value];
    newValue[index] = { ...newValue[index], value: newVal };

    // Validate value format
    const regexp = /^[a-z0-9-_]+$/;
    if (newVal.search(regexp) === -1 && buttonText === 'ADD LABEL' && newVal !== '') {
      setValueValidation(index);
    } else {
      setValueValidation(-1);
    }

    onChange(newValue);
  };

  const handleBlur = () => {
    // Validation happens on change, just need to trigger re-render if needed
  };

  const styleAddLabelButton = () => {
    console.log("In label styling")
    const lastItem = value[value.length - 1];
    const hasValidLastKey = value.length === 0 || (lastItem && lastItem.key.length > 0);
    const noDuplicates = duplicateKeyError === -1;

    if (buttonText === 'ADD LABEL') {
      if (hasValidLastKey && noDuplicates) {
        return 'job-add-label-button';
      } else {
        return 'job-add-label-button-disabled';
      }
    } else {
      if (hasValidLastKey) {
        return 'job-add-property-button';
      } else {
        return 'job-add-property-button-disabled';
      }
    }
  };

  const isProtectedLabel = (item: KeyValuePair) => {
    const labelString = `${item.key}:${item.value}`;
    return (
      labelString.startsWith(DATAPROC_TIER_PROPERTY) ||
      labelString.startsWith(DATAPROC_LIGHTNING_ENGINE_PROPERTY)
    );
  };

  const isDefaultLabel = (item: KeyValuePair) => {
    return `${item.key}:${item.value}` === DEFAULT_LABEL_DETAIL;
  };

  const canAddNewItem = () => {
    const lastItem = value[value.length - 1];
    return value.length === 0 || (lastItem && lastItem.key.length > 0);
  };

  return (
    <div>
      <div className="job-label-edit-parent">
        {value.length > 0 &&
          value.map((item: KeyValuePair, index: number) => {
            const isProtected = isProtectedLabel(item);
            const isDefault = isDefaultLabel(item);
            const keyDisabled =
              isProtected ||
              (item.key !== '' && buttonText !== 'ADD LABEL') ||
              duplicateKeyError !== -1;
            const valueDisabled =
              isProtected || (isDefault && buttonText === 'ADD LABEL');

            return (
              <div key={`${item.key}-${index}`}>
                <div className="job-label-edit-row">
                  <div className="key-message-wrapper">
                    <div className="select-text-overlay-label">
                      <Input
                        sx={{ margin: 0 }}
                        className={`edit-input-style ${
                          keyDisabled && item.key !== '' ? ' disable-text' : ''
                        }`}
                        disabled={keyDisabled}
                        onBlur={handleBlur}
                        onChange={(e) => handleEditKey(e.target.value, index)}
                        value={item.key}
                        Label={`Key ${index + 1}*`}
                      />
                    </div>

                    {item.key === '' && duplicateKeyError !== index ? (
                      <div role="alert" className="error-key-parent">
                        <iconError.react
                          tag="div"
                          className="logo-alignment-style"
                        />
                        <div className="error-key-missing">key is required</div>
                      </div>
                    ) : (
                      keyValidation === index &&
                      buttonText === 'ADD LABEL' && (
                        <div className="error-key-parent">
                          <iconError.react
                            tag="div"
                            className="logo-alignment-style"
                          />
                          <div className="error-key-missing">
                            Only hyphens (-), underscores (_), lowercase
                            characters, and numbers are allowed. Keys must start
                            with a lowercase character. International characters
                            are allowed.
                          </div>
                        </div>
                      )
                    )}
                    {duplicateKeyError === index &&
                      buttonText === 'ADD LABEL' && (
                        <div className="error-key-parent">
                          <iconError.react
                            tag="div"
                            className="logo-alignment-style"
                          />
                          <div className="error-key-missing">
                            The key is already present
                          </div>
                        </div>
                      )}
                  </div>

                  <div className="key-message-wrapper">
                    <div className="select-text-overlay-label">
                      <Input
                        sx={{ margin: 0 }}
                        className={`edit-input-style ${
                          valueDisabled ? ' disable-text' : ''
                        }`}
                        onBlur={handleBlur}
                        onChange={(e) => handleEditValue(e.target.value, index)}
                        disabled={valueDisabled}
                        value={item.value}
                        Label={`Value ${index + 1}`}
                      />
                    </div>
                    {valueValidation === index && (
                      <div className="error-key-parent">
                        <iconError.react
                          tag="div"
                          className="logo-alignment-style"
                        />
                        <div className="error-key-missing">
                          Only hyphens (-), underscores (_), lowercase
                          characters, and numbers are allowed. International
                          characters are allowed.
                        </div>
                      </div>
                    )}
                  </div>

                  <div
                    role="button"
                    className={
                      isProtected || (isDefault && buttonText === 'ADD LABEL')
                        ? 'labels-delete-icon-hide'
                        : 'labels-delete-icon'
                    }
                    onClick={() => {
                      if (!(isProtected || (isDefault && buttonText === 'ADD LABEL'))) {
                        handleDeleteLabel(index);
                      }
                    }}
                  >
                    <iconDelete.react
                      tag="div"
                      className="logo-alignment-style"
                    />
                  </div>
                </div>
              </div>
            );
          })}

        {error && (
          <div className="error-key-parent">
            <iconError.react tag="div" className="logo-alignment-style" />
            <div className="error-key-missing">{error}</div>
          </div>
        )}

        <button
          type="button"
          className={styleAddLabelButton()}
          onClick={(e) => {
            const buttonClasses = e.currentTarget.className;
            const isDisabled =
              buttonClasses.includes('job-add-label-button-disabled') ||
              buttonClasses.includes('job-add-property-button-disabled');

            if (!isDisabled && canAddNewItem()) {
              handleAddLabel(e);
            } else {
              e.preventDefault();
            }
          }}
        >
          {canAddNewItem() ? (
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
              canAddNewItem() ? 'job-edit-text' : 'job-edit-text-disabled'
            }
          >
            {buttonText}
          </span>
        </button>
      </div>
    </div>
  );
}

export default LabelPropertiesRHF;