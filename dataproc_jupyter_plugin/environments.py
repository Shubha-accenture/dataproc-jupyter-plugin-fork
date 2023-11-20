import json
import os
import subprocess
import sys
from typing import Dict, List
from dataproc_jupyter_plugin.handlers import get_cached_credentials


import requests

from jupyter_scheduler.models import RuntimeEnvironment
from jupyter_scheduler.environments import EnvironmentManager

class CustomEnvironmentManager(EnvironmentManager):
    """Provides a list of Conda environments. If Conda is not
    installed or activated, it defaults to providing exclusively
    the Python executable that JupyterLab is currently running in.
    """
    print("-> CustomEnvironmentManager")

    def list_environments(self) -> List[RuntimeEnvironment]:
        print("-> CustomEnvironmentManager: List_Environments")
        credentials = get_cached_credentials()

    # Check if the access token is available
        if 'access_token' in credentials:
            access_token = credentials['access_token']
        print(access_token)
        environments = []
        api_endpoint = f"https://composer.googleapis.com/v1/projects/dataproc-jupyter-extension-dev/locations/us-central1/environments"

        headers = {
        'Content-Type': 'application/json',
        'Authorization': f'Bearer {access_token}'
        }


        try:
        # Make the API call using the requests library
            response = requests.get(api_endpoint,headers=headers)

        # Check if the request was successful (status code 200)
            if response.status_code == 200:
            # Print the response content
                print("Composer Environments:")
                print(response.json())
                resp = response.json()
                environment = resp['environments']

                # Extract the 'name' values from the 'environments' list
                names = [env['name'] for env in environment]

                # Extract the last value after the last slash for each 'name'
                last_values = [name.split('/')[-1] for name in names]

                # Print all the last values
                print("Last Values in Environment Names:")
                for last_value in last_values:
                    print(last_value)
                for env in last_values:
                    name = env
                    environments.append(
                        RuntimeEnvironment(
                            name=name,
                            label=name,
                            description=f"Environment: {name}",
                            file_extensions=["ipynb"],
                            output_formats=["ipynb", "html"],
                            metadata={"path": env},
                        )
                    )
                return environments
            else:
            # Print an error message if the request was not successful
                print(f"Error: {response.status_code} - {response.text}")

        except Exception as e:
            print(f"Error: {e}")
            try:
                envs = subprocess.check_output(["conda", "env", "list", "--json"])
                envs = json.loads(envs).get("envs", [])
            except subprocess.CalledProcessError as e:
                envs = []
            except FileNotFoundError as e:
                envs = []

            current_python_root = sys.prefix
            if not envs or current_python_root not in envs:
                envs = [sys.executable]

            for env in envs:
                name = os.path.basename(env)
                environments.append(
                    RuntimeEnvironment(
                        name=name,
                        label=name,
                        description=f"Environment: {name}",
                        file_extensions=["ipynb"],
                        output_formats=["ipynb", "html"],
                        metadata={"path": env},
                    )
                )
            print("<- CustomEnvironmentManager: List_Environments")
            return environments

    def manage_environments_command(self) -> str:
        return ""

    def output_formats_mapping(self) -> Dict[str, str]:
        return {"ipynb": "Notebook", "html": "HTML"}
