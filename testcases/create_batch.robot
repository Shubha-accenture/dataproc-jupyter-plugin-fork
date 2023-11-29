*** Settings ***
Library     Selenium2Library
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
checking_back_and_cancel_btn
    open_batch_listing_page
    click_on_create_batch_btn
    click_on_back_navigation_btn_batch
    click_on_create_batch_btn
    click_on_cancel_btn_batch

create_batch_spark_with_main_class
    [Documentation]    spark+class+local-network+google-managed
    project_check_dataproc_jupyter_extension_dev
    open_batch_listing_page
    click_on_create_batch_btn
    ${batch_id}    add_postfix_batch_id
    select_batch_type_spark
    select_main_class_radio_btn
    input_main_class
    input_custom_container_image
    input_jar_file
    input_files_file
    input_archive_file
    input_arguments_file
    input_service_account
    select_networks_in_this_project
    input_network_tags
    select_google_managed_encryption
    select_metastore_project_id
    #select_metastore_region
    select_metastore_services
    select_history_server_cluster
    add_spark_property
    add_label
    click_submit_btn
    validate_batch_id    ${batch_id}

create_batch_spark_with_main_jar_file
    [Documentation]    spark+jar+local-network+google-managed
    project_check_dataproc_jupyter_extension_dev
    open_batch_listing_page
    click_on_create_batch_btn
    ${batch_id}    add_postfix_batch_id
    select_batch_type_spark
    select_main_jar_file_radio_btn
    input_main_jar_file
    input_custom_container_image
    input_jar_file
    input_files_file
    input_archive_file
    input_arguments_file
    input_service_account
    select_networks_in_this_project
    input_network_tags
    select_google_managed_encryption
    select_metastore_project_id
    #select_metastore_region
    select_metastore_services
    select_history_server_cluster
    add_spark_property
    add_label
    click_submit_btn
    validate_batch_id    ${batch_id}

create_batch_spark_with_main_class_cmek_drodown
    [Documentation]    spark+class+local-network+cmek-dropdown-keys
    project_check_dataproc_jupyter_extension_dev
    open_batch_listing_page
    click_on_create_batch_btn
    ${batch_id}    add_postfix_batch_id
    select_batch_type_spark
    select_main_class_radio_btn
    input_main_class
    input_custom_container_image
    input_jar_file
    input_files_file
    input_archive_file
    input_arguments_file
    input_service_account
    select_networks_in_this_project
    input_network_tags
    select_cmek_keys_dropdown
    select_metastore_project_id
    #select_metastore_region
    select_metastore_services
    select_history_server_cluster
    add_spark_property
    add_label
    click_submit_btn
    validate_batch_id    ${batch_id}

create_batch_spark_with_main_jar_cmek_dropdown
    [Documentation]    spark+jar+local-network+cmek-dropdown-keys
    project_check_dataproc_jupyter_extension_dev
    open_batch_listing_page
    click_on_create_batch_btn
    ${batch_id}    add_postfix_batch_id
    select_batch_type_spark
    select_main_jar_file_radio_btn
    input_main_jar_file
    input_custom_container_image
    input_jar_file
    input_files_file
    input_archive_file
    input_arguments_file
    input_service_account
    select_networks_in_this_project
    input_network_tags
    select_cmek_keys_dropdown
    select_metastore_project_id
    #select_metastore_region
    select_metastore_services
    select_history_server_cluster
    add_spark_property
    add_label
    click_submit_btn
    validate_batch_id    ${batch_id}

create_batch_spark_with_main_class_cmek_manually
    [Documentation]    spark+class+local-network+cmek-manually-keys
    project_check_dataproc_jupyter_extension_dev
    open_batch_listing_page
    click_on_create_batch_btn
    ${batch_id}    add_postfix_batch_id
    select_batch_type_spark
    select_main_class_radio_btn
    input_main_class
    input_custom_container_image
    input_jar_file
    input_files_file
    input_archive_file
    input_arguments_file
    input_service_account
    select_networks_in_this_project
    input_network_tags
    select_cmek_keys_manually
    select_metastore_project_id
    #select_metastore_region
    select_metastore_services
    select_history_server_cluster
    add_spark_property
    add_label
    click_submit_btn
    validate_batch_id    ${batch_id}
    
