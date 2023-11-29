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
    open_clusters_listing_page
    back_nav_cluster_details

test2
    project_check_dataproc_jupyter_extension_dev
    open_clusters_listing_page
    check_cluster_name_and_status

test3
    project_check_dataproc_jupyter_extension_dev
    open_clusters_listing_page
    check_start_stop_cluster_listing

test4
    change_project_for_extension_dev
    open_clusters_listing_page
    click_start_action_btn_on_clusters_listing

test5
    project_check_dataproc_jupyter_extension_dev
    open_clusters_listing_page
    click_stop_action_btn_on_clusters_listing

test6
    project_check_dataproc_jupyter_extension_dev
    open_clusters_listing_page
    click_restart_action_btn_on_clusters_listing

test7
    project_check_dataproc_jupyter_extension_dev
    open_clusters_listing_page
    click_start_action_btn_on_clusters_details

test8
    change_project_for_extension_dev
    open_clusters_listing_page
    click_stop_action_btn_on_clusters_details

test9
    change_project_for_extension_dev
    open_clusters_listing_page
    check_static_elements_cluster_listing
    open_cluster_details_page
    check_static_elements_cluster_details

test10
    change_project_for_extension_dev
    open_clusters_listing_page
    open_cluster_details_page
    check_descending_order_of_datetime