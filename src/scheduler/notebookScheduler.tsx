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

import React from 'react';

import { IThemeManager } from '@jupyterlab/apputils';
import { DataprocWidget } from '../controls/DataprocWidget';
import { JupyterLab } from '@jupyterlab/application';
import CreateNotebookScheduler from './createNotebookScheduler';

import { DocumentRegistry } from '@jupyterlab/docregistry';
import { INotebookModel } from '@jupyterlab/notebook';
import { IFileBrowserFactory } from '@jupyterlab/filebrowser';

const NotebookSchedulerComponent = ({
  themeManager,
  app,
  context, 
  factory
}: {
  themeManager: IThemeManager;
  app: JupyterLab;
  context: DocumentRegistry.IContext<INotebookModel> | string;
  factory:IFileBrowserFactory
}): JSX.Element => {
  return (
    <div className="component-level">
      <CreateNotebookScheduler
        themeManager={themeManager}
        app={app}
        context={context}
        factory={factory}
      />
    </div>
  );
};

export class NotebookScheduler extends DataprocWidget {
  app: JupyterLab;
  context: DocumentRegistry.IContext<INotebookModel> | string;
  factory: IFileBrowserFactory;
  constructor(
    app: JupyterLab,
    themeManager: IThemeManager,
    context: DocumentRegistry.IContext<INotebookModel> | string,
    factory:IFileBrowserFactory
  ) {
    super(themeManager);
    this.app = app;
    this.context = context;
    this.factory = factory;
  }

  renderInternal(): React.JSX.Element {
    return (
      <NotebookSchedulerComponent
        themeManager={this.themeManager}
        app={this.app}
        context={this.context}
        factory={this.factory}
      />
    );
  }
}
