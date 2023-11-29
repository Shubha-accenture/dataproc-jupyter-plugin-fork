*** Settings ***
Library    Selenium2Library
Library    Collections
Library    String
Variables    ../constants/constant.py
Variables    ../locators/runtimetemplate.py
Variables    ../locators/login.py
Variables    ../locators/launcher.py
Variables    ../locators/sessions.py
Resource    ../resources/login.robot
Resource    ../resources/config_setup.robot
Resource    ../resources/runtimetemplate.robot
Resource    ../resources/clusters.robot
Resource    ../resources/batches.robot
Resource    ../resources/jobs.robot
Resource    ../resources/session.robot
Test Setup    login
Test Teardown    logout

*** Test Cases ***
test1
    project_check_dataproc_jupyter_extension_dev
    open_sessions_listing_page
    back_nav_session_details

test2
    project_check_dataproc_jupyter_extension_dev
    open_sessions_listing_page
    check_session_id_and_status

test3
    project_check_dataproc_jupyter_extension_dev
    open_sessions_listing_page
    session_delete_listing

test4
    project_check_dataproc_jupyter_extension_dev
    open_sessions_listing_page
    check_static_elements_session_listing
    open_session_details_page
    check_static_elements_session_details

test5
    project_check_dataproc_jupyter_extension_dev
    open_sessions_listing_page
    check_descending_order_of_datetime