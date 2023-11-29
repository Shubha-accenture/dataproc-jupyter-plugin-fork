*** Settings ***
Library    Selenium2Library
Library    Collections
Library    String
Library    XML
Variables    ../constants/constant.py
Variables    ../locators/batches.py
Variables    ../locators/login.py
Variables    ../locators/launcher.py
Variables    ../locators/config_setup.py
Variables    ../locators/config_setup.py
Variables    ../locators/jobs.py
Variables    ../locators/clusters.py
Resource    ../resources/config_setup.robot
Resource    ../resources/clusters.robot
Resource    ../resources/runtimetemplate.robot
Resource    ../resources/batches.robot
Library    ../resources/python_keywords.py

*** Keywords ***
open_the_submit_job_page
    Scroll Element Into View    ${clusters_card_launcher_loc}
    Click Element    ${clusters_card_launcher_loc}
    Wait Until Element Is Visible    ${jobs_top_tabpanel_loc}    30
    Click Element    ${jobs_top_tabpanel_loc}

click_on_submit_job_btn
    Wait Until Element Is Visible    ${submit_job_btn_loc}
    Click Element    ${submit_job_btn_loc}

click_on_back_navigation_btn
    Scroll Element Into View    ${back_navigation_btn_loc}
    Wait Until Element Is Visible    ${back_navigation_btn_loc}    
    Click Element    ${back_navigation_btn_loc}
    Element Should Be Visible    ${submit_job_btn_loc}

click_on_cancel_btn
    Scroll Element Into View    ${cancel_btn_loc}
    Wait Until Element Is Visible    ${cancel_btn_loc}
    Click Element    ${cancel_btn_loc}
    Element Should Be Visible    ${submit_job_btn_loc}

select_cluster_from_dropdown
    Wait Until Element Is Visible    ${cluster_dropdown_click_loc}
    Click Element    ${cluster_dropdown_click_loc}
    Wait Until Element Is Visible    ${clusters_dropdown_first_element}
    ${temp_var_1}    Get Text    ${clusters_dropdown_first_element}
    Click Element    ${clusters_dropdown_first_element}
    Wait Until Element Is Visible    ${cluster_dropdown_click_loc}
    ${temp_var_2}    Get Value    ${cluster_dropdown_click_loc}
    Should Be Equal As Strings    ${temp_var_1}    ${temp_var_2}
    ${temp_var_1}    Set Variable    0
    ${temp_var_2}    Set Variable    0

select_job_type_spark_from_dropdown
    Wait Until Element Is Visible    ${job_type_dropdown_click_loc}
    Click Element    ${job_type_dropdown_click_loc}
    Wait Until Element Is Visible    ${job_type_dropdown_spark_element}
    ${temp_var_1}    Get Text    ${job_type_dropdown_spark_element}
    Click Element    ${job_type_dropdown_spark_element}
    Wait Until Element Is Visible    ${job_type_dropdown_click_loc}
    ${temp_var_2}    Get Text    ${job_type_dropdown_click_loc}
    Should Be Equal As Strings    ${temp_var_1}    ${temp_var_2}
    ${temp_var_1}    Set Variable    0
    ${temp_var_2}    Set Variable    0

select_job_type_sparkr_from_dropdown
    Wait Until Element Is Visible    ${job_type_dropdown_click_loc}
    Click Element    ${job_type_dropdown_click_loc}
    Wait Until Element Is Visible    ${job_type_dropdown_sparkr_element}
    ${temp_var_1}    Get Text    ${job_type_dropdown_sparkr_element}
    Click Element    ${job_type_dropdown_sparkr_element}
    Wait Until Element Is Visible    ${job_type_dropdown_click_loc}
    ${temp_var_2}    Get Text    ${job_type_dropdown_click_loc}
    Should Be Equal As Strings    ${temp_var_1}    ${temp_var_2}
    ${temp_var_1}    Set Variable    0
    ${temp_var_2}    Set Variable    0

