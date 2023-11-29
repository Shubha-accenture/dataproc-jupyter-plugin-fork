*** Settings ***
Library    Selenium2Library
Library    RequestsLibrary
Library    Collections
Library    String
Variables    ../constants/constant.py
Variables    ../locators/login.py
Variables    ../locators/launcher.py
Variables    ../locators/config_setup.py

*** Keywords ***
open_config_setup_page
    [Documentation]    opening config setup page from launcher
    Wait Until Element Is Visible    ${jupyter_settings_loc}
    Click Element    ${jupyter_settings_loc}
    Wait Until Element Is Visible    ${config_setup_loc}
    Click Element    ${config_setup_loc}
    Wait Until Element Is Visible    ${config_save_button}    20