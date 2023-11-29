*** Settings ***
Library    Selenium2Library
Library    Collections
Library    String
Variables    ../constants/constant.py
Variables    ../locators/runtimetemplate.py
Variables    ../locators/login.py
Variables    ../locators/jobs.py
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
checking_back_and_cancel_btn
    open_the_submit_job_page 
    click_on_submit_job_btn
    click_on_back_navigation_btn
    click_on_submit_job_btn 
    click_on_cancel_btn

submit_job_spark_with_spark_file
    project_check_dataproc_jupyter_extension_dev
    open_the_submit_job_page 
    click_on_submit_job_btn 
    select_cluster_from_dropdown
    ${job_id}    get_job_id
    select_job_type_spark_from_dropdown
    input_spark_with_jar_file
    input_jar_file
    input_files_file
    input_archive_file
    input_arguments_file
    input_max_restarts_per_hour
    input_add_property
    input_add_label
    click_submit_btn
    validate_job_id    ${job_id}

submit_job_spark_with_class
    project_check_dataproc_jupyter_extension_dev
    open_the_submit_job_page 
    click_on_submit_job_btn 
    select_cluster_from_dropdown
    ${job_id}    get_job_id
    select_job_type_spark_from_dropdown
    input_spark_with_class
    input_jar_file
    input_files_file
    input_archive_file
    input_arguments_file
    input_max_restarts_per_hour
    input_add_property
    input_add_label
    click_submit_btn
    validate_job_id    ${job_id}

submit_job_sparkr
    project_check_dataproc_jupyter_extension_dev
    open_the_submit_job_page 
    click_on_submit_job_btn 
    select_cluster_from_dropdown
    ${job_id}    get_job_id
    select_job_type_sparkr_from_dropdown
    input_sparkr_file
    input_files_file
    input_arguments_file
    input_max_restarts_per_hour
    input_add_property
    input_add_label
    click_submit_btn
    validate_job_id    ${job_id}

submit_job_pyspark
    project_check_dataproc_jupyter_extension_dev
    open_the_submit_job_page 
    click_on_submit_job_btn 
    select_cluster_from_dropdown
    ${job_id}    get_job_id
    select_job_type_pyspark_from_dropdown
    input_pyspark_file
    input_additional_python_file
    input_jar_file
    input_files_file
    input_archive_file
    input_arguments_file
    input_max_restarts_per_hour
    input_add_property
    input_add_label
    click_submit_btn
    validate_job_id    ${job_id}

submit_job_sparksql_file
    project_check_dataproc_jupyter_extension_dev
    open_the_submit_job_page 
    click_on_submit_job_btn 
    select_cluster_from_dropdown
    ${job_id}    get_job_id
    select_job_type_sparksql_from_dropdown
    select_query_source_type_query_file
    input_query_file
    input_jar_file
    add_query_parameters
    input_max_restarts_per_hour
    input_add_property
    input_add_label
    click_submit_btn
    validate_job_id    ${job_id}

submit_job_sparksql_text
    project_check_dataproc_jupyter_extension_dev
    open_the_submit_job_page 
    click_on_submit_job_btn 
    select_cluster_from_dropdown
    ${job_id}    get_job_id
    select_job_type_sparksql_from_dropdown
    select_query_source_type_query_text
    input_query_text
    input_jar_file
    input_max_restarts_per_hour
    input_add_property
    input_add_label
    click_submit_btn
    validate_job_id    ${job_id}