select_job_type_sparksql_from_dropdown
    Wait Until Element Is Visible    ${job_type_dropdown_click_loc}
    Click Element    ${job_type_dropdown_click_loc}
    Wait Until Element Is Visible    ${job_type_dropdown_sparksql_element}
    ${temp_var_1}    Get Text    ${job_type_dropdown_sparksql_element}
    Click Element    ${job_type_dropdown_sparksql_element}
    Wait Until Element Is Visible    ${job_type_dropdown_click_loc}
    ${temp_var_2}    Get Text    ${job_type_dropdown_click_loc}
    Should Be Equal As Strings    ${temp_var_1}    ${temp_var_2}
    ${temp_var_1}    Set Variable    0
    ${temp_var_2}    Set Variable    0

select_job_type_pyspark_from_dropdown
    Wait Until Element Is Visible    ${job_type_dropdown_click_loc}
    Click Element    ${job_type_dropdown_click_loc}
    Wait Until Element Is Visible    ${job_type_dropdown_pyspark_element}
    ${temp_var_1}    Get Text    ${job_type_dropdown_pyspark_element}
    Click Element    ${job_type_dropdown_pyspark_element}
    Wait Until Element Is Visible    ${job_type_dropdown_click_loc}
    ${temp_var_2}    Get Text    ${job_type_dropdown_click_loc}
    Should Be Equal As Strings    ${temp_var_1}    ${temp_var_2}
    ${temp_var_1}    Set Variable    0
    ${temp_var_2}    Set Variable    0

input_spark_with_jar_file
    Scroll Element Into View    ${input_main_or_jar_file_loc}
    Wait Until Element Is Visible    ${input_main_or_jar_file_loc}
    Click Element    ${input_main_or_jar_file_loc}
    Input Text    ${input_main_or_jar_file_loc}    ${jar1_gcs_link}

input_spark_with_class
    Scroll Element Into View    ${input_main_or_jar_file_loc}
    Wait Until Element Is Visible    ${input_main_or_jar_file_loc}
    Click Element    ${input_main_or_jar_file_loc}
    Input Text    ${input_main_or_jar_file_loc}    com.example

input_sparkr_file
    Scroll Element Into View    ${input_sparkr_file_loc}
    Wait Until Element Is Visible    ${input_sparkr_file_loc}
    Click Element    ${input_sparkr_file_loc}
    Input Text    ${input_sparkr_file_loc}    ${sparkr_gcs_link}
    
input_pyspark_file
    Scroll Element Into View    ${input_main_python_file}
    Wait Until Element Is Visible    ${input_main_python_file}
    Click Element    ${input_main_python_file}
    Input Text    ${input_main_python_file}    ${pyspark_gcs_link1}

input_additional_python_file
    Scroll Element Into View    ${input_additional_python_file}
    Wait Until Element Is Visible    ${input_additional_python_file}
    Click Element    ${input_additional_python_file}
    Input Text    ${input_additional_python_file}    ${pyspark_gcs_link1}
    Press Keys    ${input_additional_python_file}    ENTER
    Scroll Element Into View    ${input_additional_python_file}
    Input Text    ${input_additional_python_file}    ${pyspark_gcs_link2}
    Press Keys    ${input_additional_python_file}    ENTER


input_jar_file
    Scroll Element Into View    ${input_jar_file_loc}
    Wait Until Element Is Visible    ${input_jar_file_loc}
    Click Element    ${input_jar_file_loc}
    Input Text    ${input_jar_file_loc}    ${jar1_gcs_link}
    Press Keys    ${input_jar_file_loc}    ENTER
    Scroll Element Into View    ${input_jar_file_loc}
    Input Text    ${input_jar_file_loc}    ${jar2_gcs_link}
    Press Keys    ${input_jar_file_loc}    ENTER

input_files_file
    Scroll Element Into View    ${input_files_file_loc}
    Wait Until Element Is Visible    ${input_files_file_loc}
    Click Element    ${input_files_file_loc}
    Input Text    ${input_files_file_loc}    ${jar1_gcs_link}
    Press Keys    ${input_files_file_loc}    ENTER
    Scroll Element Into View    ${input_files_file_loc}
    Input Text    ${input_files_file_loc}    ${jar2_gcs_link}
    Press Keys    ${input_files_file_loc}    ENTER
    
