#launcher cluster card
clusters_card_launcher_loc="xpath://p[text()='Clusters']/parent::div/parent::div"

#jobs
jobs_top_tabpanel_loc="xpath://div[text()='Jobs']"

#input JobID
input_job_id="xpath://label[text()='Job ID*']/parent::div/div/input"

#submit job 
submit_job_btn_loc="xpath://div[text()='SUBMIT JOB']"
back_navigation_btn_loc="xpath://*[local-name()='svg' and @data-icon='launcher:left-arrow-icon']"
cancel_btn_loc="xpath=//div[text()='CANCEL']"

#cluster dropdown
cluster_dropdown_click_loc="xpath://input[@class='MuiInputBase-input MuiOutlinedInput-input MuiInputBase-inputSizeSmall MuiInputBase-inputAdornedEnd MuiAutocomplete-input MuiAutocomplete-inputFocused css-1okh9hg']"
clusters_dropdown_first_element="xpath://li[contains(@id,'option-0')]"

#job type dropdown
job_type_dropdown_click_loc="xpath://label[text()='Job type*']/parent::div/div/div"
job_type_dropdown_spark_element="xpath://li[@data-value='spark' and text()='Spark']"
job_type_dropdown_sparkr_element="xpath://li[@data-value='sparkR' and text()='SparkR']"
job_type_dropdown_sparksql_element="xpath://li[@data-value='sparkSql' and text()='SparkSql']"
job_type_dropdown_pyspark_element="xpath://li[@data-value='pySpark' and text()='PySpark']"
select_query_source_type="xpath://div/label[text()='Query source type*']/following-sibling::div/div"

#main class or jar file
input_main_or_jar_file_loc="xpath://label[text()='Main class or jar*']/parent::div/div/input"
input_sparkr_file_loc="xpath://label[text()='Main R file*']/parent::div/div/input"
input_main_python_file_loc="xpath://label[text()='Main Python file*']/parent::div/div/input"

#input main python file
input_main_python_file="xpath://label[text()='Main Python file*']/parent::div/div/input"

#input additional python file
input_additional_python_file="xpath://label[text()='Additional python files']/parent::div/div/input"

#select query source type
select_query_file="xpath://li[text()='Query file']"
select_query_text="xpath://li[text()='Query text']"

#input query file
input_query_file="xpath://label[text()='Query file*']/parent::div/div/input"
input_query_text="xpath://label[text()=' Query text*']/parent::div/div/input"

#input jar files
input_jar_file_loc="xpath://label[text()='Jar files']/parent::div/div/input"

#input files
input_files_file_loc="xpath://label[text()='Files']/parent::div/div/input"

#input archive files
input_archive_file_loc="xpath://label[text()='Archive files']/parent::div/div/input"

#input arguments
input_arguments_file_loc="xpath://label[text()='Arguments']/parent::div/div/input"

#input max restarts per hour
input_max_restarts_per_hour="xpath://label[text()='Max restarts per hour']/parent::div/div/input"

#click add properties button
add_property_btn_loc="xpath://span[text()='ADD PROPERTY']"
add_property_key1_loc="xpath://span[text()='ADD PROPERTY']/parent::button/parent::div//label[text()='Key 1*']/parent::div//input[@class='MuiInputBase-input MuiOutlinedInput-input MuiInputBase-inputSizeSmall css-k9lw1l']"
add_property_value1_loc="xpath://span[text()='ADD PROPERTY']/parent::button/parent::div//label[text()='Value 1']/parent::div//input[@class='MuiInputBase-input MuiOutlinedInput-input MuiInputBase-inputSizeSmall css-k9lw1l']"

add_property_key2_loc="xpath://span[text()='ADD PROPERTY']/parent::button/parent::div//label[text()='Key 2*']/parent::div//input[@class='MuiInputBase-input MuiOutlinedInput-input MuiInputBase-inputSizeSmall css-k9lw1l']"
add_property_value2_loc=add_prop_value2="xpath://span[text()='ADD PROPERTY']/parent::button/parent::div//label[text()='Value 2']/parent::div//input[@class='MuiInputBase-input MuiOutlinedInput-input MuiInputBase-inputSizeSmall css-k9lw1l']"

