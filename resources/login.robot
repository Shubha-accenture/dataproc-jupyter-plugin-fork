*** Settings ***
Library    Selenium2Library
Library    Collections
Library    String
Library    ../.venv/lib/python3.9/site-packages/robot/libraries/Process.py
Variables    ../constants/constant.py
Variables    ../locators/login.py
Variables    ../locators/launcher.py




*** Keywords ***
login
    [Documentation]    to tnter the jupyterlab
    Open Browser    ${url}    ${chrome}
    Maximize Browser Window
    Wait Until Element Is Visible    ${password_input}
    Input Text    ${password_input}    ${token}
    Click Button    ${login_btn}
    Wait Until Element Is Visible    ${serverless_txt_launcher_screen}    120
    #Terminate All Processes

logout
    [Documentation]    closing the Browser
    Close Browser