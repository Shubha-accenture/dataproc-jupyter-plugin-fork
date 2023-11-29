*** Settings ***
Library    Selenium2Library
Library    RequestsLibrary
Library    Collections
Library    String
Library    XML
Library    ../.venv/lib/python3.9/site-packages/robot/libraries/DateTime.py
Library    ../resources/python_keywords.py
Variables    ../constants/constant.py
Variables    ../locators/batches.py
Variables    ../locators/login.py
Variables    ../locators/launcher.py
Variables    ../locators/config_setup.py
Variables    ../locators/config_setup.py
Variables    ../locators/jobs.py
Resource    config_setup.robot
Resource    runtimetemplate.robot

*** Keywords ***
close_tabs
    ${count}    Get Element Count    ${close_btn_on_tabs}
    ${a}    Set Variable    0
    FOR    ${a}    IN RANGE    1    ${count}    
        Log To Console    ${a}
        Click Element    (//*[local-name()='svg' and @data-icon='ui-components:close'])[2]
    END

project_check_dataproc_jupyter_extension_dev
    open_config_setup_page
    ${proj_id}    Get Value    ${project_id_dropdown}
    ${proj_id_set}    Set Variable    dataproc-jupyter-extension-dev
    close_tabs
    IF    $proj_id != $proj_id_set
        change_project_for_extension_dev
        close_tabs
    END

project_check_test_consume_shared_vpc
    open_config_setup_page
    ${proj_id}    Get Value    ${project_id_dropdown}
    ${proj_id_set}    Set Variable    test-consume-shared-vpc
    close_tabs
    IF    $proj_id != $proj_id_set
        change_project_for_shared_vpc
        close_tabs
    END

open_batch_listing_page
    Scroll Element Into View    ${serverless_card_launcher_loc}
    Click Element    ${serverless_card_launcher_loc}
    Wait Until Element Is Visible    ${batches_top_tabpanel_loc}    30
    Click Element    ${batches_top_tabpanel_loc}

click_on_create_batch_btn
    Wait Until Element Is Enabled    ${create_batch_btn_loc}    ${wait_max}
    Wait Until Element Is Visible    ${create_batch_btn_loc}    ${wait_max}
    Click Element    ${create_batch_btn_loc}

click_on_back_navigation_btn_batch
    Scroll Element Into View    ${back_navigation_btn_loc}
    Wait Until Element Is Visible    ${back_navigation_btn_loc}    
    Click Element    ${back_navigation_btn_loc}
    Element Should Be Visible    ${create_batch_btn_loc}

click_on_cancel_btn_batch
    Scroll Element Into View    ${cancel_btn_loc}
    Wait Until Element Is Visible    ${cancel_btn_loc}
    Click Element    ${cancel_btn_loc}
    Element Should Be Visible    ${create_batch_btn_loc}

add_postfix_batch_id
    Scroll Element Into View    ${input_batch_id}
    ${abc}    Get Text    ${input_batch_id}
    Click Element    ${input_batch_id}
    Input Text    ${input_batch_id}    -auto-test
    ${batch_id}    Get Value    ${input_batch_id}
    [Return]    ${batch_id}
    
validate_batch_id
    [Arguments]    ${batch_id}
    Wait Until Page Contains    ${batch_id}    60

select_batch_type_spark
    Scroll Element Into View    ${select_batch_type_dropdown}
    Click Element    ${select_batch_type_dropdown}
    Wait Until Element Is Visible    ${select_spark_batch_type}
    Click Element    ${select_spark_batch_type}

select_main_class_radio_btn
    Scroll Element Into View    ${main_class_radio_btn}
    Click Element    ${main_class_radio_btn}

select_main_jar_file_radio_btn
    Scroll Element Into View    ${main_jar_uri_radio_btn}
    Click Element    ${main_jar_uri_radio_btn}

input_main_jar_file
    Scroll Element Into View    ${input_main_jar_file}
    Click Element    ${input_main_jar_file}
    Input Text    ${input_main_jar_file}    ${jar1_gcs_link}

input_service_account
    Scroll Element Into View    ${input_service_account}
    Click Element    ${input_service_account}
    Input Text    ${input_service_account}    ${service_account_txt}

select_google_managed_encryption
    Scroll Element Into View    ${select_radio_google_managed}
    Click Element    ${select_radio_google_managed}

select_cmek_keys_dropdown
    Scroll Element Into View    ${select_radio_customer_managed}
    Click Element    ${select_radio_customer_managed}
    Scroll Element Into View    ${click_dropdown_key_rings}
    Click Element    ${click_dropdown_key_rings}
    Wait Until Element Is Visible    ${select_dropdown_first_element_keys}
    Click Element    ${select_dropdown_first_element_keys}
    Sleep    3

select_cmek_keys_manually
    Scroll Element Into View    ${select_radio_customer_managed}
    Click Element    ${select_radio_customer_managed}
    Scroll Element Into View    ${select_radio_enter_manually}
    Click Element    ${select_radio_enter_manually}
    Click Element    ${input_manual_keys}
    Input Text    ${input_manual_keys}    ${encryption_key_txt}


input_main_class
    Scroll Element Into View    ${input_main_class}
    Click Element    ${input_main_class}
    Input Text    ${input_main_class}    com.example


select_batch_type_sparkr
    Scroll Element Into View    ${select_batch_type_dropdown}
    Click Element    ${select_batch_type_dropdown}
    Wait Until Element Is Visible    ${select_sparkr_batch_type}
    Click Element    ${select_sparkr_batch_type}

input_main_sparkr_file
    Scroll Element Into View    ${input_sparkr_file}
    Click Element    ${input_sparkr_file}
    Input Text    ${input_sparkr_file}    ${sparkr_gcs_link}

select_batch_type_sparksql
    Scroll Element Into View    ${select_batch_type_dropdown}
    Click Element    ${select_batch_type_dropdown}
    Wait Until Element Is Visible    ${select_sparksql_batch_type}
    Click Element    ${select_sparksql_batch_type}

input_main_sparksql_file
    Scroll Element Into View    ${input_sparksql_file}
    Click Element    ${input_sparksql_file}
    Input Text    ${input_sparksql_file}    ${sparksql_gcs_link}

select_batch_type_pyspark
    Scroll Element Into View    ${select_batch_type_dropdown}
    Click Element    ${select_batch_type_dropdown}
    Wait Until Element Is Visible    ${select_pyspark_batch_type}
    Click Element    ${select_pyspark_batch_type}

input_main_pyspark_file
    Scroll Element Into View    ${input_pyspark_file}
    Click Element    ${input_pyspark_file}
    Input Text    ${input_pyspark_file}    ${pyspark_gcs_link1}

#batches listing
check_batch_id_and_status
    [Documentation]    get the name and status from listing and verify it on details page.
    Wait Until Element Is Visible    ${batch_id_first_element}    30
    ${name_list_count}    Get Element Count    ${batch_id_list}
    ${random_number_from_count}    get_random_number_from_range    ${name_list_count}     
    Scroll Element Into View    (//td[@role='cell' and @class='cluster-name'])[${random_number_from_count}]
    ${list_name}    Get Text    (//td[@role='cell' and @class='cluster-name'])[${random_number_from_count}]
    ${list_status}    Get Text    (//div[@class='cluster-status'])[${random_number_from_count}]
    Click Element    (//td[@role='cell' and @class='cluster-name'])[${random_number_from_count}]
    Wait Until Element Is Visible    ${batch_details_name}    20
    ${details_name}    Get Text    ${batch_details_name}
    ${details_status}    Get Text    ${batch_details_status}
    Should Be Equal As Strings    ${list_name}    ${details_name}
    Should Be Equal As Strings    ${list_status}    ${details_status}
    ${random_number_from_count}    Set Variable    0

back_nav_batch_details
    [Documentation]    go to job details and check the back nav functionality.
    Wait Until Element Is Visible    ${batch_id_first_element}    30
    ${name_list_count}    Get Element Count    ${batch_id_list}
    ${random_number_from_count}    get_random_number_from_range    ${name_list_count}     
    Scroll Element Into View    (//td[@role='cell' and @class='cluster-name'])[${random_number_from_count}]
    Click Element    (//td[@role='cell' and @class='cluster-name'])[${random_number_from_count}]
    Wait Until Element Is Visible    ${back_nav_btn}
    Scroll Element Into View    ${back_nav_btn}
    Click Element    ${back_nav_btn}
    Wait Until Element Is Visible    ${batch_id_list}

batch_delete_listing
    [Documentation]    delete the job from listing page and confirm deletion.
    Wait Until Element Is Visible    ${batch_id_first_element}    30
    ${name_list_count}    Get Element Count    ${batch_id_list}
    ${random_number_from_count}    get_random_number_from_range    ${name_list_count}
    Scroll Element Into View    (//td[@role='cell' and @class='cluster-name'])[${random_number_from_count}]
    ${delete_batch_id}    Get Text    (//td[@role='cell' and @class='cluster-name'])[${random_number_from_count}]
    Click Element    (//div[@title='Delete Batch'])[${random_number_from_count}]
    Wait Until Element Is Visible    ${confirm_deletion_dialog}
    Wait Until Element Is Visible    ${confirm_deletion_cancel_btn}
    Wait Until Element Is Visible    ${confirm_deletion_delete_btn}
    Element Should Contain    ${confirm_deletion_text}    ${delete_batch_id}
    Click Element    ${confirm_deletion_cancel_btn}
    Wait Until Element Is Visible    (//td[@role='cell' and @class='cluster-name'])[${random_number_from_count}]
    Scroll Element Into View    (//td[@role='cell' and @class='cluster-name'])[${random_number_from_count}]
    Click Element    (//div[@title='Delete Batch'])[${random_number_from_count}]
    Click Element    ${confirm_deletion_delete_btn}
    Wait Until Element Is Visible    ${toastify_success_message}    30
    Element Should Contain    ${toastify_success_message}    ${delete_batch_id}

batch_details_clone
    [Documentation]    clone the job from job details page with as is entered details.
    Wait Until Element Is Visible    ${batch_id_first_element}    30
    ${name_list_count}    Get Element Count    ${batch_id_list}
    ${random_number_from_count}    get_random_number_from_range    ${name_list_count}
    Scroll Element Into View    (//td[@role='cell' and @class='cluster-name'])[${random_number_from_count}]
    Click Element    (//td[@role='cell' and @class='cluster-name'])[${random_number_from_count}]
    Wait Until Element Is Visible    ${batch_details_clone_btn}    30
    Click Element    ${batch_details_clone_btn}
    ${new_batch_id}    Get Text    ${input_batch_id}
    Wait Until Element Is Visible    ${batch_clone_submit_btn}
    Scroll Element Into View    ${batch_clone_submit_btn}
    Click Element    ${submit_btn_loc}
    Wait Until Element Is Visible    ${toastify_submit_success_message}    20
    Element Should Contain    ${toastify_submit_success_message}    ${new_batch_id}

batch_details_delete
    [Documentation]    delete the job going inside the details page.
    Wait Until Element Is Visible    ${batch_id_first_element}    30
    ${name_list_count}    Get Element Count    ${batch_id_list}
    ${random_number_from_count}    get_random_number_from_range    ${name_list_count}
    Scroll Element Into View    (//td[@role='cell' and @class='cluster-name'])[${random_number_from_count}]
    Click Element    (//td[@role='cell' and @class='cluster-name'])[${random_number_from_count}]
    Wait Until Element Is Visible    ${batch_details_view_spark_logs}    30
    Wait Until Element Is Visible    ${batch_details_view_cloud_logs}    30
    Wait Until Element Is Visible    ${batch_details_delete_btn}    ${wait_min}
    ${batch_id}    Get Text    ${batch_details_name}
    Click Element    ${batch_details_delete_btn}
    Wait Until Element Is Visible    ${confirm_deletion_dialog}
    Wait Until Element Is Visible    ${confirm_deletion_cancel_btn}
    Wait Until Element Is Visible    ${confirm_deletion_delete_btn}
    Element Should Contain    ${confirm_deletion_text}    ${batch_id}
    Click Element    ${confirm_deletion_cancel_btn}
    Wait Until Element Is Visible    ${batch_details_delete_btn}
    Click Element    ${batch_details_delete_btn}
    Wait Until Element Is Visible    ${confirm_deletion_dialog}
    Wait Until Element Is Visible    ${confirm_deletion_cancel_btn}
    Wait Until Element Is Visible    ${confirm_deletion_delete_btn}
    Element Should Contain    ${confirm_deletion_text}    ${batch_id}
    Click Element    ${confirm_deletion_delete_btn}
    Wait Until Element Is Visible    ${toastify_success_message}    30
    Element Should Contain    ${toastify_success_message}    ${batch_id}

check_static_elements_batch_listing
    [Documentation]    Check the static elements on the batch listing page.
    Wait Until Page Contains    Batch ID    ${wait_20}
    Page Should Contain    Batch ID
    Page Should Contain    Status
    Page Should Contain    Location
    Page Should Contain    Creation time
    Page Should Contain    Elapsed time
    Page Should Contain    Type
    Page Should Contain    Actions

check_static_elements_batch_details
    [Documentation]    Check the static elements on the batch details page.
    Wait Until Element Is Visible    ${batch_details_clone_btn}    ${wait_20}
    Page Should Contain Element    ${batch_details_clone_btn}
    Page Should Contain Element    ${job_details_delete_btn}
    Page Should Contain Element    ${batch_details_view_cloud_logs}
    Page Should Contain Element    ${batch_details_view_spark_logs}
    Page Should Contain    Batch ID
    Page Should Contain    Batch UUID
    Page Should Contain    Resource type
    Page Should Contain    Status
    Page Should Contain    Details
    Page Should Contain    Start time
    Page Should Contain    Elapsed time
    Page Should Contain    Run time
    Page Should Contain    Creator
    Page Should Contain    Version
    Page Should Contain    Region
    Page Should Contain    Batch type
    Page Should Contain    Properties
    Page Should Contain    Labels
    
open_batch_details_page
    [Documentation]    click on the random batch id and go to batch details.
    Wait Until Element Is Visible    ${batch_id_first_element}    30
    ${name_list_count}    Get Element Count    ${batch_id_list}
    ${random_number_from_count}    get_random_number_from_range    ${name_list_count}     
    Scroll Element Into View    (//td[@role='cell' and @class='cluster-name'])[${random_number_from_count}]
    Click Element    (//td[@role='cell' and @class='cluster-name'])[${random_number_from_count}]

check_descending_order_of_datetime
    [Documentation]    get first and last datetime and check if that is arranged in descending order.
    Wait Until Page Contains Element    xpath://tr[1]/td[contains(text()," at ")]    ${wait_20}
    ${temp1}    Get Text    xpath://tr[1]/td[contains(text()," at ")]
    ${temp2}    Get Text    xpath://tr[50]/td[contains(text()," at ")]
    ${sub}    check_date_time_descending_order    ${temp1}    ${temp2}
    IF    $sub==True
        Pass Execution    date and time is sorted in descending order.
    END