input_archive_file
    Scroll Element Into View    ${input_archive_file_loc}
    Wait Until Element Is Visible    ${input_archive_file_loc}
    Click Element    ${input_archive_file_loc}
    Input Text    ${input_archive_file_loc}    ${jar1_gcs_link}
    Press Keys    ${input_archive_file_loc}    ENTER
    Scroll Element Into View    ${input_archive_file_loc}
    Input Text    ${input_archive_file_loc}    ${jar2_gcs_link}
    Press Keys    ${input_archive_file_loc}    ENTER

input_arguments_file
    Scroll Element Into View    ${input_arguments_file_loc}
    Wait Until Element Is Visible    ${input_arguments_file_loc}
    Click Element    ${input_arguments_file_loc}
    Input Text    ${input_arguments_file_loc}    press
    Press Keys    ${input_arguments_file_loc}    ENTER
    Scroll Element Into View    ${input_arguments_file_loc}
    Input Text    ${input_arguments_file_loc}    return
    Press Keys    ${input_arguments_file_loc}    ENTER

input_max_restarts_per_hour
    Scroll Element Into View    ${input_max_restarts_per_hour}
    Click Element    ${input_max_restarts_per_hour}
    Input Text    ${input_max_restarts_per_hour}    4

input_add_property
    #adding first key value pair
    Scroll Element Into View    ${add_property_btn_loc}
    Click Element    ${add_property_btn_loc}
    Wait Until Element Is Visible    ${add_property_key1_loc}
    Input Text    ${add_property_key1_loc}    property_key1
    Wait Until Element Is Visible    ${add_property_value1_loc}
    Click Button    ${add_property_value1_loc}
    Input Text    ${add_property_value1_loc}    property_value1
    #adding second key value pair
    Scroll Element Into View    ${add_property_btn_loc}
    Click Element    ${add_property_btn_loc}
    Wait Until Element Is Visible    ${add_property_key2_loc}
    Input Text    ${add_property_key2_loc}    property_key2
    Wait Until Element Is Visible    ${add_property_value2_loc}
    Click Button    ${add_property_value2_loc}
    Input Text    ${add_property_value2_loc}    property_value2

input_add_label
    #adding first key value pair
    Scroll Element Into View    ${add_label_btn_loc}
    Click Element    ${add_label_btn_loc}
    Wait Until Element Is Visible    ${add_label_key1_loc}
    Click Element    ${add_label_key1_loc}
    Input Text    ${add_label_key1_loc}    label_key2
    Click Element    ${add_property_value2_loc}
    Wait Until Element Is Visible    ${add_label_value1_loc}
    Click Element    ${add_label_value1_loc}
    Input Text    ${add_label_value1_loc}    label_value2
    #adding second key value pair
    Scroll Element Into View    ${add_label_btn_loc}
    Click Element    ${add_label_btn_loc}
    Wait Until Element Is Visible    ${add_label_key2_loc}
    Click Element    ${add_label_key2_loc}
    Input Text    ${add_label_key2_loc}    label_key3
    Click Element    ${add_property_value2_loc}
    Wait Until Element Is Visible    ${add_label_value2_loc}
    Click Element    ${add_label_value2_loc}
    Input Text    ${add_label_value2_loc}    label_value3

select_query_source_type_query_file
    Wait Until Element Is Visible    ${select_query_source_type}
    Click Element    ${select_query_source_type}
    Wait Until Element Is Visible    ${select_query_file}
    Click Element    ${select_query_file}

select_query_source_type_query_text
    Wait Until Element Is Visible    ${select_query_source_type}
    Click Element    ${select_query_source_type}
    Wait Until Element Is Visible    ${select_query_text}
    Click Element    ${select_query_text}

input_query_file
    Wait Until Element Is Visible    ${input_query_file}
    Click Element    ${input_query_file}
    Input Text    ${input_query_file}    ${sparksql_gcs_link}

input_query_text
    Wait Until Element Is Visible    ${input_query_text}
    Click Element    ${input_query_text}
    Input Text    ${input_query_text}    ${query_txt}

