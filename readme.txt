VS Code - Selenium Robotframework Setup Instructions:

1. Install Robot Framework Language Server (Robocorp) (VS Code Extensions)
2. Install python (VS Code Extensions)
3. Click on the view options on the menu bar of VS code.
4. Select the “Command Palette” 
5. Search for create python virtual environment and select it.
6. Select venv 
7. Python Version 3.9.6
8. Then again go to “Command Palette”
9. Select python interpreter, the one which is venv and make sure that is selected on the VS code terminal after selection.
10. Then, pip install:
      requests                        2.31.0
      robotframework                  6.1.1
      robotframework-pabot            2.16.0
      robotframework-pythonlibcore    4.2.0
      robotframework-requests         0.9.5
      robotframework-retryfailed      0.2.0
      robotframework-selenium2library 3.0.0
      robotframework-seleniumlibrary  6.1.3
      robotframework-stacktrace       0.4.1
      selenium                        4.14.0
11. Restart the VS Code terminal
12. Then select the test cases file (ex: robot ./testcases/create_batch.robot) and run the command.
13. Possible error - Have to place the chrome driver in the scripts folder. 
      https://googlechromelabs.github.io/chrome-for-testing/#stable
14. Rerun the command (ex: robot ./testcases/create_batch.robot)
15. Reference links:
      https://robotframework.org/robotframework/latest/RobotFrameworkUserGuide.html (Official)

We can use this command to bypass the ask of password on Jupyterlab while running the automation scripts. jupyter lab --LabApp.token=''