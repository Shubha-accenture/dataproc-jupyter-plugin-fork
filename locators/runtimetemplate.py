#launcher RT card
launcher_rt_card_loc="xpath://div[@class='jp-LauncherCard' and @title='Create a new runtime template']"
back_nav_btn="xpath://*[local-name()='svg' and @data-icon='launcher:left-arrow-icon']"
cancel_btn="xpath://div[text()='CANCEL']"
save_btn="xpath://div[text()='SAVE']"
create_rt_btn="xpath://div[text()='Create']"

#input display name
input_display_name="xpath://label[text()='Display name*']/parent::div/div/input"

#input description
input_description="xpath://label[text()='Description*']/parent::div/div/input"

#input custom container image
input_container_image="xpath://label[text()='Custom container image']/parent::div/div/input"

#input network tags
input_network_tags="xpath://label[text()='Network tags']/parent::div/div/input"

#select radio button network configuration
select_networks_in_this_project="xpath://input[@value='projectNetwork']"
select_networks_shared_from_host_project="xpath://input[@value='sharedVpc']"

shared_subnetworks_dropdown="xpath:(//input[@class='MuiInputBase-input MuiOutlinedInput-input MuiInputBase-inputSizeSmall MuiInputBase-inputAdornedEnd MuiAutocomplete-input MuiAutocomplete-inputFocused css-1okh9hg'])[1]"
shared_subnetworks_dropdown_first_element="xpath:(//li[@class='MuiAutocomplete-option'])[1]"

select_network_error_msg="xpath://div[text()='Please select a valid network and subnetwork.']"

#metastore
select_metastore_project_id_dropdown="xpath://label[text()='Project ID']//parent::div//input"
select_metastore_project_id="xpath://li[@class='MuiAutocomplete-option' and text()='dataproc-jupyter-extension-dev']"
select_metastore_project_region_dropdown="xpath://label[text()='Metastore region']//parent::div//input"
select_metastore_project_region="xpath://li[@class='MuiAutocomplete-option' and text()='us-central1']"
select_metastore_service_dropdown="xpath://label[text()='Metastore services']//parent::div//input"
select_metastore_project_services="xpath://li[@class='MuiAutocomplete-option' and text()='projects/dataproc-jupyter-extension-dev/locations/us-central1/services/metastore3']"
select_metastore_services_first_element="xpath://li[contains(@id,'option-0')]"

#max idle time
input_max_idle_time="xpath://label[text()='Max idle time']/parent::div/div/input"
select_idle_time_dropdown="xpath://label[text()='Max idle time']/parent::div/parent::div/following-sibling::div/div"
select_hour="xpath://li[text()='hour']"
select_min="xpath://li[text()='min']"
select_sec="xpath://li[text()='sec']"

#max session time
input_max_session_time="xpath://label[text()='Max session time']/parent::div/div/input"
select_session_time_dropdown="xpath://label[text()='Max session time']/parent::div/parent::div/following-sibling::div/div"

#python packages repository
input_packages_repository="xpath://label[text()='Python packages repository']/parent::div/div/input"

#select persistent spark history server
history_server_cluster_dropdown="xpath://label[text()='History server cluster']//parent::div//input"
select_server_history_cluster="xpath://li[text()='cluster-phs']"

#add spark property
click_add_property_btn="xpath://span[text()='ADD PROPERTY']"
add_prop_key1="xpath://span[text()='ADD PROPERTY']/parent::button/parent::div//label[text()='Key 1*']/parent::div//input[@class='MuiInputBase-input MuiOutlinedInput-input MuiInputBase-inputSizeSmall css-k9lw1l']"
add_prop_value1="xpath://span[text()='ADD PROPERTY']/parent::button/parent::div//label[text()='Value 1']/parent::div//input[@class='MuiInputBase-input MuiOutlinedInput-input MuiInputBase-inputSizeSmall css-k9lw1l']"
add_prop_key2="xpath://span[text()='ADD PROPERTY']/parent::button/parent::div//label[text()='Key 2*']/parent::div//input[@class='MuiInputBase-input MuiOutlinedInput-input MuiInputBase-inputSizeSmall css-k9lw1l']"
add_prop_value2="xpath://span[text()='ADD PROPERTY']/parent::button/parent::div//label[text()='Value 2']/parent::div//input[@class='MuiInputBase-input MuiOutlinedInput-input MuiInputBase-inputSizeSmall css-k9lw1l']"

#add label
click_add_label_btn="xpath://span[text()='ADD LABEL']"
add_label_key2="xpath://span[text()='ADD LABEL']/parent::button/parent::div//label[text()='Key 2*']/parent::div//input[@class='MuiInputBase-input MuiOutlinedInput-input MuiInputBase-inputSizeSmall css-k9lw1l']"
add_label_value2="xpath://span[text()='ADD LABEL']/parent::button/parent::div//label[text()='Value 2']/parent::div//input[@class='MuiInputBase-input MuiOutlinedInput-input MuiInputBase-inputSizeSmall css-k9lw1l']"
add_label_key3="xpath://span[text()='ADD LABEL']/parent::button/parent::div//label[text()='Key 3*']/parent::div//input[@class='MuiInputBase-input MuiOutlinedInput-input MuiInputBase-inputSizeSmall css-k9lw1l']"
add_label_value3="xpath://span[text()='ADD LABEL']/parent::button/parent::div//label[text()='Value 3']/parent::div//input[@class='MuiInputBase-input MuiOutlinedInput-input MuiInputBase-inputSizeSmall css-k9lw1l']"

#save btn
save_rt_btn="xpath://div[text()='SAVE']/parent::div"

#check success toast 
tostify="xpath://div[@class='Toastify__toast-body']"
tostify_text="xpath:(//div[@class='Toastify__toast-body']/div)[2]"
#tostify_close_btn="xpath://button[@aria-label='close' and @class='Toastify__close-button Toastify__close-button--dark']"
tostify_close_btn="xpath://button[@class='jp-Button jp-mod-minimal jp-Notification-Toast-Close']//*[local-name()='svg' and @data-icon='ui-components:close']"

#google managed network
select_primary_network="xpath://label[text()='Primary network*']/parent::div/div/input"
select_subnetwork="xpath://label[text()='subnetwork']/parent::div/div/input"
select_first_dropdown_element="xpath://li[contains(@id,'option-0')]"

