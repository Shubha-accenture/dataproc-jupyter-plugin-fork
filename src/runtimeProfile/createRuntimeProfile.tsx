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

import React, { useEffect, useState } from 'react';
import { JupyterLab } from '@jupyterlab/application';
import { IThemeManager, Notification } from '@jupyterlab/apputils';
import { ILauncher } from '@jupyterlab/launcher';
import { ISettingRegistry } from '@jupyterlab/settingregistry';
import { LabIcon } from '@jupyterlab/ui-components';
import {
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  TextField
} from '@mui/material';

import { DataprocWidget } from '../controls/DataprocWidget';
import LeftArrowIcon from '../../style/icons/left_arrow_icon.svg';
import '../../style/runtimeProfile.css';
import {
  ICreateRuntimeProfilePayload,
  IRegionOption
} from './runtimeProfileInterface';
import {
  RuntimeProfileService,
  runtimeProfileService
} from './runtimeProfileService';

const iconLeftArrow = new LabIcon({
  name: 'launcher:left-arrow-icon',
  svgstr: LeftArrowIcon
});

export interface ICreateRuntimeProfileComponentProps {
  app?: JupyterLab;
  launcher?: ILauncher;
  themeManager?: IThemeManager;
  settingRegistry?: ISettingRegistry;
  service?: RuntimeProfileService;
  onBack?: () => void;
  onSuccess?: () => void;
}

export const CreateRuntimeProfileComponent: React.FC<
  ICreateRuntimeProfileComponentProps
> = ({
  app,
  service = runtimeProfileService,
  onBack,
  onSuccess
}): React.JSX.Element => {
  // Form State
  const [displayName, setDisplayName] = useState<string>('');
  const [region, setRegion] = useState<string>('us-central1');
  const [description, setDescription] = useState<string>('');

  // Options & Data State
  const [regions, setRegions] = useState<IRegionOption[]>([]);
  const [isLoadingOptions, setIsLoadingOptions] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Validation State
  const [displayNameTouched, setDisplayNameTouched] = useState<boolean>(false);

  // Load Regions from service
  useEffect(() => {
    let isMounted = true;
    const loadInitialData = async () => {
      setIsLoadingOptions(true);
      try {
        const loadedRegions = await service.getRegions();

        if (isMounted) {
          setRegions(loadedRegions);

          if (loadedRegions.length > 0 && !region) {
            setRegion(loadedRegions[0].name);
          }
        }
      } catch (error) {
        console.error('Failed to load runtime profile initial data', error);
      } finally {
        if (isMounted) {
          setIsLoadingOptions(false);
        }
      }
    };

    loadInitialData();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (app?.shell?.activeWidget) {
      app.shell.activeWidget.close();
    }
  };

  const isFormValid = displayName.trim().length > 0 && region.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid || isSubmitting) {
      setDisplayNameTouched(true);
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: ICreateRuntimeProfilePayload = {
        displayName: displayName.trim(),
        region,
        description: description.trim() || undefined
      };

      await service.createRuntimeProfile(payload, undefined, region);

      Notification.emit(
        `Runtime profile "${displayName}" created successfully.`,
        'success',
        { autoClose: 5000 }
      );

      if (onSuccess) {
        onSuccess();
      } else {
        handleBack();
      }
    } catch (error: any) {
      const errorMessage =
        error?.message || 'Failed to create runtime profile.';
      Notification.emit(errorMessage, 'error', { autoClose: 5000 });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="runtime-profile-main-wrapper">
      <div className="cluster-details-header">
        <div
          className="back-arrow-icon"
          onClick={handleBack}
          role="button"
          tabIndex={0}
          aria-label="Back"
        >
          <iconLeftArrow.react
            tag="div"
            className="icon-white logo-alignment-style"
          />
        </div>
        <div className="cluster-details-title">Create a runtime profile</div>
      </div>

      <div className="runtime-profile-container">
        <div className="runtime-profile-intro-text">
          A runtime profile is a named, reusable set of Serverless Spark runtime
          settings — image version, engine identity, networking, autoscaling,
          libraries and more. Once you configure it you can use it to submit
          batches effortlessly.
        </div>

        <form className="runtime-profile-form" onSubmit={handleSubmit}>
          {/* Row 1: Display name & Region */}
          <div className="runtime-profile-row">
            <div className="runtime-profile-col">
              <TextField
                id="runtime-profile-display-name"
                label="Display name"
                placeholder="e.g. my-runtime-profile"
                variant="outlined"
                size="small"
                fullWidth
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                onBlur={() => setDisplayNameTouched(true)}
                error={displayNameTouched && displayName.trim().length === 0}
                helperText={
                  displayNameTouched && displayName.trim().length === 0
                    ? 'Display name is required'
                    : undefined
                }
                InputLabelProps={{ shrink: true }}
              />
            </div>
            <div className="runtime-profile-col">
              <FormControl size="small" fullWidth variant="outlined">
                <InputLabel id="runtime-profile-region-label" shrink>
                  Region *
                </InputLabel>
                <Select
                  labelId="runtime-profile-region-label"
                  id="runtime-profile-region"
                  value={region}
                  label="Region *"
                  onChange={(e: SelectChangeEvent) =>
                    setRegion(e.target.value as string)
                  }
                  notched
                  disabled={isLoadingOptions}
                >
                  {regions.map(r => (
                    <MenuItem key={r.name} value={r.name}>
                      {r.displayName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </div>
          </div>

          {/* Row 2: Description */}
          <div className="runtime-profile-full-row">
            <TextField
              id="runtime-profile-description"
              label="Description"
              placeholder="Optional description"
              variant="outlined"
              size="small"
              fullWidth
              value={description}
              onChange={e => setDescription(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </div>

          {/* Action Buttons */}
          <div className="runtime-profile-buttons">
            <div
              role="button"
              tabIndex={0}
              className={
                !isFormValid || isSubmitting
                  ? 'submit-button-disable-style'
                  : 'submit-button-style'
              }
              onClick={
                !isFormValid || isSubmitting ? undefined : e => handleSubmit(e)
              }
            >
              {isSubmitting ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                'CREATE'
              )}
            </div>
            <div
              role="button"
              tabIndex={0}
              className="job-cancel-button-style"
              onClick={handleBack}
            >
              CANCEL
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export class CreateRuntimeProfile extends DataprocWidget {
  app: JupyterLab;
  launcher: ILauncher;
  settingRegistry: ISettingRegistry;

  constructor(
    app: JupyterLab,
    launcher: ILauncher,
    themeManager: IThemeManager,
    settingRegistry: ISettingRegistry
  ) {
    super(themeManager);
    this.app = app;
    this.launcher = launcher;
    this.settingRegistry = settingRegistry;
  }

  renderInternal(): React.JSX.Element {
    return (
      <CreateRuntimeProfileComponent
        app={this.app}
        launcher={this.launcher}
        themeManager={this.themeManager}
        settingRegistry={this.settingRegistry}
      />
    );
  }
}
