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

import React from 'react';
import { JupyterLab } from '@jupyterlab/application';
import { IThemeManager } from '@jupyterlab/apputils';
import { DataprocWidget } from '../controls/DataprocWidget';
import { ILauncher } from '@jupyterlab/launcher';
import { ISettingRegistry } from '@jupyterlab/settingregistry';

const CreateRuntimeProfileComponent = ({
  app,
  launcher,
  themeManager,
  settingRegistry
}: {
  app: JupyterLab;
  launcher: ILauncher;
  themeManager: IThemeManager;
  settingRegistry: ISettingRegistry;
}): React.JSX.Element => {
  return (
    <div className="component-level">
      <div className="cluster-details-header">
        <div className="cluster-details-title">Create Runtime Profile</div>
      </div>
      <div className="runtime-container">
        <form style={{ padding: '20px' }}>
          <div>Create Runtime Profile</div>
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
      <div className="component-level">
        <CreateRuntimeProfileComponent
          app={this.app}
          launcher={this.launcher}
          themeManager={this.themeManager}
          settingRegistry={this.settingRegistry}
        />
      </div>
    );
  }
}