create_batch_spark_with_main_jar_cmek_dropdown
    [Documentation]    spark+jar+local-network+cmek-manually-keys
    project_check_dataproc_jupyter_extension_dev
    open_batch_listing_page
    click_on_create_batch_btn
    ${batch_id}    add_postfix_batch_id
    select_batch_type_spark
    select_main_jar_file_radio_btn
    input_main_jar_file
    input_custom_container_image
    input_jar_file
    input_files_file
    input_archive_file
    input_arguments_file
    input_service_account
    select_networks_in_this_project
    input_network_tags
    select_cmek_keys_manually
    select_metastore_project_id
    #select_metastore_region
    select_metastore_services
    select_history_server_cluster
    add_spark_property
    add_label
    click_submit_btn
    validate_batch_id    ${batch_id}

#SparkR
create_batch_sparkr_localnetwork_google_managed
    [Documentation]    sparkR+local-network+google-managed
    project_check_dataproc_jupyter_extension_dev
    open_batch_listing_page
    click_on_create_batch_btn
    ${batch_id}    add_postfix_batch_id
    select_batch_type_sparkr
    input_main_sparkr_file
    input_custom_container_image
    input_files_file
    input_archive_file
    input_arguments_file
    input_service_account
    select_networks_in_this_project
    input_network_tags
    select_google_managed_encryption
    select_metastore_project_id
    #select_metastore_region
    select_metastore_services
    select_history_server_cluster
    add_spark_property
    add_label
    click_submit_btn
    validate_batch_id    ${batch_id}

create_batch_sparkr_localnetwork_cmek_keysdropdown
    [Documentation]    sparkR+local-network+cmek-dropdown
    project_check_dataproc_jupyter_extension_dev
    open_batch_listing_page
    click_on_create_batch_btn
    ${batch_id}    add_postfix_batch_id
    select_batch_type_sparkr
    input_main_sparkr_file
    input_custom_container_image
    input_files_file
    input_archive_file
    input_arguments_file
    input_service_account
    select_networks_in_this_project
    input_network_tags
    select_cmek_keys_dropdown
    select_metastore_project_id
    #select_metastore_region
    select_metastore_services
    select_history_server_cluster
    add_spark_property
    add_label
    click_submit_btn
    validate_batch_id    ${batch_id}

create_batch_sparkr_localnetwork_cmek_keys_manually
    [Documentation]    sparkR+local-network+cmek-keys-manually
    project_check_dataproc_jupyter_extension_dev
    open_batch_listing_page
    click_on_create_batch_btn
    ${batch_id}    add_postfix_batch_id
    select_batch_type_sparkr
    input_main_sparkr_file
    input_custom_container_image
    input_files_file
    input_archive_file
    input_arguments_file
    input_service_account
    select_networks_in_this_project
    input_network_tags
    select_cmek_keys_manually
    select_metastore_project_id
    #select_metastore_region
    select_metastore_services
    select_history_server_cluster
    add_spark_property
    add_label
    click_submit_btn
    validate_batch_id    ${batch_id}

#PySpark
create_batch_pyspark_localnetwork_google_managed
    [Documentation]    sparkR+local-network+google-managed
    project_check_dataproc_jupyter_extension_dev
    open_batch_listing_page
    click_on_create_batch_btn
    ${batch_id}    add_postfix_batch_id
    select_batch_type_pyspark
    input_main_pyspark_file
    input_additional_python_file
    input_custom_container_image
    input_jar_file
    input_files_file
    input_archive_file
    input_arguments_file
    input_service_account
    select_networks_in_this_project
    input_network_tags
    select_google_managed_encryption
    select_metastore_project_id
    #select_metastore_region
    select_metastore_services
    select_history_server_cluster
    add_spark_property
    add_label
    click_submit_btn
    validate_batch_id    ${batch_id}

