import json
import os
import subprocess
import sys

from typing import Dict, List

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
        environments = []

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
