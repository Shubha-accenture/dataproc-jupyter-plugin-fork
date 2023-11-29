clusters_card_launcher_loc="xpath://p[text()='Clusters']/parent::div/parent::div"
cluster_button_loc='xpath:(//div[@title="Create a new Cluster Component"])[1]'
cluster_toggle_loc='xpath://div[text()="Clusters" and @class="selected-header"]'
create_cluster_btn='xpath://div[text()="Create cluster" and @class="create-cluster-text"]'


#cluster listing
cluster_name_list="xpath://td[@role='button' and @class='cluster-name']"
cluster_status_list="xpath://div[@class='cluster-status']"
cluster_details_label="xpath://div[@class='cluster-details-title' and text()='Cluster details']"
cluster_details_name="xpath://div[@class='cluster-details-label' and text()='Name']/following-sibling::div"
cluster_details_status="xpath://div[@class='cluster-details-label' and text()='Status']/following-sibling::div/div/following-sibling::div"
cluster_listing_start_enabled_btn="xpath:(//div[@class='actions-icon'])/div[@aria-disabled='false']//*[@data-icon='launcher:start-icon']"
cluster_listing_stop_enabled_btn="xpath:(//div[@class='actions-icon'])/div[@aria-disabled='false']//*[@data-icon='launcher:stop-icon']"
cluster_listing_restart_enabled_btn="xpath:(//div[@class='actions-icon'])/div[@aria-disabled='false']//*[@data-icon='launcher:restart-icon']"

#cluster details
cluster_details_start_disabled_btn="xpath://div[@aria-disabled='true']//following-sibling::div[text()='START']/parent::div"
cluster_details_start_enabled_btn="xpath://div[@aria-disabled='false']//following-sibling::div[text()='START']/parent::div"
cluster_details_stop_disabled_btn="xpath://div[@aria-disabled='true']//following-sibling::div[text()='STOP']/parent::div"
cluster_details_stop_enabled_btn="xpath://div[@aria-disabled='false']//following-sibling::div[text()='STOP']/parent::div"
cluster_details_delete_enabled_btn="xpath://div[text()='DELETE']/parent::div"
cluster_details_view_cloud_logs="xpath://div[text()='VIEW CLOUD LOGS']/parent::div"

#delete
delete_btn_details_page="xpath://div[text()='DELETE']/parent::div"
confirm_deletion_dialog="xpath://h2[text()='Confirm deletion']/parent::div"
confirm_deletion_text="xpath://p[contains(text(),'This will delete')]"
confirm_deletion_cancel_btn="xpath://button[text()='Cancel']"
confirm_deletion_delete_btn="xpath://button[text()='Delete']"
toastify_success_message="xpath://div[@role='alert']/div[contains(text(),'deleted successfully')]"
toastify_submit_success_message="xpath://div[@role='alert']/div[contains(text(),'successfully')]"
toastify_update_success_message="xpath://div[@role='alert']/div[contains(text(),'Request to update job')]"


#submit job
details_jobs_title="xpath://div[text()='Jobs']"
details_submit_job_btn="xpath://div[text()='SUBMIT JOB']/parent::div"
details_jobs_delete_action_btn="xpath:(//div[@title='Delete Job'])[1]"
details_jobs_clone_action_btn="xpath:(//div[@title='Clone Job'])[1]"
details_job_stop_disabled_btn="xpath(//div[@title='Stop Job'])[1]//*[@data-icon='launcher:stop-disable-icon']"
details_job_name="xpath:(//td[@class='cluster-name'])[1]"
