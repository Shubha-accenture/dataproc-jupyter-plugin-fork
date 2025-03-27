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

// Interface for authentication credentials
interface IAuthCredentials {
  access_token: string;
  project_id: string;
  region_id: string;
  config_error: number;
  login_error: number;
}
declare global {
  interface Window {
    shouldStopPolling?: boolean;
  }
}

/**
 * Render an empty component-level div
 */
const renderEmptyComponentLevel = () => {
  const componentLevelElements = document.querySelectorAll('.component-level');
  componentLevelElements.forEach(element => {
    element.innerHTML = '';
    (element as HTMLElement).style.backgroundColor = 'white';
    (element as HTMLElement).style.height = '100%';
    (element as HTMLElement).style.display = 'flex';
    (element as HTMLElement).style.justifyContent = 'center';
    (element as HTMLElement).style.alignItems = 'center';
  });
};

/**
 * Fetch authentication credentials with optional error handling
 * @param checkApiEnabled - Whether to check for login or config errors (default: true)
 * @returns Authentication credentials or undefined
 */
export const authApi = async (
  checkApiEnabled: boolean = true
): Promise<IAuthCredentials | undefined> => {
  try {
    const data = await requestAPI('credentials');

    if (typeof data === 'object' && data !== null) {
      const credentials: IAuthCredentials = {
        access_token: (data as { access_token: string }).access_token,
        project_id: (data as { project_id: string }).project_id,
        region_id: (data as { region_id: string }).region_id,
        config_error: (data as { config_error: number }).config_error,
        login_error: (data as { login_error: number }).login_error
      };

      if (checkApiEnabled) {
        if (credentials.login_error || credentials.config_error) {
          try {
            const dialogResult = await showLoginDialog({
              loginError: credentials.login_error === 1,
              configError: credentials.config_error === 1
            });

            if (dialogResult) {
              return await authApi();
            } else {
              // Render empty component-level div when dialog is canceled
              renderEmptyComponentLevel();
              return credentials;
            }
          } catch (dialogError) {
            console.error('Dialog was cancelled or failed:', dialogError);
            renderEmptyComponentLevel();
            return credentials;
          }
        } else {
          return credentials;
        }
      }
    }
  } catch (reason) {
    console.error(`Error on GET credentials.\n${reason}`);
  }
};

/**
 * Login Popup Component for displaying login and configuration errors
 */
interface LoginDialogProps {
  loginError: boolean;
  configError: boolean;
  onLoginSuccess?: () => void;
}

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
 * Widget to render the Login Popup in a JupyterLab dialog
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

/**
 * Show login dialog with appropriate error handling
 * @param errorState - Contains login and config error states
 * @param onLoginSuccess - Optional callback on successful login
 * @returns Promise resolving to boolean indicating login success
 */
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

  const buttons = loginError
    ? [Dialog.cancelButton(), Dialog.okButton({ label: 'Sign In' })]
    : [Dialog.okButton({ label: 'OK' })];

  // Show the dialog
  const result = await showDialog({
    title,
    body: dialogWidget,
    buttons
  });

  if (result.button.accept && loginError) {
    return await handleSignIn();
  }

  // Render empty component-level div if dialog is canceled
  renderEmptyComponentLevel();

  // Return false if the dialog was canceled
  return false;
};