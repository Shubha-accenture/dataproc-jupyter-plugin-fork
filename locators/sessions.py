#session
session_top_tabpanel_loc="xpath://div[text()='Sessions']"

#session listing
session_id_list="xpath://td[@role='cell' and @class='cluster-name']"
session_id_first_element="xpath:(//td[@role='cell' and @class='cluster-name'])[1]"
session_id_status_list="xpath://div[@class='cluster-status']"
session_details_label="xpath://div[@class='cluster-details-title' and text()='Batch details']"
session_details_name="xpath://div[@class='cluster-details-label' and text()='Name']/following-sibling::div"
session_details_status="xpath://div[@class='cluster-details-label' and text()='Status']/following-sibling::div/div[@class='cluster-status']"
session_delete_listing="xpath://div[@role='button' and @title='Delete Session']"
session_clone_listing="xpath://div[@role='button' and @title='Clone Session']"
session_stop_listing="xpath://div[@role='button' and @title='Stop Session']"

#batch details 
session_details_clone_btn="xpath://div[text()='CLONE']/parent::div"
session_details_stop_btn="xpath://div[text()='STOP']/parent::div"
session_details_delete_btn="xpath://div[text()='DELETE']/parent::div"
session_details_view_spark_logs="xpath://div[text()='VIEW SPARK LOGS']/parent::div"
session_details_view_cloud_logs="xpath://div[text()='VIEW CLOUD LOGS']/parent::div"

#batch clone
session_clone_cancel_btn="xpath://div[text()='CANCEL']/parent::div[@class='job-cancel-button-style']"
session_clone_submit_btn="xpath://div[text()='SUBMIT']/parent::div[@class='submit-button-style']"