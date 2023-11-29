*** Settings ***
Library    Selenium2Library
Library    RequestsLibrary
Library    Collections
Library    String
Variables    ../constants/constant.py
Variables    ../locators/login.py
Variables    ../locators/launcher.py
Variables    ../locators/config_setup.py
Variables    ../locators/runtimetemplate.py
Resource    ../resources/config_setup.robot
Resource    jobs.robot


*** Keywords ***
open_the_create_rt_page_from_launcher
    Scroll Element Into View    ${launcher_rt_card_loc}
    Wait Until Element Is Visible    ${launcher_rt_card_loc}
    Click Element    ${launcher_rt_card_loc}

checking_back_and_cancel_btn_rt_launcher
    open_the_create_rt_page_from_launcher
    Wait Until Element Is Visible    ${back_nav_btn}
    Click Element    ${back_nav_btn}
    Page Should Contain    Dataproc Serverless Notebooks
    open_the_create_rt_page_from_launcher
    Wait Until Element Is Visible    ${cancel_btn}    ${wait_mid}
    Click Element    ${cancel_btn}
    Page Should Contain    Dataproc Serverless Notebooks

open_the_create_rt_page_from_config_setup
    open_config_setup_page
    Scroll Element Into View    ${create_rt_btn_config_setup}
    Click Element    ${create_rt_btn_config_setup}

checking_back_and_cancel_btn_rt_config_setup
    open_the_create_rt_page_from_config_setup
    Wait Until Element Is Visible    ${back_nav_btn}    ${wait_mid}
    Scroll Element Into View    ${back_nav_btn}
    Wait Until Element Is Visible    ${back_nav_btn}
    Click Element    ${back_nav_btn}
    Page Should Contain    Serverless Runtime Templates
    Scroll Element Into View    ${create_rt_btn_config_setup}
    Click Element    ${create_rt_btn_config_setup}
    Wait Until Element Is Visible    ${back_nav_btn}    ${wait_mid}
    Scroll Element Into View    ${cancel_btn}
    Click Element    ${cancel_btn}
    Page Should Contain    Serverless Runtime Templates

input_display_name
    Wait Until Element Is Visible    ${input_display_name}
    Click Element    ${input_display_name}
    ${get_time}    Get Time
    Input Text    ${input_display_name}    auto-test-${get_time}
    ${get_time}    Set Variable    0

input_description
    Scroll Element Into View    ${input_description}
    Wait Until Element Is Visible    ${input_description}
    Click Element    ${input_description}
    Input Text    ${input_description}    automated testing trials
    
input_custom_container_image
    Scroll Element Into View    ${input_container_image}
    Wait Until Element Is Visible    ${input_container_image}
    Click Element    ${input_container_image}
    Input Text    ${input_container_image}    ${container_image_txt}

select_networks_in_this_project
    Scroll Element Into View    ${select_networks_shared_from_host_project}
    Click Element    ${select_networks_shared_from_host_project}
    Scroll Element Into View    ${select_networks_in_this_project}
    Click Element    ${select_networks_in_this_project}

select_shared_vpc_networks
    Scroll Element Into View    ${select_networks_shared_from_host_project}
    Click Element    ${select_networks_shared_from_host_project}
    Sleep    2
    Scroll Element Into View    ${shared_subnetworks_dropdown}
    Wait Until Element Is Visible    ${shared_subnetworks_dropdown}
    Click Element    ${shared_subnetworks_dropdown}
    Wait Until Element Is Visible    ${shared_subnetworks_dropdown_first_element}
    Click Element    ${shared_subnetworks_dropdown_first_element}

input_network_tags
    Scroll Element Into View    ${input_network_tags}
    Click Element    ${input_network_tags}
    Input Text    ${input_network_tags}    networktag1
    Press Keys    ${input_network_tags}    ENTER
    Input Text    ${input_network_tags}    networktag2
    Press Keys    ${input_network_tags}    ENTER

select_metastore_project_id
    Scroll Element Into View    ${select_metastore_project_id_dropdown}
    Click Element    ${select_metastore_project_id_dropdown}
    Input Text    ${select_metastore_project_id_dropdown}    dataproc-jupyter-extension-dev
    Wait Until Element Is Visible    ${select_metastore_project_id}    ${wait_max}
    Click Element    ${select_metastore_project_id}

select_metastore_region
    Wait Until Element Is Visible    ${select_metastore_project_region_dropdown}    ${wait_max}
    Scroll Element Into View    ${select_metastore_project_region_dropdown}
    Click Element    ${select_metastore_project_region_dropdown}
    Input Text    ${select_metastore_project_region_dropdown}    us-central1
    Wait Until Element Is Visible    ${select_metastore_project_region}    ${wait_max}
    Click Element    ${select_metastore_project_region}