add_query_parameters
    #adding first key value pair
    Scroll Element Into View    ${add_parameter_btn_loc}
    Click Element    ${add_parameter_btn_loc}
    Wait Until Element Is Visible    ${add_parameter_key1_loc}
    Click Element    ${add_parameter_key1_loc}
    Input Text    ${add_parameter_key1_loc}    query_key1
    Click Element    ${add_parameter_value1_loc}
    Wait Until Element Is Visible    ${add_parameter_value1_loc}
    Click Element    ${add_parameter_value1_loc}
    Input Text    ${add_parameter_value1_loc}    query_value1

click_submit_btn
    ${temp1}    Run Keyword And Return Status    Element Should Be Visible    ${submit_btn_enabled_loc}
    IF    $temp1==True
        #Wait Until Element Is Visible    ${submit_btn_enabled_loc}    ${wait_20}
        Scroll Element Into View    ${submit_btn_enabled_loc}
        # Wait Until Element Is Enabled    ${submit_btn_loc}    ${wait_max}
        Click Element    ${submit_btn_enabled_loc}
    END

get_job_id
    Scroll Element Into View    ${input_job_id}
    Click Element    ${input_job_id}
    Input Text    ${input_job_id}    -auto-test
    ${job_id}    Get Value    ${input_job_id}
    [Return]    ${job_id}

validate_job_id
    [Arguments]    ${job_id}
    Wait Until Page Contains    ${job_id}    60

#jobs listing page
open_jobs_listing_page
    [Documentation]    launcher page to clusters listing page.
    Scroll Element Into View    ${clusters_card_launcher_loc}
    Click Element    ${clusters_card_launcher_loc}
    Wait Until Element Is Visible    ${jobs_top_tabpanel_loc}
    Click Element    ${jobs_top_tabpanel_loc}

