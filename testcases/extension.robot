*** Settings ***
Library    Selenium2Library
Library    RequestsLibrary
Library    Collections
Library    String
Variables    ../constants/constant.py
Variables    ../locators/login.py
Variables    ../locators/launcher.py
Variables    ../locators/runtimetemplate.py
Resource    ../resources/login.robot
Resource    ../resources/config_setup.robot
Resource    ../resources/runtimetemplate.robot
Resource    ../resources/clusters.robot
Resource    ../resources/batches.robot
Resource    ../resources/jobs.robot
Resource    ../resources/session.robot
Library    ../resources/python_keywords.py
Test Setup    login
Test Teardown    logout

*** Test Cases ***
test1
    project_check_dataproc_jupyter_extension_dev


