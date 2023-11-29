*** Settings ***
Library    Selenium2Library
Library    Collections
Library    String
Variables    ../constants/constant.py
Variables    ../locators/runtimetemplate.py
Variables    ../locators/login.py
Variables    ../locators/launcher.py
Variables    ../locators/batches.py
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
    open_batch_listing_page
    back_nav_batch_details

test2
    project_check_dataproc_jupyter_extension_dev
    open_batch_listing_page
    check_batch_id_and_status

test3
    project_check_dataproc_jupyter_extension_dev
    open_batch_listing_page
    batch_delete_listing

test4
    project_check_dataproc_jupyter_extension_dev
    open_batch_listing_page
    batch_details_clone

test5
    project_check_dataproc_jupyter_extension_dev
    open_batch_listing_page
    batch_details_delete

test6
    project_check_dataproc_jupyter_extension_dev
    open_batch_listing_page
    check_static_elements_batch_listing
    open_batch_details_page
    check_static_elements_batch_details

test7
    project_check_dataproc_jupyter_extension_dev
    open_batch_listing_page
    check_descending_order_of_datetime