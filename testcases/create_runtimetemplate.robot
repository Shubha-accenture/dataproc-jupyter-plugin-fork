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
back_nav_check
    checking_back_and_cancel_btn_rt_launcher
    checking_back_and_cancel_btn_rt_config_setup

#Shared-VPC
create_runtimetemplate_launcher_with_shared_vpc
    [Documentation]    launcher+shared_vpc
    project_check_test_consume_shared_vpc
    open_the_create_rt_page_from_launcher
    input_display_name
    ${rt_display_name}    get_runtime_template_display_name
    input_description
    input_custom_container_image
    select_shared_vpc_networks
    input_network_tags
    select_metastore_project_id
    #select_metastore_region
    select_metastore_services
    select_max_idle_time
    select_max_session_time
    input_python_packages_repository
    #select_history_server_cluster
    add_spark_property
    add_label
    save_rt_btn
    validate_runtime_template_display_name    ${rt_display_name}


create_runtimetemplate_config_setup_shared_vpc
    [Documentation]    config_setup+shared_vpc
    project_check_test_consume_shared_vpc
    open_config_setup_page
    click_create_rt_config_setup
    input_display_name
    ${rt_display_name}    get_runtime_template_display_name
    input_description
    input_custom_container_image
    select_shared_vpc_networks
    input_network_tags
    select_metastore_project_id
    #select_metastore_region
    select_metastore_services
    select_max_idle_time
    select_max_session_time
    input_python_packages_repository
    #select_history_server_cluster
    add_spark_property
    add_label
    save_rt_btn
    validate_runtime_template_display_name    ${rt_display_name}

#Project-dataproc-jupyter-extension-dev

create_runtimetemplate_config_setup_local_network
    [Documentation]    config_setup+local_networks
    project_check_dataproc_jupyter_extension_dev
    open_config_setup_page
    click_create_rt_config_setup
    input_display_name
    ${rt_display_name}    get_runtime_template_display_name
    input_description
    input_custom_container_image
    select_networks_in_this_project
    input_network_tags
    select_metastore_project_id
    #select_metastore_region
    select_metastore_services
    select_max_idle_time
    select_max_session_time
    input_python_packages_repository
    select_history_server_cluster
    add_spark_property
    add_label
    save_rt_btn
    validate_runtime_template_display_name    ${rt_display_name}


create_runtimetemplate_launcher_local_network
    [Documentation]    launcher+local_networks
    project_check_dataproc_jupyter_extension_dev
    open_the_create_rt_page_from_launcher
    input_display_name
    ${rt_display_name}    get_runtime_template_display_name
    input_description
    input_custom_container_image
    select_networks_in_this_project
    input_network_tags
    select_metastore_project_id
    #select_metastore_region
    select_metastore_services
    select_max_idle_time
    select_max_session_time
    input_python_packages_repository
    select_history_server_cluster
    add_spark_property
    add_label
    save_rt_btn
    validate_runtime_template_display_name    ${rt_display_name}
