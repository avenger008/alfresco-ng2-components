/*!
 * @license
 * Copyright 2019 Alfresco Software, Ltd.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { UsersActions } from '../../actions/users.actions';
import { LoginSSOPage, BrowserActions, Widget, ApplicationsUtil, ProcessUtil, ApiService } from '@alfresco/adf-testing';
import { TasksPage } from '../../pages/adf/process-services/tasks.page';
import CONSTANTS = require('../../util/constants');
import { browser } from 'protractor';

describe('Radio Buttons Widget', () => {

    const loginPage = new LoginSSOPage();
    let processUserModel;
    const taskPage = new TasksPage();
    const widget = new Widget();
    const alfrescoJsApi = new ApiService().apiService;
    let appModel;
    const app = browser.params.resources.Files.WIDGET_CHECK_APP.RADIO_BUTTONS;
    let deployedApp, process;

    beforeAll(async () => {
        const users = new UsersActions();

        await alfrescoJsApi.login(browser.params.testConfig.adf.adminEmail, browser.params.testConfig.adf.adminPassword);

        processUserModel = await users.createTenantAndUser(alfrescoJsApi);

        await alfrescoJsApi.login(processUserModel.email, processUserModel.password);
        const applicationsService = new ApplicationsUtil(alfrescoJsApi);
        appModel = await applicationsService.importPublishDeployApp(browser.params.resources.Files.WIDGET_CHECK_APP.file_path);

        const appDefinitions = await alfrescoJsApi.activiti.appsApi.getAppDefinitions();
        deployedApp = appDefinitions.data.find((currentApp) => {
            return currentApp.modelId === appModel.id;
        });

        process = await new ProcessUtil(alfrescoJsApi).startProcessByDefinitionName(appModel.name, app.processName);
        await loginPage.login(processUserModel.email, processUserModel.password);
   });

    beforeEach(async () => {
        const urlToNavigateTo = `${browser.params.testConfig.adf.url}/activiti/apps/${deployedApp.id}/tasks/`;
        await BrowserActions.getUrl(urlToNavigateTo);
        await taskPage.filtersPage().goToFilter(CONSTANTS.TASK_FILTERS.MY_TASKS);
        await taskPage.formFields().checkFormIsDisplayed();
    });

    afterAll(async () => {
        await alfrescoJsApi.activiti.processApi.deleteProcessInstance(process.id);
        await alfrescoJsApi.login(browser.params.testConfig.adf.adminEmail, browser.params.testConfig.adf.adminPassword);
        await alfrescoJsApi.activiti.adminTenantsApi.deleteTenant(processUserModel.tenantId);
   });

    it('[C277316] Should display empty radio buttons when no preselection is configured', async () => {
        await widget.checkboxWidget().clickCheckboxInput(app.FIELD.checkbox_id);
        await widget.radioWidget().isSelectionClean(app.FIELD.radio_buttons_id);
    });

    it('[C274704] Should be able to set visibility properties for Radio Button widget', async () => {
        await taskPage.formFields().checkWidgetIsHidden(app.FIELD.radio_buttons_id);
        await expect(await taskPage.formFields().isCompleteFormButtonDisabled()).toBeTruthy();

        await widget.checkboxWidget().clickCheckboxInput(app.FIELD.checkbox_id);
        await expect(await widget.radioWidget().getRadioWidgetLabel(app.FIELD.radio_buttons_id)).toContain('Radio posts');
        await widget.radioWidget().selectOption(app.FIELD.radio_buttons_id, 1);
        await expect(await taskPage.formFields().isCompleteFormButtonDisabled()).toBeFalsy();
    });
});
