#from top navigation buttons
dataproc_loc='xpath://div[text()="Dataproc"]'
config_setup_loc='xpath://div[text()="Cloud Dataproc Settings"]'
click_setup_loc='xpath://div[text()="Cloud Dataproc Settings"]'
settings_text_loc='xpath://div[text()="Settings" and @class="settings-text"]'
jupyter_settings_loc='xpath://div[text()="Settings"]'
create_rt_btn_config_setup="xpath://div[@class='create-text' and text()='Create']"

#project ID
project_id_dropdown="xpath://label[text()='Project ID']/parent::div//input"
select_vpc_project_id="xpath://li[@class='MuiAutocomplete-option' and text()='test-consume-shared-vpc']"
select_project_id="xpath://li[@class='MuiAutocomplete-option' and text()='dataproc-jupyter-extension-dev']"
clear_project_id="xpath://label[text()='Project ID']/parent::div/div/div/button[@class='MuiButtonBase-root MuiIconButton-root MuiIconButton-sizeMedium MuiAutocomplete-clearIndicator css-edpqz1']"

#project region
project_region_dropdown="xpath://label[text()='Region']/parent::div//input"
select_vpc_project_region="xpath://li[text()='us-west1']"
select_project_region="xpath://li[text()='us-central1']"
clear_project_region="xpath://label[text()='Region']/parent::div/div/div/button[@class='MuiButtonBase-root MuiIconButton-root MuiIconButton-sizeMedium MuiAutocomplete-clearIndicator css-edpqz1']"

#config save button
config_save_button="xpath://button[text()='Save']"

#close tabs
tabs="xpath://div[@class='lm-Widget lm-TabBar lm-DockPanel-tabBar']/ul/li"
close_btn_on_tabs="xpath:(//*[local-name()='svg' and @data-icon='ui-components:close'])"


