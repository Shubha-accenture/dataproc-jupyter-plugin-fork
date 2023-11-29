*** Settings ***
Library    Selenium2Library
Library    Collections
Library    String
Variables    ../constants/constant.py
Variables    ../locators/runtimetemplate.py
Variables    ../locators/login.py
Variables    ../locators/launcher.py
Resource    ../resources/login.robot
Resource    ../resources/config_setup.robot
Resource    ../resources/runtimetemplate.robot
Resource    ../resources/clusters.robot
Resource    ../resources/batches.robot
Resource    ../resources/jobs.robot
Test Setup    login
Test Teardown    logout

*** Test Cases ***
test1
    project_check_dataproc_jupyter_extension_dev
    open_jobs_listing_page
    back_nav_job_details

test2
    project_check_dataproc_jupyter_extension_dev
    open_jobs_listing_page
    check_job_id_and_status

test3
    project_check_dataproc_jupyter_extension_dev
    open_jobs_listing_page
    job_delete_listing

test4
    project_check_dataproc_jupyter_extension_dev
    open_jobs_listing_page
    job_clone_listing

test5
    project_check_dataproc_jupyter_extension_dev
    open_jobs_listing_page
    job_details_clone

test6
    project_check_dataproc_jupyter_extension_dev
    open_jobs_listing_page
    job_details_delete

test7    
    project_check_dataproc_jupyter_extension_dev
    open_jobs_listing_page
    job_details_edit_labels

test8
    change_project_for_extension_dev
    open_jobs_listing_page
    check_static_elements_jobs_listing
    open_job_details_page
    check_static_elements_job_details

test9
    change_project_for_extension_dev
    open_jobs_listing_page
    check_descending_order_of_datetime