#click and add labels
add_label_btn_loc="xpath://span[text()='ADD LABEL']"
add_label_key1_loc="xpath://span[text()='ADD LABEL']/parent::button/parent::div//label[text()='Key 2*']/parent::div//input[@class='MuiInputBase-input MuiOutlinedInput-input MuiInputBase-inputSizeSmall css-k9lw1l']"
add_label_value1_loc="xpath://span[text()='ADD LABEL']/parent::button/parent::div//label[text()='Value 2']/parent::div//input[@class='MuiInputBase-input MuiOutlinedInput-input MuiInputBase-inputSizeSmall css-k9lw1l']"

add_label_key2_loc="xpath://span[text()='ADD LABEL']/parent::button/parent::div//label[text()='Key 3*']/parent::div//input[@class='MuiInputBase-input MuiOutlinedInput-input MuiInputBase-inputSizeSmall css-k9lw1l']"
add_label_value2_loc="xpath://span[text()='ADD LABEL']/parent::button/parent::div//label[text()='Value 3']/parent::div//input[@class='MuiInputBase-input MuiOutlinedInput-input MuiInputBase-inputSizeSmall css-k9lw1l']"

#click submit button
submit_btn_loc="xpath://div[text()='SUBMIT']"
submit_btn_enabled_loc="xpath://div[@class='submit-button-style']/div[text()='SUBMIT']"
submit_btn_disabled_loc="xpath://div[@class='submit-button-disable-style']/div[text()='SUBMIT']"

# add query parameter
add_parameter_btn_loc="xpath://span[text()='ADD PARAMETER']"
add_parameter_key1_loc="xpath://span[text()='ADD PARAMETER']/parent::button/parent::div//label[text()='Key 1*']/parent::div//input[@class='MuiInputBase-input MuiOutlinedInput-input MuiInputBase-inputSizeSmall css-k9lw1l']"
add_parameter_value1_loc="xpath://span[text()='ADD PARAMETER']/parent::button/parent::div//label[text()='Value 1']/parent::div//input[@class='MuiInputBase-input MuiOutlinedInput-input MuiInputBase-inputSizeSmall css-k9lw1l']"

# job id validate
job_id_loc="xpath://label[text()='Job ID*']/parent::div/div/input"

#jobs listing
jobs_id_list="xpath://td[@role='cell' and @class='cluster-name']"
jobs_id_first_element="xpath:(//td[@role='cell' and @class='cluster-name'])[1]"
jobs_id_status_list="xpath://div[@class='cluster-status']"
job_details_label="xpath://div[@class='cluster-details-title' and text()='Job details']"
job_details_name="xpath://div[@class='cluster-details-label' and text()='Job ID']/following-sibling::div"
job_details_status="xpath://div[@class='cluster-details-label' and text()='Status']/following-sibling::div/div/following-sibling::div"
job_delete_listing="xpath://div[@role='button' and @title='Delete Job']"
job_clone_listing="xpath://div[@role='button' and @title='Clone Job']"
job_stop_listing="xpath://div[@role='button' and @title='Stop Job']"

#job clone
job_clone_cancel_btn="xpath://div[text()='CANCEL']/parent::div[@class='job-cancel-button-style']"
job_clone_submit_btn="xpath://div[text()='SUBMIT']/parent::div[@class='submit-button-style']"

#job details 
job_details_clone_btn="xpath://div[text()='CLONE']/parent::div"
job_details_stop_btn="xpath://div[text()='STOP']/parent::div"
job_details_delete_btn="xpath://div[text()='DELETE']/parent::div"
job_details_view_spark_logs="xpath://div[text()='VIEW SPARK LOGS']/parent::div"

#job details labels edit
job_details_edit_btn="xpath://div[@role='button' and @class='job-edit-button']"
job_details_labels_delete_icon="xpath:(//div[@role='button' and @class='labels-delete-icon'])[1]"

