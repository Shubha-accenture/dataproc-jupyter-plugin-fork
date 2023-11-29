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
Variables    ../locators/clusters.py
Resource    config_setup.robot
Resource    runtimetemplate.robot
Resource    batches.robot
Library    ../resources/python_keywords.py
Library    ../.venv/lib/python3.9/site-packages/robot/libraries/OperatingSystem.py

*** Keywords ***
open_clusters_listing_page
    [Documentation]    launcher page to clusters listing page.
    Scroll Element Into View    ${clusters_card_launcher_loc}
    Click Element    ${clusters_card_launcher_loc}
    Wait Until Element Is Visible    ${cluster_toggle_loc}
    Click Element    ${cluster_toggle_loc}

check_cluster_name_and_status
    [Documentation]    get the name and status from listing and verify it on details page.
    Wait Until Element Is Visible    ${cluster_name_list}
    ${name_list_count}    Get Element Count    ${cluster_name_list}
    ${random_number_from_count}    get_random_number_from_range    ${name_list_count}     
    Scroll Element Into View    (//td[@role='button' and @class='cluster-name'])[${random_number_from_count}]
    ${list_name}    Get Text    (//td[@role='button' and @class='cluster-name'])[${random_number_from_count}]
    ${list_status}    Get Text    (//div[@class='cluster-status'])[${random_number_from_count}]
    Click Element    (//td[@role='button' and @class='cluster-name'])[${random_number_from_count}]
    Wait Until Element Is Visible    ${cluster_details_name}    ${wait_max}
    ${details_name}    Get Text    ${cluster_details_name}
    ${details_status}    Get Text    ${cluster_details_status}
    Should Be Equal As Strings    ${list_name}    ${details_name}
    Should Be Equal As Strings    ${list_status}    ${details_status}
    ${random_number_from_count}    Set Variable    0

back_nav_cluster_details
    Wait Until Element Is Visible    ${cluster_name_list}
    ${name_list_count}    Get Element Count    ${cluster_name_list}
    ${random_number_from_count}    get_random_number_from_range    ${name_list_count}     
    Scroll Element Into View    (//td[@role='button' and @class='cluster-name'])[${random_number_from_count}]
    Click Element    (//td[@role='button' and @class='cluster-name'])[${random_number_from_count}]
    Wait Until Element Is Visible    ${back_nav_btn}
    Scroll Element Into View    ${back_nav_btn}
    Click Element    ${back_nav_btn}
    Wait Until Element Is Visible    ${cluster_name_list}

check_start_stop_cluster_listing
    [Documentation]    check the start/stop/restart buttons enable and disable based on cluster status.
    Wait Until Element Is Visible    ${cluster_name_list}    ${wait_max}
    ${name_list_count}    Get Element Count    ${cluster_name_list}
    ${random_number_from_count}    get_random_number_from_range    ${name_list_count}
    Scroll Element Into View    (//td[@role='button' and @class='cluster-name'])[${random_number_from_count}]
    ${status}    Get Text    (//div[@class='cluster-status'])[${random_number_from_count}]
    ${run_var}    Set Variable    Running
    ${stop_var}    Set Variable    Stopped
    ${stoppting_var}    Set Variable    Stopping
    ${starting_var}    Set Variable    Starting
    ${error_var}    Set Variable    Error
    IF    $status == $stop_var
        Scroll Element Into View    (//div[@class="actions-icon"])[${random_number_from_count}]/div[@aria-disabled="false"]//*[@data-icon="launcher:start-icon"]
        #start enabled
        Page Should Contain Element    (//div[@class="actions-icon"])[${random_number_from_count}]/div[@aria-disabled="false"]//*[@data-icon="launcher:start-icon"]
        #stop disabled
        Page Should Contain Element    (//div[@class="actions-icon"])[${random_number_from_count}]/div[@aria-disabled="true"]//*[@data-icon="launcher:stop-disable-icon"]
        #restart disabled
        Page Should Contain Element    (//div[@class="actions-icon"])[${random_number_from_count}]/div[@aria-disabled="true"]//*[@data-icon="launcher:restart-disable-icon"]
    ELSE IF    $status == $run_var
        Scroll Element Into View    (//div[@class="actions-icon"])[${random_number_from_count}]/div[@aria-disabled="true"]//*[@data-icon="launcher:start-disable-icon"]
        #start disabled
        Page Should Contain Element    (//div[@class="actions-icon"])[${random_number_from_count}]/div[@aria-disabled="true"]//*[@data-icon="launcher:start-disable-icon"]
        #stop enabled
        Page Should Contain Element    (//div[@class="actions-icon"])[${random_number_from_count}]/div[@aria-disabled="false"]//*[@data-icon="launcher:stop-icon"]    
        #restart enabled
        Page Should Contain Element    (//div[@class="actions-icon"])[${random_number_from_count}]/div[@aria-disabled="false"]//*[@data-icon="launcher:restart-icon"]
    ELSE IF    $status == $stoppting_var
        Scroll Element Into View    (//div[@class="actions-icon"])[${random_number_from_count}]/div[@aria-disabled="true"]//*[@data-icon="launcher:start-disable-icon"]
        #start disabled
        Page Should Contain Element    (//div[@class="actions-icon"])[${random_number_from_count}]/div[@aria-disabled="true"]//*[@data-icon="launcher:start-disable-icon"]
        #stop disabled
        Page Should Contain Element    (//div[@class="actions-icon"])[${random_number_from_count}]/div[@aria-disabled="true"]//*[@data-icon="launcher:stop-disable-icon"]    
        #restart disabled
        Page Should Contain Element    (//div[@class="actions-icon"])[${random_number_from_count}]/div[@aria-disabled="true"]//*[@data-icon="launcher:restart-disable-icon"]
    ELSE IF    $status == $starting_var
        Scroll Element Into View    (//div[@class="actions-icon"])[${random_number_from_count}]/div[@aria-disabled="true"]//*[@data-icon="launcher:start-disable-icon"]
        #start disabled
        Page Should Contain Element    (//div[@class="actions-icon"])[${random_number_from_count}]/div[@aria-disabled="true"]//*[@data-icon="launcher:start-disable-icon"]
        #stop disabled
        Page Should Contain Element    (//div[@class="actions-icon"])[${random_number_from_count}]/div[@aria-disabled="true"]//*[@data-icon="launcher:stop-disable-icon"]    
        #restart disabled
        Page Should Contain Element    (//div[@class="actions-icon"])[${random_number_from_count}]/div[@aria-disabled="true"]//*[@data-icon="launcher:restart-disable-icon"]            
    ELSE IF    $status == $error_var
        Scroll Element Into View    (//div[@class="actions-icon"])[${random_number_from_count}]/div[@aria-disabled="true"]//*[@data-icon="launcher:start-disable-icon"]
        #start disabled
        Page Should Contain Element    (//div[@class="actions-icon"])[${random_number_from_count}]/div[@aria-disabled="true"]//*[@data-icon="launcher:start-disable-icon"]
        #stop disabled
        Page Should Contain Element    (//div[@class="actions-icon"])[${random_number_from_count}]/div[@aria-disabled="true"]//*[@data-icon="launcher:stop-disable-icon"]    
        #restart disabled
        Page Should Contain Element    (//div[@class="actions-icon"])[${random_number_from_count}]/div[@aria-disabled="true"]//*[@data-icon="launcher:restart-disable-icon"]            
    END
    
click_start_action_btn_on_clusters_listing
    [Documentation]    click on the start cluster action button on listing page and check the status.
    Wait Until Element Is Visible    ${cluster_name_list}
    ${name_list_count}    Get Element Count    ${cluster_listing_start_enabled_btn}
    ${random_number_from_count}    get_random_number_from_range    ${name_list_count}
    Scroll Element Into View    (//div[@class="actions-icon"]/div[@aria-disabled="false"]//*[@data-icon="launcher:start-icon"])[${random_number_from_count}]
    ${start_cluster_name}    Get Text    (//div[@class="actions-icon"]/div[@aria-disabled="false"]//*[@data-icon="launcher:start-icon"])[${random_number_from_count}]/parent::div/parent::div/parent::div/parent::td/parent::tr/td[@class="cluster-name"]   
    Click Element    (//div[@class="actions-icon"]/div[@aria-disabled="false"]//*[@data-icon="launcher:start-icon"])[${random_number_from_count}]
    Wait Until Element Is Visible    //td[@class="cluster-name" and text()="${start_cluster_name}"]/parent::tr/td/div[@class="cluster-status-parent"]/div[text()="starting"]    20
    Scroll Element Into View    //td[@class="cluster-name" and text()="${start_cluster_name}"]/parent::tr/td/div[@class="cluster-status-parent"]/div[text()="starting"]
    ${start_status}    Get Text    //td[@class="cluster-name" and text()="${start_cluster_name}"]/parent::tr/td/div[@class="cluster-status-parent"]/div[text()="starting"]
    Should Be Equal As Strings    ${start_status}    Starting
    Click Element    //div[@class="cluster-status" and text()="starting"]/parent::div/parent::td/parent::tr/td[@class="cluster-name"]
    Wait Until Element Is Visible    ${cluster_details_status}    ${wait_max}
    ${details_status}    Get Text    ${cluster_details_status}
    Should Be Equal As Strings    ${details_status}    Starting

click_stop_action_btn_on_clusters_listing
    [Documentation]    click on the stop cluster action button on listing page and check the status.
    Wait Until Element Is Visible    ${cluster_name_list}
    ${name_list_count}    Get Element Count    ${cluster_listing_stop_enabled_btn}
    ${random_number_from_count}    get_random_number_from_range    ${name_list_count}
    Scroll Element Into View    (//div[@class="actions-icon"]/div[@aria-disabled="false"]//*[@data-icon="launcher:stop-icon"])[${random_number_from_count}]
    ${stop_cluster_name}    Get Text    (//div[@class="actions-icon"]/div[@aria-disabled="false"]//*[@data-icon="launcher:stop-icon"])[${random_number_from_count}]/parent::div/parent::div/parent::div/parent::td/parent::tr/td[@class="cluster-name"]   
    Click Element    (//div[@class="actions-icon"]/div[@aria-disabled="false"]//*[@data-icon="launcher:stop-icon"])[${random_number_from_count}]
    Wait Until Element Is Visible    //td[@class="cluster-name" and text()="${stop_cluster_name}"]/parent::tr/td/div[@class="cluster-status-parent"]/div[text()="stopping"]    20
    Scroll Element Into View    //td[@class="cluster-name" and text()="${stop_cluster_name}"]/parent::tr/td/div[@class="cluster-status-parent"]/div[text()="stopping"]
    ${stop_status}    Get Text    //td[@class="cluster-name" and text()="${stop_cluster_name}"]/parent::tr/td/div[@class="cluster-status-parent"]/div[text()="stopping"]
    Should Be Equal As Strings    ${stop_status}    Stopping
    Click Element    //div[@class="cluster-status" and text()="stopping"]/parent::div/parent::td/parent::tr/td[@class="cluster-name"]
    Wait Until Element Is Visible    ${cluster_details_status}    ${wait_max}
    ${details_status}    Get Text    ${cluster_details_status}
    Should Be Equal As Strings    ${details_status}    Stopping

click_restart_action_btn_on_clusters_listing
    [Documentation]    click on the stop cluster action button on listing page and check the status.
    Wait Until Element Is Visible    ${cluster_name_list}
    ${name_list_count}    Get Element Count    ${cluster_listing_restart_enabled_btn}
    ${random_number_from_count}    get_random_number_from_range    ${name_list_count}
    Scroll Element Into View    (//div[@class="actions-icon"]/div[@aria-disabled="false"]//*[@data-icon="launcher:restart-icon"])[${random_number_from_count}]
    #Click Element    (//div[@class="actions-icon"]/div[@aria-disabled="false"]//*[@data-icon="launcher:restart-icon"])[${random_number_from_count}]
    Click Element    (//div[@class="actions-icon"]/div[@aria-disabled="false"]//*[@data-icon="launcher:restart-icon"]/parent::div/parent::div)[${random_number_from_count}]
    Wait Until Page Contains    stopping    20
    Click Element    //div[@class="cluster-status" and text()="stopping"]/parent::div/parent::td/parent::tr/td[@class="cluster-name"]
    Wait Until Page Contains    stopping    20
    Wait Until Page Contains    starting    20
    # Click Element    ${back_nav_btn}
    # close_tabs
    # open_clusters_listing_page
    # Wait Until Page Contains    starting    300
    # Scroll Element Into View    //div[@class="cluster-status" and text()="starting"]/parent::div/parent::td/parent::tr/td[@class="cluster-name"]
    # Wait Until Page Contains    starting    300
    # Click Element    //div[@class="cluster-status" and text()="starting"]/parent::div/parent::td/parent::tr/td[@class="cluster-name"]
    # Wait Until Page Contains    starting    20

click_start_action_btn_on_clusters_details
    [Documentation]    open the cluster details for stopped cluster and check the status on clicking start cluster.
    Wait Until Element Is Visible    ${cluster_name_list}    ${wait_max}
    ${name_list_count}    Get Element Count    ${cluster_listing_start_enabled_btn}
    ${random_number_from_count}    get_random_number_from_range    ${name_list_count}
    Scroll Element Into View    (//div[@aria-labels="STOPPED"]/parent::td/parent::tr/td[@class="cluster-name"])[${random_number_from_count}]
    Click Element    (//div[@aria-labels="STOPPED"]/parent::td/parent::tr/td[@class="cluster-name"])[${random_number_from_count}]
    Wait Until Element Is Visible    ${cluster_details_start_enabled_btn}
    Wait Until Element Is Visible    ${cluster_details_stop_disabled_btn}
    Click Element    ${cluster_details_start_enabled_btn}
    Wait Until Page Contains    starting    20
    ${details_status}    Get Text    ${cluster_details_status}
    Should Be Equal As Strings    ${details_status}    Starting
    ${cluster_name}    Get Text    ${cluster_details_name}
    Click Element    ${back_nav_btn}
    Wait Until Element Is Visible    ${cluster_name_list}    ${wait_max}
    Scroll Element Into View    //td[@class="cluster-name" and text()="${cluster_name}"]/parent::tr/td/div[@class="cluster-status-parent"]/div
    Wait Until Element Is Visible    //td[@class="cluster-name" and text()="${cluster_name}"]/parent::tr/td/div[@class="cluster-status-parent"]/div[text()="starting"]    20
    ${list_status}    Get Text    //td[@class="cluster-name" and text()="${cluster_name}"]/parent::tr/td/div[@class="cluster-status-parent"]/div[text()="starting"]
    Should Be Equal As Strings    ${list_status}    Starting
    


click_stop_action_btn_on_clusters_details
    [Documentation]    open the cluster details for stopped cluster and check the status on clicking start cluster.
    Wait Until Element Is Visible    ${cluster_name_list}    ${wait_max}
    ${name_list_count}    Get Element Count    ${cluster_listing_stop_enabled_btn}
    ${random_number_from_count}    get_random_number_from_range    ${name_list_count}
    Scroll Element Into View    (//div[@aria-labels="RUNNING"]/parent::td/parent::tr/td[@class="cluster-name"])[${random_number_from_count}]
    Click Element    (//div[@aria-labels="RUNNING"]/parent::td/parent::tr/td[@class="cluster-name"])[${random_number_from_count}]
    Wait Until Element Is Visible    ${cluster_details_stop_enabled_btn}
    Wait Until Element Is Visible    ${cluster_details_start_disabled_btn}
    Click Element    ${cluster_details_stop_enabled_btn}
    Wait Until Page Contains    stopping    20
    ${details_status}    Get Text    ${cluster_details_status}
    Should Be Equal As Strings    ${details_status}    Stopping
    ${cluster_name}    Get Text    ${cluster_details_name}
    Click Element    ${back_nav_btn}
    Wait Until Element Is Visible    ${cluster_name_list}    ${wait_max}
    Scroll Element Into View    //td[@class="cluster-name" and text()="${cluster_name}"]/parent::tr/td/div[@class="cluster-status-parent"]/div
    Wait Until Element Is Visible    //td[@class="cluster-name" and text()="${cluster_name}"]/parent::tr/td/div[@class="cluster-status-parent"]/div[text()="stopping"]    20
    ${list_status}    Get Text    //td[@class="cluster-name" and text()="${cluster_name}"]/parent::tr/td/div[@class="cluster-status-parent"]/div[text()="stopping"]
    Should Be Equal As Strings    ${list_status}    Stopping       

delete_cluster_from_details_page
    [Documentation]    delete the cluster.
    Wait Until Element Is Visible    ${cluster_name_list}
    ${name_list_count}    Get Element Count    ${cluster_name_list}
    ${random_number_from_count}    get_random_number_from_range    ${name_list_count}
    Scroll Element Into View    (//td[@role='button' and @class='cluster-name'])[10]
    Click Element    (//td[@role='button' and @class='cluster-name'])[10]
    Wait Until Element Is Visible    ${cluster_details_view_cloud_logs}    ${wait_max}
    Wait Until Element Is Visible    ${cluster_details_name}    30
    ${cluster_name}    Get Text    ${cluster_details_name}
    Wait Until Element Is Visible    ${cluster_details_delete_enabled_btn}    ${wait_max}
    Click Element    ${cluster_details_delete_enabled_btn}
    Wait Until Element Is Visible    ${confirm_deletion_dialog}    ${wait_max}
    Element Should Contain    ${confirm_deletion_text}    ${cluster_name}
    Wait Until Element Is Visible    ${confirm_deletion_cancel_btn}
    Wait Until Element Is Visible    ${confirm_deletion_delete_btn}
    Click Element    ${confirm_deletion_cancel_btn}
    Element Should Be Visible    ${cluster_details_delete_enabled_btn}
    Click Element    ${cluster_details_delete_enabled_btn}
    Element Should Contain    ${confirm_deletion_text}    ${cluster_name}
    Wait Until Element Is Visible    ${confirm_deletion_cancel_btn}
    Wait Until Element Is Visible    ${confirm_deletion_delete_btn}
    Click Element    ${confirm_deletion_delete_btn}
    Wait Until Element Is Visible    ${cluster_toggle_loc}    30
    Wait Until Element Is Visible    ${toastify_success_message}    30
    Element Should Contain    ${toastify_success_message}    ${cluster_name}

check_static_elements_cluster_listing
    [Documentation]    Check the static elements on the cluster listing page.
    Wait Until Page Contains    Cluster image name    ${wait_20}
    Page Should Contain    Name
    Page Should Contain    Status
    Page Should Contain    Cluster image name
    Page Should Contain    Region
    Page Should Contain    Zone
    Page Should Contain    Total worker nodes
    Page Should Contain    Scheduled deletion
    Page Should Contain    Actions

check_static_elements_cluster_details
    [Documentation]    Check the static elements on the batch details page.
    Wait Until Element Is Visible    ${delete_btn_details_page}    ${wait_20}
    Wait Until Page Contains    Job ID    ${wait_20}
    Page Should Contain    START
    Page Should Contain    STOP
    Page Should Contain    DELETE
    Page Should Contain Element    ${batch_details_view_cloud_logs}
    Page Should Contain    Name
    Page Should Contain    Cluster UUID
    Page Should Contain    Type
    Page Should Contain    Status
    Page Should Contain    Jobs
    Page Should Contain Element    ${submit_job_btn_loc}
    Page Should Contain    Job ID
    Page Should Contain    Status
    Page Should Contain    Region
    Page Should Contain    Type
    Page Should Contain    Start time
    Page Should Contain    Elapsed time	
    Page Should Contain    Labels
    Page Should Contain    Actions

open_cluster_details_page
    Wait Until Element Is Visible    xpath:(//td[@role='button' and @class='cluster-name'])[1]    ${wait_20}
    Click Element    xpath:(//td[@role='button' and @class='cluster-name'])[1]