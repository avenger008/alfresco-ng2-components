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

import { LoginSSOPage, ApplicationsUtil, ProcessUtil, StartProcessPage, ApiService } from '@alfresco/adf-testing';
import { NavigationBarPage } from '../pages/adf/navigation-bar.page';
import { ProcessServicesPage } from '../pages/adf/process-services/process-services.page';
import { ProcessFiltersPage } from '../pages/adf/process-services/process-filters.page';
import { ProcessServiceTabBarPage } from '../pages/adf/process-services/process-service-tab-bar.page';
import { ProcessDetailsPage } from '../pages/adf/process-services/process-details.page';
import { ProcessListPage } from '../pages/adf/process-services/process-list.page';
import { UsersActions } from '../actions/users.actions';
import { browser } from 'protractor';
import { TasksPage } from '../pages/adf/process-services/tasks.page';
import CONSTANTS = require('../util/constants');
import { UserRepresentation } from '@alfresco/js-api';

describe('Task Assignee', () => {
    const loginPage = new LoginSSOPage();
    const navigationBarPage = new NavigationBarPage();
    const processServicesPage = new ProcessServicesPage();
    const taskPage = new TasksPage();

    const app = browser.params.resources.Files.TEST_ASSIGNEE;
    const alfrescoJsApi = new ApiService().apiService;
    const users = new UsersActions(alfrescoJsApi);

    describe('Candidate User Assignee', () => {
        const processListPage = new ProcessListPage();
        const processFiltersPage = new ProcessFiltersPage();
        const startProcessPage = new StartProcessPage();
        const processServiceTabBarPage = new ProcessServiceTabBarPage();
        const processDetailsPage = new ProcessDetailsPage();

        let user: UserRepresentation;

        beforeAll(async () => {
            await alfrescoJsApi.login(browser.params.testConfig.admin.email, browser.params.testConfig.admin.password);
            user = await users.createTenantAndUser();
            try {// creates user and group if not available
                await users.createApsUser(user.tenantId, app.candidate.email, app.candidate.firstName, app.candidate.lastName);
            } catch (e) {
            }
            try {// creates group if not available
                await alfrescoJsApi.activiti.adminGroupsApi.createNewGroup({
                    'name': app.candidateGroup,
                    'tenantId': user.tenantId,
                    'type': 1
                });
            } catch (e) {
            }

            await alfrescoJsApi.login(user.email, user.password);
            const applicationsService = new ApplicationsUtil(alfrescoJsApi);
            try {
                await applicationsService.importPublishDeployApp(app.file_path, { renewIdmEntries: true });
            } catch (e) {
                console.error(`failed to publish the application`);
            }
            await loginPage.login(user.email, user.password);
        });

        afterAll(async () => {
            await alfrescoJsApi.login(browser.params.testConfig.admin.email, browser.params.testConfig.admin.password);
            await alfrescoJsApi.activiti.adminTenantsApi.deleteTenant(user.tenantId);
        });

        beforeEach(async () => {
            await navigationBarPage.navigateToProcessServicesPage();
            await processServicesPage.checkApsContainer();
        });

        it('[C260387] Should the running process be displayed when clicking on Running filter', async () => {
            const name = 'sample-process-one';
            await processServicesPage.goToApp(app.title);
            await processServiceTabBarPage.clickProcessButton();
            await processListPage.checkProcessListIsDisplayed();
            await processFiltersPage.clickCreateProcessButton();
            await processFiltersPage.clickNewProcessDropdown();
            await startProcessPage.startProcess({ name, processName: app.processNames[0] });
            await processFiltersPage.selectFromProcessList(name);
            await processDetailsPage.clickOnActiveTask();

            await taskPage.tasksListPage().checkContentIsDisplayed(app.userTasks.simple.one);
            await taskPage.tasksListPage().selectRow(app.userTasks.simple.one);
            await taskPage.taskDetails().clickCompleteFormTask();
            await taskPage.tasksListPage().checkContentIsNotDisplayed(app.userTasks.simple.one);

            await taskPage.filtersPage().goToFilter(CONSTANTS.TASK_FILTERS.MY_TASKS);
            await taskPage.tasksListPage().checkContentIsNotDisplayed(app.userTasks.simple.one);

            await taskPage.filtersPage().goToFilter(CONSTANTS.TASK_FILTERS.COMPLETED_TASKS);
            await taskPage.tasksListPage().checkContentIsNotDisplayed(app.userTasks.simple.one);

            await taskPage.filtersPage().goToFilter(CONSTANTS.TASK_FILTERS.MY_TASKS);
            await taskPage.taskDetails().clickCompleteFormTask();
            await taskPage.tasksListPage().checkContentIsNotDisplayed(app.userTasks.simple.two);

            await taskPage.filtersPage().goToFilter(CONSTANTS.TASK_FILTERS.COMPLETED_TASKS);
            await taskPage.tasksListPage().checkContentIsDisplayed(app.userTasks.simple.two);
        });
    });

    describe('Candidate Group Assignee', () => {
        let user: UserRepresentation;
        let candidate1: UserRepresentation;
        let candidate2: UserRepresentation;

        beforeAll(async () => {
            await alfrescoJsApi.login(browser.params.testConfig.admin.email, browser.params.testConfig.admin.password);
            user = await users.createTenantAndUser();
            candidate1 = await users.createApsUser(user.tenantId);
            candidate2 = await users.createApsUser(user.tenantId);
            const adminGroup = await alfrescoJsApi.activiti.adminGroupsApi.createNewGroup(
                { 'name': app.adminGroup, 'tenantId': user.tenantId }
            );
            await alfrescoJsApi.activiti.adminGroupsApi.addGroupMember(adminGroup.id, user.id);
            await alfrescoJsApi.activiti.adminGroupsApi.addGroupCapabilities(adminGroup.id, { capabilities: app.adminCapabilities });

            const candidateGroup = await alfrescoJsApi.activiti.adminGroupsApi.createNewGroup(
                { 'name': app.candidateGroup, 'tenantId': user.tenantId, 'type': 1 }
            );
            await alfrescoJsApi.activiti.adminGroupsApi.addGroupMember(candidateGroup.id, candidate1.id);
            await alfrescoJsApi.activiti.adminGroupsApi.addGroupMember(candidateGroup.id, candidate2.id);
            await alfrescoJsApi.activiti.adminGroupsApi.addGroupMember(candidateGroup.id, user.id);

            try {
                await users.createApsUser(user.tenantId, app.candidate.email, app.candidate.firstName, app.candidate.lastName);
            } catch (e) {
            }

            await alfrescoJsApi.login(user.email, user.password);
            const applicationsService = new ApplicationsUtil(alfrescoJsApi);
            const appModel = await applicationsService.importPublishDeployApp(app.file_path, { renewIdmEntries: true });
            await new ProcessUtil(alfrescoJsApi).startProcessByDefinitionName(appModel.name, app.processNames[1]);
        });

        afterAll(async () => {
            await alfrescoJsApi.login(browser.params.testConfig.admin.email, browser.params.testConfig.admin.password);
            await alfrescoJsApi.activiti.adminTenantsApi.deleteTenant(user.tenantId);
        });

        it('[C216430] Start Task - Claim and Requeue a task', async () => {
            await loginPage.login(candidate1.email, candidate1.password);
            await navigationBarPage.navigateToProcessServicesPage();
            await processServicesPage.checkApsContainer();
            await processServicesPage.goToApp('Task App');
            await taskPage.tasksListPage().checkTaskListIsLoaded();

            await taskPage.filtersPage().goToFilter(CONSTANTS.TASK_FILTERS.QUE_TASKS);
            await taskPage.filtersPage().checkFilterIsHighlighted(CONSTANTS.TASK_FILTERS.QUE_TASKS);
            await taskPage.tasksListPage().checkContentIsDisplayed(app.userTasks.candidateTask);
            await taskPage.tasksListPage().selectRow(app.userTasks.candidateTask);
            await taskPage.taskDetails().checkClaimEnabled();

            await taskPage.filtersPage().goToFilter(CONSTANTS.TASK_FILTERS.INV_TASKS);
            await taskPage.filtersPage().checkFilterIsHighlighted(CONSTANTS.TASK_FILTERS.INV_TASKS);
            await taskPage.tasksListPage().checkTaskListIsLoaded();
            await taskPage.tasksListPage().checkContentIsNotDisplayed(app.userTasks.candidateTask);

            await taskPage.filtersPage().goToFilter(CONSTANTS.TASK_FILTERS.MY_TASKS);
            await taskPage.filtersPage().checkFilterIsHighlighted(CONSTANTS.TASK_FILTERS.MY_TASKS);
            await taskPage.tasksListPage().checkTaskListIsLoaded();
            await taskPage.tasksListPage().checkContentIsNotDisplayed(app.userTasks.candidateTask);

            await taskPage.filtersPage().goToFilter(CONSTANTS.TASK_FILTERS.QUE_TASKS);
            await taskPage.filtersPage().checkFilterIsHighlighted(CONSTANTS.TASK_FILTERS.QUE_TASKS);
            await taskPage.tasksListPage().checkTaskListIsLoaded();
            await taskPage.tasksListPage().checkContentIsDisplayed(app.userTasks.candidateTask);
            await taskPage.tasksListPage().selectRow(app.userTasks.candidateTask);
            await taskPage.taskDetails().claimTask();

            await taskPage.filtersPage().goToFilter(CONSTANTS.TASK_FILTERS.INV_TASKS);
            await taskPage.filtersPage().checkFilterIsHighlighted(CONSTANTS.TASK_FILTERS.INV_TASKS);
            await taskPage.tasksListPage().checkTaskListIsLoaded();
            await taskPage.tasksListPage().checkContentIsDisplayed(app.userTasks.candidateTask);
            await taskPage.taskDetails().checkReleaseEnabled();

            await taskPage.filtersPage().goToFilter(CONSTANTS.TASK_FILTERS.MY_TASKS);
            await taskPage.filtersPage().checkFilterIsHighlighted(CONSTANTS.TASK_FILTERS.MY_TASKS);
            await taskPage.tasksListPage().checkTaskListIsLoaded();
            await taskPage.tasksListPage().checkContentIsDisplayed(app.userTasks.candidateTask);
            await taskPage.taskDetails().checkReleaseEnabled();

            await taskPage.filtersPage().goToFilter(CONSTANTS.TASK_FILTERS.QUE_TASKS);
            await taskPage.filtersPage().checkFilterIsHighlighted(CONSTANTS.TASK_FILTERS.QUE_TASKS);
            await taskPage.tasksListPage().checkTaskListIsLoaded();
            await taskPage.tasksListPage().checkContentIsNotDisplayed(app.userTasks.candidateTask);

            await loginPage.login(candidate2.email, candidate2.password);
            await navigationBarPage.navigateToProcessServicesPage();
            await processServicesPage.checkApsContainer();
            await processServicesPage.goToApp('Task App');
            await taskPage.tasksListPage().checkTaskListIsLoaded();

            await taskPage.filtersPage().goToFilter(CONSTANTS.TASK_FILTERS.QUE_TASKS);
            await taskPage.filtersPage().checkFilterIsHighlighted(CONSTANTS.TASK_FILTERS.QUE_TASKS);
            await taskPage.tasksListPage().checkTaskListIsLoaded();
            await taskPage.tasksListPage().checkContentIsNotDisplayed(app.userTasks.candidateTask);

            await loginPage.login(candidate1.email, candidate1.password);
            await navigationBarPage.navigateToProcessServicesPage();
            await processServicesPage.checkApsContainer();
            await processServicesPage.goToApp('Task App');
            await taskPage.tasksListPage().checkTaskListIsLoaded();

            await taskPage.filtersPage().goToFilter(CONSTANTS.TASK_FILTERS.MY_TASKS);
            await taskPage.filtersPage().checkFilterIsHighlighted(CONSTANTS.TASK_FILTERS.MY_TASKS);
            await taskPage.tasksListPage().checkTaskListIsLoaded();
            await taskPage.tasksListPage().checkContentIsDisplayed(app.userTasks.candidateTask);
            await taskPage.tasksListPage().selectRow(app.userTasks.candidateTask);
            await taskPage.taskDetails().releaseTask();

            await taskPage.filtersPage().goToFilter(CONSTANTS.TASK_FILTERS.INV_TASKS);
            await taskPage.filtersPage().checkFilterIsHighlighted(CONSTANTS.TASK_FILTERS.INV_TASKS);
            await taskPage.tasksListPage().checkTaskListIsLoaded();
            await taskPage.tasksListPage().checkContentIsNotDisplayed(app.userTasks.candidateTask);

            await taskPage.filtersPage().goToFilter(CONSTANTS.TASK_FILTERS.MY_TASKS);
            await taskPage.filtersPage().checkFilterIsHighlighted(CONSTANTS.TASK_FILTERS.MY_TASKS);
            await taskPage.tasksListPage().checkTaskListIsLoaded();
            await taskPage.tasksListPage().checkContentIsNotDisplayed(app.userTasks.candidateTask);

            await taskPage.filtersPage().goToFilter(CONSTANTS.TASK_FILTERS.QUE_TASKS);
            await taskPage.filtersPage().checkFilterIsHighlighted(CONSTANTS.TASK_FILTERS.QUE_TASKS);
            await taskPage.tasksListPage().checkContentIsDisplayed(app.userTasks.candidateTask);
            await taskPage.taskDetails().checkClaimEnabled();

            await loginPage.login(candidate2.email, candidate2.password);
            await navigationBarPage.navigateToProcessServicesPage();
            await processServicesPage.checkApsContainer();
            await processServicesPage.goToApp('Task App');
            await taskPage.tasksListPage().checkTaskListIsLoaded();

            await taskPage.filtersPage().goToFilter(CONSTANTS.TASK_FILTERS.QUE_TASKS);
            await taskPage.filtersPage().checkFilterIsHighlighted(CONSTANTS.TASK_FILTERS.QUE_TASKS);
            await taskPage.tasksListPage().checkTaskListIsLoaded();
            await taskPage.tasksListPage().checkContentIsDisplayed(app.userTasks.candidateTask);
            await taskPage.taskDetails().checkClaimEnabled();
        });
    });
});