create_batch_pyspark_localnetwork_cmek_dropdown
    [Documentation]    sparkR+local-network+cmek-dropdown
    project_check_dataproc_jupyter_extension_dev
    open_batch_listing_page
    click_on_create_batch_btn
    ${batch_id}    add_postfix_batch_id
    select_batch_type_pyspark
    input_main_pyspark_file
    input_additional_python_file
    input_custom_container_image
    input_jar_file
    input_files_file
    input_archive_file
    input_arguments_file
    input_service_account
    select_networks_in_this_project
    input_network_tags
    select_cmek_keys_dropdown
    select_metastore_project_id
    #select_metastore_region
    select_metastore_services
    select_history_server_cluster
    add_spark_property
    add_label
    click_submit_btn
    validate_batch_id    ${batch_id}

create_batch_pyspark_localnetwork_cmek_manually
    [Documentation]    sparkR+local-network+cmek-manually
    project_check_dataproc_jupyter_extension_dev
    open_batch_listing_page
    click_on_create_batch_btn
    ${batch_id}    add_postfix_batch_id
    select_batch_type_pyspark
    input_main_pyspark_file
    input_additional_python_file
    input_custom_container_image
    input_jar_file
    input_files_file
    input_archive_file
    input_arguments_file
    input_service_account
    select_networks_in_this_project
    input_network_tags
    select_cmek_keys_manually
    select_metastore_project_id
    #select_metastore_region
    select_metastore_services
    select_history_server_cluster
    add_spark_property
    add_label
    click_submit_btn
    validate_batch_id    ${batch_id}

#SparkSQL
create_batch_sparksql_localnetwork_google_managed
    [Documentation]    sparkR+local-network+google-managed
    project_check_dataproc_jupyter_extension_dev
    open_batch_listing_page
    click_on_create_batch_btn
    ${batch_id}    add_postfix_batch_id
    select_batch_type_sparksql
    input_main_sparksql_file
    input_custom_container_image
    input_jar_file
    add_query_parameters
    input_service_account
    select_networks_in_this_project
    input_network_tags
    select_google_managed_encryption
    select_metastore_project_id
    #select_metastore_region
    select_metastore_services
    select_history_server_cluster
    add_spark_property
    add_label
    click_submit_btn
    validate_batch_id    ${batch_id}

create_batch_sparksql_localnetwork_cmek_dropdown
    [Documentation]    sparkR+local-network+cmek-dropdown
    project_check_dataproc_jupyter_extension_dev
    open_batch_listing_page
    click_on_create_batch_btn
    ${batch_id}    add_postfix_batch_id
    select_batch_type_sparksql
    input_main_sparksql_file
    input_custom_container_image
    input_jar_file
    add_query_parameters
    input_service_account
    select_networks_in_this_project
    input_network_tags
    select_cmek_keys_dropdown
    select_metastore_project_id
    #select_metastore_region
    select_metastore_services
    select_history_server_cluster
    add_spark_property
    add_label
    click_submit_btn
    validate_batch_id    ${batch_id}

create_batch_sparksql_localnetwork_cmek_manually
    [Documentation]    sparkR+local-network+cmek-manually
    project_check_dataproc_jupyter_extension_dev
    open_batch_listing_page
    click_on_create_batch_btn
    ${batch_id}    add_postfix_batch_id
    select_batch_type_sparksql
    input_main_sparksql_file
    input_custom_container_image
    input_jar_file
    add_query_parameters
    input_service_account
    select_networks_in_this_project
    input_network_tags
    select_cmek_keys_manually
    select_metastore_project_id
    #select_metastore_region
    select_metastore_services
    select_history_server_cluster
    add_spark_property
    add_label
    click_submit_btn
    validate_batch_id    ${batch_id}