select_metastore_services
    Sleep    3
    Wait Until Element Is Visible    ${select_metastore_service_dropdown}    ${wait_max}
    Scroll Element Into View    ${select_metastore_service_dropdown}
    Click Element    ${select_metastore_service_dropdown}
    Wait Until Element Is Visible    ${select_metastore_services_first_element}    20
    Click Element    ${select_metastore_services_first_element}

select_max_idle_time
    Scroll Element Into View    ${input_max_idle_time}
    Click Element    ${input_max_idle_time}
    Input Text    ${input_max_idle_time}    200
    Click Element    ${select_idle_time_dropdown}
    Wait Until Element Is Visible    ${select_min}
    Click Element    ${select_min}

select_max_session_time
    Scroll Element Into View    ${input_max_session_time}
    Click Element    ${input_max_session_time}
    Input Text    ${input_max_session_time}    200
    Click Element    ${select_session_time_dropdown}
    Wait Until Element Is Visible    ${select_min}
    Click Element    ${select_min}

input_python_packages_repository
    Scroll Element Into View    ${input_packages_repository}
    Click Element    ${input_packages_repository}
    Input Text    ${input_packages_repository}    https://pypi.org/project/example-pypi-package/

select_history_server_cluster
    Scroll Element Into View    ${history_server_cluster_dropdown}
    Click Element    ${history_server_cluster_dropdown}
    Wait Until Element Is Visible    ${select_server_history_cluster}
    Click Element    ${select_server_history_cluster}

add_spark_property
    Scroll Element Into View    ${click_add_property_btn}
    Click Element    ${click_add_property_btn}
    Wait Until Element Is Visible    ${add_prop_key1}
    Click Element    ${add_prop_key1}
    Input Text    ${add_prop_key1}    prop_key1
    Click Element    ${add_prop_value1}    
    Input Text    ${add_prop_value1}    prop_val1
    Click Element    ${click_add_property_btn}
    Click Element    ${add_prop_key2}
    Input Text    ${add_prop_key2}    prop_key2
    Click Element    ${add_prop_value2}    
    Input Text    ${add_prop_value2}    prop_val2

add_label
    Scroll Element Into View    ${click_add_label_btn}
    Click Element    ${click_add_label_btn}
    Wait Until Element Is Visible    ${add_label_key2}
    Click Element    ${add_label_key2}
    Input Text    ${add_label_key2}    label_key1
    Click Element    ${add_label_value2}    
    Input Text    ${add_label_value2}    label_val1
    Click Element    ${click_add_label_btn}
    Click Element    ${add_label_key3}
    Input Text    ${add_label_key3}    label_key2
    Click Element    ${add_label_value3}    
    Input Text    ${add_label_value3}    label_val2

save_rt_btn    
    Scroll Element Into View    ${save_rt_btn}
    Click Element    ${save_rt_btn}
    #Wait Until Element Is Visible    ${tostify}    ${wait_max}
    #${toast_txt}    Get Text    ${tostify_text}
    #Should End With    ${toast_txt}   successfully submitted

change_project_for_shared_vpc
    open_config_setup_page
    Click Element    ${project_id_dropdown}
    Click Element    ${clear_project_id}
    Input Text    ${project_id_dropdown}    test-consume-shared-vpc
    Wait Until Element Is Visible    ${select_vpc_project_id}    ${wait_max}
    Click Element    ${select_vpc_project_id}
    Click Element    ${project_region_dropdown}
    Click Element    ${clear_project_region}
    Input Text    ${project_region_dropdown}    us-west1
    Wait Until Element Is Visible    ${select_vpc_project_region}    ${wait_max}
    Click Element    ${select_vpc_project_region}
    Click Element    ${config_save_button}
    Wait Until Element Is Visible    ${tostify_close_btn}    60
    Click Element    ${tostify_close_btn}

change_project_for_extension_dev
    open_config_setup_page
    Click Element    ${project_id_dropdown}
    Click Element    ${clear_project_id}
    Input Text    ${project_id_dropdown}    dataproc-jupyter-extension-dev
    Wait Until Element Is Visible    ${select_project_id}    ${wait_max}
    Click Element    ${select_project_id}
    Click Element    ${project_region_dropdown}
    Click Element    ${clear_project_region}
    Input Text    ${project_region_dropdown}    us-central1
    Wait Until Element Is Visible    ${select_project_region}    ${wait_max}
    Click Element    ${select_project_region}
    Click Element    ${config_save_button}
    Wait Until Element Is Visible    ${tostify_close_btn}    60
    Click Element    ${tostify_close_btn}
    close_tabs

click_create_rt_config_setup
    Scroll Element Into View    ${create_rt_btn}
    Click Element    ${create_rt_btn}
    Page Should Contain    Serverless Runtime Template

get_runtime_template_display_name
    Scroll Element Into View    ${input_display_name}
    ${rt_display_name}    Get Value    ${input_display_name}
    [Return]    ${rt_display_name}

validate_runtime_template_display_name
    [Arguments]    ${rt_display_name}
    open_config_setup_page
    Wait Until Page Contains    ${rt_display_name}    60