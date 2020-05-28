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

import { browser } from 'protractor';
import { LoginSSOPage, ApplicationsUtil, ProcessUtil, ApiService } from '@alfresco/adf-testing';
import { ProcessFiltersPage } from '../pages/adf/process-services/process-filters.page';
import { CommentsPage } from '../pages/adf/comments.page';
import { NavigationBarPage } from '../pages/adf/navigation-bar.page';
import { UsersActions } from '../actions/users.actions';

describe('Comment component for Processes', () => {

    const loginPage = new LoginSSOPage();
    const processFiltersPage = new ProcessFiltersPage();
    const commentsPage = new CommentsPage();
    const navigationBarPage = new NavigationBarPage();

    const app = browser.params.resources.Files.SIMPLE_APP_WITH_USER_FORM;
    let user, tenantId, appId, processInstanceId, addedComment;
    const processName = 'Comment APS';
    const alfrescoJsApi = new ApiService().apiService;

    beforeAll(async () => {
        const users = new UsersActions();
        const applicationsService = new ApplicationsUtil(alfrescoJsApi);

        await alfrescoJsApi.login(browser.params.testConfig.admin.email, browser.params.testConfig.admin.password);

        user = await users.createTenantAndUser(alfrescoJsApi);

        tenantId = user.tenantId;

        await alfrescoJsApi.login(user.email, user.password);

        const importedApp = await applicationsService.importPublishDeployApp(app.file_path);
        appId = importedApp.id;

        const processWithComment = await new ProcessUtil(alfrescoJsApi).startProcessOfApp(importedApp.name, processName);
        processInstanceId = processWithComment.id;

        await loginPage.login(user.email, user.password);
   });

    afterAll(async () => {
        await alfrescoJsApi.activiti.modelsApi.deleteModel(appId);
        await alfrescoJsApi.login(browser.params.testConfig.admin.email, browser.params.testConfig.admin.password);
        await alfrescoJsApi.activiti.adminTenantsApi.deleteTenant(tenantId);
    });

    it('[C260464] Should be able to add a comment on APS and check on ADF', async () => {
        await alfrescoJsApi.activiti.commentsApi.addProcessInstanceComment({ message: 'HELLO' }, processInstanceId);

        await (await (await navigationBarPage.navigateToProcessServicesPage()).goToTaskApp()).clickProcessButton();

        await processFiltersPage.clickRunningFilterButton();
        await processFiltersPage.selectFromProcessList(processName);

        addedComment = await alfrescoJsApi.activiti.commentsApi.getProcessInstanceComments(processInstanceId, { 'latestFirst': true });

        await commentsPage.checkUserIconIsDisplayed();

        await expect(await commentsPage.getTotalNumberOfComments()).toEqual('Comments (' + addedComment.total + ')');
        await expect(await commentsPage.getMessage(0)).toEqual(addedComment.data[0].message);
        await expect(await commentsPage.getUserName(0)).toEqual(addedComment.data[0].createdBy.firstName + ' ' + addedComment.data[0].createdBy.lastName);
        await expect(await commentsPage.getTime(0)).toMatch(/(ago|few)/);
    });

    it('[C260465] Should not be able to view process comment on included task', async () => {
        await alfrescoJsApi.activiti.commentsApi.addProcessInstanceComment({ message: 'GOODBYE' }, processInstanceId);

        await (await (await navigationBarPage.navigateToProcessServicesPage()).goToTaskApp()).clickProcessButton();

        await processFiltersPage.clickRunningFilterButton();
        await processFiltersPage.selectFromProcessList(processName);

        const taskQuery = await alfrescoJsApi.activiti.taskApi.listTasks({ processInstanceId: processInstanceId });

        const taskId = taskQuery.data[0].id;

        const taskComments = await alfrescoJsApi.activiti.commentsApi.getTaskComments(taskId, { 'latestFirst': true });
        await expect(await taskComments.total).toEqual(0);
    });

    it('[C260466] Should be able to display comments from Task on the related Process', async () => {
        const taskQuery = await alfrescoJsApi.activiti.taskApi.listTasks({ processInstanceId: processInstanceId });

        const taskId = taskQuery.data[0].id;

        await alfrescoJsApi.activiti.taskApi.addTaskComment({ message: 'Task Comment' }, taskId);

        await (await (await navigationBarPage.navigateToProcessServicesPage()).goToTaskApp()).clickProcessButton();

        await processFiltersPage.clickRunningFilterButton();
        await processFiltersPage.selectFromProcessList(processName);

        const addedTaskComment = await alfrescoJsApi.activiti.commentsApi.getProcessInstanceComments(processInstanceId, { 'latestFirst': true });

        await commentsPage.checkUserIconIsDisplayed();

        await expect(await commentsPage.getTotalNumberOfComments()).toEqual('Comments (' + addedTaskComment.total + ')');
        await expect(await commentsPage.getMessage(0)).toEqual(addedTaskComment.data[0].message);
        await expect(await commentsPage.getUserName(0)).toEqual(addedTaskComment.data[0].createdBy.firstName + ' ' + addedTaskComment.data[0].createdBy.lastName);
        await expect(await commentsPage.getTime(0)).toMatch(/(ago|few)/);
    });
});