#Shared-VPC

#Spark
create_batch_spark_with_main_class
    [Documentation]    spark+class+local-network+google-managed
    project_check_test_consume_shared_vpc
    open_batch_listing_page
    click_on_create_batch_btn
    ${batch_id}    add_postfix_batch_id
    select_batch_type_spark
    select_main_class_radio_btn
    input_main_class
    input_custom_container_image
    input_jar_file
    input_files_file
    input_archive_file
    input_arguments_file
    #input_service_account
    select_shared_vpc_networks
    input_network_tags
    select_google_managed_encryption
    select_metastore_project_id
    #select_metastore_region
    select_metastore_services
    #select_history_server_cluster
    add_spark_property
    add_label
    click_submit_btn
    validate_batch_id    ${batch_id}
    
create_batch_spark_with_main_jar_file
    [Documentation]    spark+jar+local-network+google-managed
    project_check_test_consume_shared_vpc
    open_batch_listing_page
    click_on_create_batch_btn
    ${batch_id}    add_postfix_batch_id
    select_batch_type_spark
    select_main_jar_file_radio_btn
    input_main_jar_file
    input_custom_container_image
    input_jar_file
    input_files_file
    input_archive_file
    input_arguments_file
    #input_service_account
    select_shared_vpc_networks
    input_network_tags
    select_google_managed_encryption
    select_metastore_project_id
    #select_metastore_region
    select_metastore_services
    #select_history_server_cluster
    add_spark_property
    add_label
    click_submit_btn
    validate_batch_id    ${batch_id}

create_batch_spark_with_main_class_cmek_drodown
    [Documentation]    spark+class+local-network+cmek-dropdown-keys
    project_check_test_consume_shared_vpc
    open_batch_listing_page
    click_on_create_batch_btn
    ${batch_id}    add_postfix_batch_id
    select_batch_type_spark
    select_main_class_radio_btn
    input_main_class
    input_custom_container_image
    input_jar_file
    input_files_file
    input_archive_file
    input_arguments_file
    #input_service_account
    select_shared_vpc_networks
    input_network_tags
    #select_cmek_keys_dropdown
    select_metastore_project_id
    #select_metastore_region
    select_metastore_services
    #select_history_server_cluster
    add_spark_property
    add_label
    click_submit_btn
    validate_batch_id    ${batch_id}

create_batch_spark_with_main_jar_cmek_dropdown
    [Documentation]    spark+jar+local-network+cmek-dropdown-keys
    project_check_test_consume_shared_vpc
    open_batch_listing_page
    click_on_create_batch_btn
    ${batch_id}    add_postfix_batch_id
    select_batch_type_spark
    select_main_jar_file_radio_btn
    input_main_jar_file
    input_custom_container_image
    input_jar_file
    input_files_file
    input_archive_file
    input_arguments_file
    #input_service_account
    select_shared_vpc_networks
    input_network_tags
    #select_cmek_keys_dropdown
    select_metastore_project_id
    #select_metastore_region
    select_metastore_services
    #select_history_server_cluster
    add_spark_property
    add_label
    click_submit_btn
    validate_batch_id    ${batch_id}

create_batch_spark_with_main_class_cmek_manually
    [Documentation]    spark+class+local-network+cmek-manually-keys
    project_check_test_consume_shared_vpc
    open_batch_listing_page
    click_on_create_batch_btn
    ${batch_id}    add_postfix_batch_id
    select_batch_type_spark
    select_main_class_radio_btn
    input_main_class
    input_custom_container_image
    input_jar_file
    input_files_file
    input_archive_file
    input_arguments_file
    #input_service_account
    select_shared_vpc_networks
    input_network_tags
    #select_cmek_keys_manually
    select_metastore_project_id
    #select_metastore_region
    select_metastore_services
    #select_history_server_cluster
    add_spark_property
    add_label
    click_submit_btn
    validate_batch_id    ${batch_id}
    
