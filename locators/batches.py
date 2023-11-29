#batches card from launcher screen
serverless_card_launcher_loc="xpath://p[text()='Serverless']/parent::div/parent::div"

#batches
batches_top_tabpanel_loc="xpath://div[text()='Batches']"

#create batch btn
create_batch_btn_loc="xpath://div[text()='Create Batch']"

#batch info
input_batch_id="xpath://label[text()='Batch ID*']/parent::div/div/input"

#container info
select_batch_type_dropdown="xpath://label[text()='Batch type*']/parent::div/div/div"
select_spark_batch_type="xpath://li[@data-value='spark']"
select_sparkr_batch_type="xpath://li[@data-value='sparkR']"
select_sparksql_batch_type="xpath://li[@data-value='sparkSql']"
select_pyspark_batch_type="xpath://li[@data-value='pySpark']"

#spark
main_class_radio_btn="xpath://input[@value='mainClass']"
input_main_class="xpath://label[text()='Main class*']/parent::div/div/input"
main_jar_uri_radio_btn="xpath://input[@value='mainJarURI']"
input_main_jar_file="xpath://label[text()='Main jar*']/parent::div/div/input"

#sparkR
input_sparkr_file="xpath://label[text()='Main R file*']/parent::div/div/input"

#sparkSQL
input_sparksql_file="xpath://label[text()='Query file*']/parent::div/div/input"

#pyspark
input_pyspark_file="xpath://label[text()=' Main python file*']/parent::div/div/input"

input_container_image_batch="xpath://label[text()=' Custom container image']/parent::div/div/input"

#service account 
input_service_account="xpath://label[text()='Service account']/parent::div/div/input"

#encryption radio buttons
select_radio_google_managed="xpath://div[text()='Google-managed encryption key']/parent::div/span/input"
select_radio_customer_managed="xpath://div[text()='Customer-managed encryption key (CMEK)']/parent::div/span/input"

#customer managed 
select_radio_dropdown_keys="xpath://label[text()='Key rings']/parent::div/parent::div/parent::div/parent::div/span/input"
select_radio_enter_manually="xpath://label[text()='Enter key manually']/parent::div/parent::div/parent::div/span/input"
click_dropdown_key_rings="xpath:(//label[text()='Key rings']/following-sibling::div/input)[1]"
select_dropdown_first_element_keys="xpath://li[contains(@id,'option-0')]"
input_manual_keys="xpath://label[text()='Enter key manually']/parent::div/div/input"

#batches listing
batch_id_list="xpath://td[@role='cell' and @class='cluster-name']"
batch_id_first_element="xpath:(//td[@role='cell' and @class='cluster-name'])[1]"
batch_id_status_list="xpath://div[@class='cluster-status']"
batch_details_label="xpath://div[@class='cluster-details-title' and text()='Batch details']"
batch_details_name="xpath://div[@class='details-label' and text()='Batch ID']/following-sibling::div"
batch_details_status="xpath://div[@class='details-label' and text()='Status']/following-sibling::div/div/following-sibling::div"
batch_delete_listing="xpath://div[@role='button' and @title='Delete Job']"
batch_clone_listing="xpath://div[@role='button' and @title='Clone Job']"
batch_stop_listing="xpath://div[@role='button' and @title='Stop Job']"

#batch details 
batch_details_clone_btn="xpath://div[text()='CLONE']/parent::div"
batch_details_stop_btn="xpath://div[text()='STOP']/parent::div"
batch_details_delete_btn="xpath://div[text()='DELETE']/parent::div"
batch_details_view_spark_logs="xpath://div[text()='VIEW SPARK LOGS']/parent::div"
batch_details_view_cloud_logs="xpath://div[text()='VIEW CLOUD LOGS']/parent::div"

#batch clone
batch_clone_cancel_btn="xpath://div[text()='CANCEL']/parent::div[@class='job-cancel-button-style']"
batch_clone_submit_btn="xpath://div[text()='SUBMIT']/parent::div[@class='submit-button-style']"