/**
 * @license
 * Copyright 2025 Google LLC
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
import { showDialog, ReactWidget, Dialog } from '@jupyterlab/apputils';
import { requestAPI } from '../handler/handler';
import { authApi } from './utils';

interface LoginDialogProps {
  loginError: boolean;
  configError: boolean;
  onLoginSuccess?: () => void;
}

/**
 * A reusable dialog body component for showing login and configuration errors
 */
export const LoginPopup: React.FC<LoginDialogProps> = ({
  loginError,
  configError,
  onLoginSuccess
}) => {
  return (
    <div className="jp-Dialog-body">
      {loginError && <p>Please login to continue</p>}
      {configError && (
        <p>Please configure gcloud with account, project-id and region</p>
      )}
    </div>
  );
};

/**
 * Create a widget from our login component to use in the dialog
 */
class LoginDialogWidget extends ReactWidget {
  private _props: LoginDialogProps;

  constructor(props: LoginDialogProps) {
    super();
    this._props = props;
  }

  render(): JSX.Element {
    return <LoginPopup {...this._props} />;
  }
}

export const showLoginDialog = async (
  errorState: { loginError: boolean; configError: boolean },
  onLoginSuccess?: () => void
): Promise<boolean> => {
  const { loginError, configError } = errorState;
  const title = loginError ? 'Login Required' : 'Configuration Error';

  const handleSignIn = async () => {
    try {
      await requestAPI('login', { method: 'POST' });
      const credentials = await authApi();

      if (
        credentials &&
        !credentials.login_error &&
        !credentials.config_error
      ) {
        if (onLoginSuccess) {
          onLoginSuccess();
        }

        // Reload the page
        window.location.reload();
        return true;
      } else {
        if (credentials?.config_error) {
          window.location.reload();
        }
        return false;
      }
    } catch (err) {
      console.error('Login failed:', err);
      return false;
    }
  };

  // Create the dialog widget
  const dialogWidget = new LoginDialogWidget({
    loginError,
    configError,
    onLoginSuccess
  });

  // Define the buttons based on the error type
  const buttons = loginError
    ? [Dialog.cancelButton(), Dialog.okButton({ label: 'Sign In' })]
    : [Dialog.okButton({ label: 'OK' })];

  // Show the dialog
  const result = await showDialog({
    title,
    body: dialogWidget,
    buttons
  });

  // Handle the result
  if (result.button.accept && loginError) {
    return await handleSignIn();
  }

  // Return false if the dialog was canceled
  return false;
};