check_job_id_and_status
    [Documentation]    get the name and status from listing and verify it on details page.
    Wait Until Element Is Visible    ${jobs_id_first_element}    30
    ${name_list_count}    Get Element Count    ${jobs_id_list}
    ${random_number_from_count}    get_random_number_from_range    ${name_list_count}     
    Scroll Element Into View    (//td[@role='cell' and @class='cluster-name'])[${random_number_from_count}]
    ${list_name}    Get Text    (//td[@role='cell' and @class='cluster-name'])[${random_number_from_count}]
    ${list_status}    Get Text    (//div[@class='cluster-status'])[${random_number_from_count}]
    Click Element    (//td[@role='cell' and @class='cluster-name'])[${random_number_from_count}]
    Wait Until Element Is Visible    ${job_details_name}    20
    ${details_name}    Get Text    ${job_details_name}
    ${details_status}    Get Text    ${job_details_status}
    Should Be Equal As Strings    ${list_name}    ${details_name}
    Should Be Equal As Strings    ${list_status}    ${details_status}
    ${random_number_from_count}    Set Variable    0

back_nav_job_details
    [Documentation]    go to job details and check the back nav functionality.
    Wait Until Element Is Visible    ${jobs_id_first_element}    60
    ${name_list_count}    Get Element Count    ${jobs_id_list}
    ${random_number_from_count}    get_random_number_from_range    ${name_list_count}     
    Scroll Element Into View    (//td[@role='cell' and @class='cluster-name'])[${random_number_from_count}]
    Click Element    (//td[@role='cell' and @class='cluster-name'])[${random_number_from_count}]
    Wait Until Element Is Visible    ${back_nav_btn}
    Scroll Element Into View    ${back_nav_btn}
    Click Element    ${back_nav_btn}
    Wait Until Element Is Visible    ${jobs_id_list}

job_delete_listing
    [Documentation]    delete the job from listing page and confirm deletion.
    Wait Until Element Is Visible    ${jobs_id_first_element}    30
    ${name_list_count}    Get Element Count    ${jobs_id_list}
    ${random_number_from_count}    get_random_number_from_range    ${name_list_count}
    Scroll Element Into View    (//td[@role='cell' and @class='cluster-name'])[${random_number_from_count}]
    ${delete_job_id}    Get Text    (//td[@role='cell' and @class='cluster-name'])[${random_number_from_count}]
    Click Element    (//div[@role='button' and @title='Delete Job'])[${random_number_from_count}]
    Wait Until Element Is Visible    ${confirm_deletion_dialog}
    Wait Until Element Is Visible    ${confirm_deletion_cancel_btn}
    Wait Until Element Is Visible    ${confirm_deletion_delete_btn}
    Element Should Contain    ${confirm_deletion_text}    ${delete_job_id}
    Click Element    ${confirm_deletion_cancel_btn}
    Wait Until Element Is Visible    (//td[@role='cell' and @class='cluster-name'])[${random_number_from_count}]
    Scroll Element Into View    (//td[@role='cell' and @class='cluster-name'])[${random_number_from_count}]
    Click Element    (//div[@role='button' and @title='Delete Job'])[${random_number_from_count}]
    Click Element    ${confirm_deletion_delete_btn}
    Wait Until Element Is Visible    ${toastify_success_message}    30
    Element Should Contain    ${toastify_success_message}    ${delete_job_id}

job_clone_listing
    [Documentation]    clone the job from listing page with as is entered details.
    Wait Until Element Is Visible    ${jobs_id_first_element}    60
    ${name_list_count}    Get Element Count    ${jobs_id_list}
    ${random_number_from_count}    get_random_number_from_range    ${name_list_count}
    Scroll Element Into View    (//td[@role='cell' and @class='cluster-name'])[${random_number_from_count}]
    Click Element    (//div[@role='button' and @title='Clone Job'])[${random_number_from_count}]
    ${new_job_id}    Get Text    ${job_id_loc}
    Wait Until Element Is Visible    ${job_clone_submit_btn}
    Scroll Element Into View    ${job_clone_submit_btn}
    Click Element    ${job_clone_submit_btn}
    Wait Until Element Is Visible    ${toastify_submit_success_message}    20
    Element Should Contain    ${toastify_submit_success_message}    ${new_job_id}

job_details_clone
    [Documentation]    clone the job from job details page with as is entered details.
    Wait Until Element Is Visible    ${jobs_id_first_element}    30
    ${name_list_count}    Get Element Count    ${jobs_id_list}
    ${random_number_from_count}    get_random_number_from_range    ${name_list_count}
    Scroll Element Into View    (//td[@role='cell' and @class='cluster-name'])[${random_number_from_count}]
    Click Element    (//td[@role='cell' and @class='cluster-name'])[${random_number_from_count}]
    Wait Until Element Is Visible    ${job_details_clone_btn}    30
    Click Element    ${job_details_clone_btn}
    ${new_job_id}    Get Text    ${job_id_loc}
    Wait Until Element Is Visible    ${job_clone_submit_btn}
    Scroll Element Into View    ${job_clone_submit_btn}
    Click Element    ${job_clone_submit_btn}
    Wait Until Element Is Visible    ${toastify_submit_success_message}    20
    Element Should Contain    ${toastify_submit_success_message}    ${new_job_id}

job_details_delete
    [Documentation]    delete the job going inside the details page.
    Wait Until Element Is Visible    ${jobs_id_first_element}    30
    ${name_list_count}    Get Element Count    ${jobs_id_list}
    ${random_number_from_count}    get_random_number_from_range    ${name_list_count}
    Scroll Element Into View    (//td[@role='cell' and @class='cluster-name'])[${random_number_from_count}]
    Click Element    (//td[@role='cell' and @class='cluster-name'])[${random_number_from_count}]
    Wait Until Element Is Visible    ${job_details_view_spark_logs}    30
    Wait Until Element Is Visible    ${job_details_delete_btn}    ${wait_min}
    ${job_id}    Get Text    ${job_details_name}
    Click Element    ${job_details_delete_btn}
    Wait Until Element Is Visible    ${confirm_deletion_dialog}
    Wait Until Element Is Visible    ${confirm_deletion_cancel_btn}
    Wait Until Element Is Visible    ${confirm_deletion_delete_btn}
    Element Should Contain    ${confirm_deletion_text}    ${job_id}
    Click Element    ${confirm_deletion_cancel_btn}
    Wait Until Element Is Visible    ${job_details_delete_btn}
    Click Element    ${job_details_delete_btn}
    Wait Until Element Is Visible    ${confirm_deletion_dialog}
    Wait Until Element Is Visible    ${confirm_deletion_cancel_btn}
    Wait Until Element Is Visible    ${confirm_deletion_delete_btn}
    Element Should Contain    ${confirm_deletion_text}    ${job_id}
    Click Element    ${confirm_deletion_delete_btn}
    Wait Until Element Is Visible    ${toastify_success_message}    30
    Element Should Contain    ${toastify_success_message}    ${job_id}

job_details_edit_labels
    [Documentation]    delete the exisitng labels and then call add labels keyword.
    Wait Until Element Is Visible    ${jobs_id_first_element}    60
    ${name_list_count}    Get Element Count    ${jobs_id_list}
    ${random_number_from_count}    get_random_number_from_range    ${name_list_count}
    Scroll Element Into View    (//td[@role='cell' and @class='cluster-name'])[${random_number_from_count}]
    Click Element    (//td[@role='cell' and @class='cluster-name'])[${random_number_from_count}]
    Wait Until Element Is Visible    ${job_details_name}    30
    ${job_id}    Get Text    ${job_details_name}
    Wait Until Element Is Visible    ${job_details_edit_btn}    30
    Scroll Element Into View    ${job_details_edit_btn}
    Click Element    ${job_details_edit_btn}
    Wait Until Element Is Visible    ${job_details_labels_delete_icon}    10
    Scroll Element Into View    ${job_details_labels_delete_icon}
    Click Element    ${job_details_labels_delete_icon}
    Wait Until Element Is Visible    ${job_details_labels_delete_icon}
    Click Element    ${job_details_labels_delete_icon}
    add_label
    Scroll Element Into View    ${cancel_btn}
    Click Element    ${cancel_btn}
    Scroll Element Into View    ${job_details_edit_btn}
    Wait Until Element Is Visible    ${job_details_edit_btn}    30
    Click Element    ${job_details_edit_btn}
    Wait Until Element Is Visible    ${job_details_labels_delete_icon}    10
    Scroll Element Into View    ${job_details_labels_delete_icon}
    Click Element    ${job_details_labels_delete_icon}
    Wait Until Element Is Visible    ${job_details_labels_delete_icon}
    Click Element    ${job_details_labels_delete_icon}
    add_label
    Click Element    ${save_btn}
    Wait Until Element Is Visible    ${toastify_update_success_message}    30
    Element Should Contain    ${toastify_update_success_message}    ${job_id}

check_static_elements_jobs_listing
    [Documentation]    Check the static elements on the jobs listing page.
    Wait Until Page Contains    Job ID    ${wait_20}
    Page Should Contain    Job ID
    Page Should Contain    Status
    Page Should Contain    Region
    Page Should Contain    Type
    Page Should Contain    Start time
    Page Should Contain    Elapsed time	
    Page Should Contain    Labels
    Page Should Contain    Actions

check_static_elements_job_details
    [Documentation]    Check the static elements on the batch details page.
    Wait Until Element Is Visible    ${job_details_edit_btn}    ${wait_20}
    Page Should Contain Element    ${batch_details_clone_btn}
    Page Should Contain    CLONE
    Page Should Contain    STOP
    Page Should Contain    DELETE
    Page Should Contain Element    ${batch_details_view_spark_logs}
    Page Should Contain    Job ID
    Page Should Contain    Job UUID
    Page Should Contain    Type
    Page Should Contain    Status
    Page Should Contain    Configuration
    Page Should Contain    Start time:
    Page Should Contain    Elapsed time:
    Page Should Contain    Status:
    Page Should Contain    Region
    Page Should Contain    Cluster
    Page Should Contain    Region
    Page Should Contain    Job type
    Page Should Contain    Properties
    Page Should Contain    Labels

open_job_details_page
    [Documentation]    click on the random batch id and go to batch details.
    Wait Until Element Is Visible    ${batch_id_first_element}    30
    ${name_list_count}    Get Element Count    ${batch_id_list}
    ${random_number_from_count}    get_random_number_from_range    ${name_list_count}     
    Scroll Element Into View    (//td[@role='cell' and @class='cluster-name'])[${random_number_from_count}]
    Click Element    (//td[@role='cell' and @class='cluster-name'])[${random_number_from_count}]