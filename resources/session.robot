*** Settings ***
Library    Selenium2Library
Library    RequestsLibrary
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
Variables    ../locators/sessions.py
Variables    ../locators/clusters.py
Resource    ../resources/config_setup.robot
Resource    ../resources/runtimetemplate.robot
Resource    ../resources/batches.robot
Library    ../resources/python_keywords.py

*** Keywords ***
open_sessions_listing_page
    [Documentation]    open the sessions listing page.
    Scroll Element Into View    ${serverless_card_launcher_loc}
    Click Element    ${serverless_card_launcher_loc}
    Wait Until Element Is Visible    ${session_top_tabpanel_loc}    20
    Click Element    ${session_top_tabpanel_loc}

check_session_id_and_status
    [Documentation]    get the name and status from listing and verify it on details page.
    Wait Until Element Is Visible    ${session_id_first_element}    30
    ${name_list_count}    Get Element Count    ${session_id_list}
    ${random_number_from_count}    get_random_number_from_range    ${name_list_count}     
    Scroll Element Into View    (//td[@role='cell' and @class='cluster-name'])[${random_number_from_count}]
    ${list_name}    Get Text    (//td[@role='cell' and @class='cluster-name'])[${random_number_from_count}]
    ${list_status}    Get Text    (//div[@class='cluster-status'])[${random_number_from_count}]
    Click Element    (//td[@role='cell' and @class='cluster-name'])[${random_number_from_count}]
    Wait Until Element Is Visible    ${session_details_name}    20
    ${details_name}    Get Text    ${session_details_name}
    ${details_status}    Get Text    ${session_details_status}
    Should Be Equal As Strings    ${list_name}    ${details_name}
    Should Be Equal As Strings    ${list_status}    ${details_status}
    ${random_number_from_count}    Set Variable    0

back_nav_session_details
    [Documentation]    go to job details and check the back nav functionality.
    Wait Until Element Is Visible    ${session_id_first_element}    30
    ${name_list_count}    Get Element Count    ${session_id_list}
    ${random_number_from_count}    get_random_number_from_range    ${name_list_count}     
    Scroll Element Into View    (//td[@role='cell' and @class='cluster-name'])[${random_number_from_count}]
    Click Element    (//td[@role='cell' and @class='cluster-name'])[${random_number_from_count}]
    Wait Until Element Is Visible    ${back_nav_btn}
    Scroll Element Into View    ${back_nav_btn}
    Click Element    ${back_nav_btn}
    Wait Until Element Is Visible    ${session_id_list}

session_delete_listing
    [Documentation]    delete the job from listing page and confirm deletion.
    Wait Until Element Is Visible    ${session_id_first_element}    30
    ${name_list_count}    Get Element Count    ${session_id_list}
    ${random_number_from_count}    get_random_number_from_range    ${name_list_count}
    Scroll Element Into View    (//td[@role='cell' and @class='cluster-name'])[${random_number_from_count}]
    ${delete_session_id}    Get Text    (//td[@role='cell' and @class='cluster-name'])[${random_number_from_count}]
    Click Element    (//div[@title='Delete Session'])[${random_number_from_count}]
    Wait Until Element Is Visible    ${confirm_deletion_dialog}
    Wait Until Element Is Visible    ${confirm_deletion_cancel_btn}
    Wait Until Element Is Visible    ${confirm_deletion_delete_btn}
    Element Should Contain    ${confirm_deletion_text}    ${delete_session_id}
    Click Element    ${confirm_deletion_cancel_btn}
    Wait Until Element Is Visible    (//td[@role='cell' and @class='cluster-name'])[${random_number_from_count}]
    Scroll Element Into View    (//td[@role='cell' and @class='cluster-name'])[${random_number_from_count}]
    Click Element    (//div[@title='Delete Session'])[${random_number_from_count}]
    Click Element    ${confirm_deletion_delete_btn}
    Wait Until Element Is Visible    ${toastify_success_message}    30
    Element Should Contain    ${toastify_success_message}    ${delete_session_id}

check_static_elements_session_listing
    [Documentation]    Check the static elements on the batch listing page.
    Wait Until Page Contains    Session ID    ${wait_20}
    Page Should Contain    Session ID 
    Page Should Contain    Status
    Page Should Contain    Location
    Page Should Contain    Creator
    Page Should Contain    Creation time
    Page Should Contain    Elapsed time
    Page Should Contain    Actions

open_session_details_page
    [Documentation]    click on the random batch id and go to batch details.
    Wait Until Element Is Visible    ${batch_id_first_element}    30
    ${name_list_count}    Get Element Count    ${batch_id_list}
    ${random_number_from_count}    get_random_number_from_range    ${name_list_count}     
    Scroll Element Into View    (//td[@role='cell' and @class='cluster-name'])[${random_number_from_count}]
    Click Element    (//td[@role='cell' and @class='cluster-name'])[${random_number_from_count}]

check_static_elements_session_details
    [Documentation]    Check the static elements on the batch details page.
    Wait Until Page Contains    TERMINATE    ${wait_max}
    Page Should Contain Element    ${batch_details_view_cloud_logs}
    Page Should Contain Element    ${batch_details_view_spark_logs}
    Page Should Contain    Name
    Page Should Contain    UUID
    Page Should Contain    Status
    Page Should Contain    Create time
    Page Should Contain    Details
    Page Should Contain    Elapsed time
    Page Should Contain    Properties
    Page Should Contain    Labels