create_batch_spark_with_main_jar_cmek_dropdown
    [Documentation]    spark+jar+local-network+cmek-manually-keys
    project_check_test_consume_shared_vpc
    open_batch_listing_page
    click_on_create_batch_btn
    ${batch_id}    add_postfix_batch_id
    select_batch_type_spark
    select_main_jar_file_radio_btn
    input_main_jar_file
    input_custom_container_image
    input_jar_file
    input_files_file
    input_archive_file
    input_arguments_file
    #input_service_account
    select_shared_vpc_networks
    input_network_tags
    #select_cmek_keys_manually
    select_metastore_project_id
    #select_metastore_region
    select_metastore_services
    #select_history_server_cluster
    add_spark_property
    add_label
    click_submit_btn
    validate_batch_id    ${batch_id}

#SparkR
create_batch_sparkr_localnetwork_google_managed
    [Documentation]    sparkR+local-network+google-managed
    project_check_test_consume_shared_vpc
    open_batch_listing_page
    click_on_create_batch_btn
    ${batch_id}    add_postfix_batch_id
    select_batch_type_sparkr
    input_main_sparkr_file
    input_custom_container_image
    input_files_file
    input_archive_file
    input_arguments_file
    #input_service_account
    select_shared_vpc_networks
    input_network_tags
    select_google_managed_encryption
    select_metastore_project_id
    #select_metastore_region
    select_metastore_services
    #select_history_server_cluster
    add_spark_property
    add_label
    click_submit_btn
    validate_batch_id    ${batch_id}

create_batch_sparkr_localnetwork_cmek_keysdropdown
    [Documentation]    sparkR+local-network+cmek-dropdown
    project_check_test_consume_shared_vpc
    open_batch_listing_page
    click_on_create_batch_btn
    ${batch_id}    add_postfix_batch_id
    select_batch_type_sparkr
    input_main_sparkr_file
    input_custom_container_image
    input_files_file
    input_archive_file
    input_arguments_file
    #input_service_account
    select_shared_vpc_networks
    input_network_tags
    #select_cmek_keys_dropdown
    select_metastore_project_id
    #select_metastore_region
    select_metastore_services
    #select_history_server_cluster
    add_spark_property
    add_label
    click_submit_btn
    validate_batch_id    ${batch_id}

create_batch_sparkr_localnetwork_cmek_keys_manually
    [Documentation]    sparkR+local-network+cmek-keys-manually
    project_check_test_consume_shared_vpc
    open_batch_listing_page
    click_on_create_batch_btn
    ${batch_id}    add_postfix_batch_id
    select_batch_type_sparkr
    input_main_sparkr_file
    input_custom_container_image
    input_files_file
    input_archive_file
    input_arguments_file
    #input_service_account
    select_shared_vpc_networks
    input_network_tags
    #select_cmek_keys_manually
    select_metastore_project_id
    #select_metastore_region
    select_metastore_services
    #select_history_server_cluster
    add_spark_property
    add_label
    click_submit_btn
    validate_batch_id    ${batch_id}

#PySpark
create_batch_pyspark_localnetwork_google_managed
    [Documentation]    sparkR+local-network+google-managed
    project_check_test_consume_shared_vpc
    open_batch_listing_page
    click_on_create_batch_btn
    ${batch_id}    add_postfix_batch_id
    select_batch_type_pyspark
    input_main_pyspark_file
    input_additional_python_file
    input_custom_container_image
    input_jar_file
    input_files_file
    input_archive_file
    input_arguments_file
    #input_service_account
    select_shared_vpc_networks
    input_network_tags
    select_google_managed_encryption
    select_metastore_project_id
    #select_metastore_region
    select_metastore_services
    #select_history_server_cluster
    add_spark_property
    add_label
    click_submit_btn
    validate_batch_id    ${batch_id}

