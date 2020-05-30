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

import { ApiService, AppListCloudPage, GroupIdentityService, IdentityService, LoginSSOPage, ProcessDefinitionsService, ProcessInstancesService, QueryService, TasksService } from '@alfresco/adf-testing';
import { browser } from 'protractor';
import { TasksCloudDemoPage } from '../pages/adf/demo-shell/process-services/tasks-cloud-demo.page';
import { NavigationBarPage } from '../pages/adf/navigation-bar.page';

describe('Process list cloud', () => {

    describe('Process List - Custom Action Menu', () => {
        const loginSSOPage = new LoginSSOPage();
        const navigationBarPage = new NavigationBarPage();
        const appListCloudComponent = new AppListCloudPage();
        const tasksCloudDemoPage = new TasksCloudDemoPage();

        let processDefinitionService: ProcessDefinitionsService;
        let processInstancesService: ProcessInstancesService;
        let identityService: IdentityService;
        let groupIdentityService: GroupIdentityService;
        let queryService: QueryService;
        let tasksService: TasksService;
        let testUser, groupInfo, editProcess, deleteProcess, editTask, deleteTask;

        const simpleApp = browser.params.resources.ACTIVITI_CLOUD_APPS.SIMPLE_APP.name;
        const apiService = new ApiService();

        beforeAll(async () => {
        await apiService.login(browser.params.identityAdmin.email, browser.params.identityAdmin.password);
        identityService = new IdentityService(apiService);
        groupIdentityService = new GroupIdentityService(apiService);
        testUser = await identityService.createIdentityUserWithRole( [identityService.ROLES.ACTIVITI_USER]);
        groupInfo = await groupIdentityService.getGroupInfoByGroupName('hr');
        await identityService.addUserToGroup(testUser.idIdentityService, groupInfo.id);

        await apiService.login(testUser.email, testUser.password);
        processDefinitionService = new ProcessDefinitionsService(apiService);
        const processDefinition = await processDefinitionService
                .getProcessDefinitionByName(browser.params.resources.ACTIVITI_CLOUD_APPS.SIMPLE_APP.processes.dropdownrestprocess, simpleApp);

        processInstancesService = new ProcessInstancesService(apiService);
        editProcess = await processInstancesService.createProcessInstance(processDefinition.entry.key, simpleApp);
        deleteProcess = await processInstancesService.createProcessInstance(processDefinition.entry.key, simpleApp);
        queryService = new QueryService(apiService);

        editTask = await queryService.getProcessInstanceTasks(editProcess.entry.id, simpleApp);
        deleteTask = await queryService.getProcessInstanceTasks(deleteProcess.entry.id, simpleApp);
        tasksService = new TasksService(apiService);
        await tasksService.claimTask(editTask.list.entries[0].entry.id, simpleApp);
        await tasksService.claimTask(deleteTask.list.entries[0].entry.id, simpleApp);

        await loginSSOPage.loginSSOIdentityService(testUser.email, testUser.password);
        });

        afterAll(async() => {
            await apiService.login(browser.params.identityAdmin.email, browser.params.identityAdmin.password);
            await identityService.deleteIdentityUser(testUser.idIdentityService);
        });

        beforeAll(async () => {
            await navigationBarPage.navigateToProcessServicesCloudPage();
            await appListCloudComponent.checkApsContainer();
            await appListCloudComponent.goToApp(simpleApp);
            await tasksCloudDemoPage.clickSettingsButton();
            await tasksCloudDemoPage.enableTestingMode();
            await tasksCloudDemoPage.enableActionMenu();
            await tasksCloudDemoPage.enableContextMenu();
            await tasksCloudDemoPage.addActionIsDisplayed();
            await tasksCloudDemoPage.addAction('edit');
            await tasksCloudDemoPage.actionAdded('edit');
            await tasksCloudDemoPage.addAction('delete');
            await tasksCloudDemoPage.actionAdded('delete');
            await tasksCloudDemoPage.addDisabledAction('disabledaction');
            await tasksCloudDemoPage.actionAdded('disabledaction');
            await tasksCloudDemoPage.addInvisibleAction('invisibleaction');
            await tasksCloudDemoPage.actionAdded('invisibleaction');
            await tasksCloudDemoPage.clickAppButton();
            await tasksCloudDemoPage.editTaskFilterCloudComponent().openFilter();
            await tasksCloudDemoPage.taskFilterCloudComponent.checkTaskFilterIsDisplayed('my-tasks');
        });

        it('[C315723] Should be able to see and execute custom action menu', async () => {
            await expect(await tasksCloudDemoPage.taskFilterCloudComponent.getActiveFilterName()).toBe('My Tasks');
            await tasksCloudDemoPage.taskListCloudComponent().checkTaskListIsLoaded();
            await tasksCloudDemoPage.taskListCloudComponent().checkContentIsDisplayedById(editTask.list.entries[0].entry.id);
            await tasksCloudDemoPage.taskListCloudComponent().clickOptionsButton(editTask.list.entries[0].entry.id);
            await expect(await tasksCloudDemoPage.taskListCloudComponent().isCustomActionEnabled('disabledaction')).toBe(false);
            await expect(await tasksCloudDemoPage.taskListCloudComponent().getNumberOfOptions()).toBe(3);
            await tasksCloudDemoPage.taskListCloudComponent().clickOnCustomActionMenu('edit');
            await tasksCloudDemoPage.checkActionExecuted(editTask.list.entries[0].entry.id, 'edit');
            await tasksCloudDemoPage.taskListCloudComponent().rightClickOnRow(deleteTask.list.entries[0].entry.id);
            await expect(await tasksCloudDemoPage.taskListCloudComponent().isCustomActionEnabled('disabledaction')).toBe(false);
            await expect(await tasksCloudDemoPage.taskListCloudComponent().getNumberOfOptions()).toBe(3);
            await tasksCloudDemoPage.taskListCloudComponent().clickContextMenuActionNamed('delete');
            await tasksCloudDemoPage.checkActionExecuted(deleteTask.list.entries[0].entry.id, 'delete');
        });
   });
});