create_batch_pyspark_localnetwork_cmek_dropdown
    [Documentation]    sparkR+local-network+cmek-dropdown
    project_check_test_consume_shared_vpc
    open_batch_listing_page
    click_on_create_batch_btn
    ${batch_id}    add_postfix_batch_id
    select_batch_type_pyspark
    input_main_pyspark_file
    input_additional_python_file
    input_custom_container_image
    input_jar_file
    input_files_file
    input_archive_file
    input_arguments_file
    #input_service_account
    select_shared_vpc_networks
    input_network_tags
    #select_cmek_keys_dropdown
    select_metastore_project_id
    #select_metastore_region
    select_metastore_services
    #select_history_server_cluster
    add_spark_property
    add_label
    click_submit_btn
    validate_batch_id    ${batch_id}

create_batch_pyspark_localnetwork_cmek_manually
    [Documentation]    sparkR+local-network+cmek-manually
    project_check_test_consume_shared_vpc
    open_batch_listing_page
    click_on_create_batch_btn
    ${batch_id}    add_postfix_batch_id
    select_batch_type_pyspark
    input_main_pyspark_file
    input_additional_python_file
    input_custom_container_image
    input_jar_file
    input_files_file
    input_archive_file
    input_arguments_file
    #input_service_account
    select_shared_vpc_networks
    input_network_tags
    #select_cmek_keys_manually
    select_metastore_project_id
    #select_metastore_region
    select_metastore_services
    #select_history_server_cluster
    add_spark_property
    add_label
    click_submit_btn
    validate_batch_id    ${batch_id}

#SparkSQL
create_batch_sparksql_localnetwork_google_managed
    [Documentation]    sparkR+local-network+google-managed
    project_check_test_consume_shared_vpc
    open_batch_listing_page
    click_on_create_batch_btn
    ${batch_id}    add_postfix_batch_id
    select_batch_type_sparksql
    input_main_sparksql_file
    input_custom_container_image
    input_jar_file
    add_query_parameters
    #input_service_account
    select_shared_vpc_networks
    input_network_tags
    select_google_managed_encryption
    select_metastore_project_id
    #select_metastore_region
    select_metastore_services
    #select_history_server_cluster
    add_spark_property
    add_label
    click_submit_btn
    validate_batch_id    ${batch_id}

create_batch_sparksql_localnetwork_cmek_dropdown
    [Documentation]    sparkR+local-network+cmek-dropdown
    project_check_test_consume_shared_vpc
    open_batch_listing_page
    click_on_create_batch_btn
    ${batch_id}    add_postfix_batch_id
    select_batch_type_sparksql
    input_main_sparksql_file
    input_custom_container_image
    input_jar_file
    add_query_parameters
    #input_service_account
    select_shared_vpc_networks
    input_network_tags
    #select_cmek_keys_dropdown
    select_metastore_project_id
    #select_metastore_region
    select_metastore_services
    #select_history_server_cluster
    add_spark_property
    add_label
    click_submit_btn
    validate_batch_id    ${batch_id}

create_batch_sparksql_localnetwork_cmek_manually
    [Documentation]    sparkR+local-network+cmek-manually
    project_check_test_consume_shared_vpc
    open_batch_listing_page
    click_on_create_batch_btn
    ${batch_id}    add_postfix_batch_id
    select_batch_type_sparksql
    input_main_sparksql_file
    input_custom_container_image
    input_jar_file
    add_query_parameters
    #input_service_account
    select_shared_vpc_networks
    input_network_tags
    #select_cmek_keys_manually
    select_metastore_project_id
    #select_metastore_region
    select_metastore_services
    #select_history_server_cluster
    add_spark_property
    add_label
    click_submit_btn
    validate_batch_id    ${batch_id}