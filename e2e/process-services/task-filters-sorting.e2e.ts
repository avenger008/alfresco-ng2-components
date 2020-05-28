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

import { LoginSSOPage, ApplicationsUtil, ApiService } from '@alfresco/adf-testing';
import { NavigationBarPage } from '../pages/adf/navigation-bar.page';
import { ProcessServicesPage } from '../pages/adf/process-services/process-services.page';
import { TasksPage } from '../pages/adf/process-services/tasks.page';
import { TasksListPage } from '../pages/adf/process-services/tasks-list.page';
import { TaskDetailsPage } from '../pages/adf/process-services/task-details.page';
import { TaskFiltersDemoPage } from '../pages/adf/demo-shell/process-services/task-filters-demo.page';
import { UserProcessInstanceFilterRepresentation } from '@alfresco/js-api';
import { UsersActions } from '../actions/users.actions';
import { browser } from 'protractor';

describe('Task Filters Sorting', () => {

    const loginPage = new LoginSSOPage();
    const navigationBarPage = new NavigationBarPage();
    const processServicesPage = new ProcessServicesPage();
    const tasksPage = new TasksPage();
    const tasksListPage = new TasksListPage();
    const taskDetailsPage = new TaskDetailsPage();
    const taskFiltersDemoPage = new TaskFiltersDemoPage();
    const alfrescoJsApi = new ApiService().apiService;

    let user;
    let appId;

    const app = browser.params.resources.Files.APP_WITH_PROCESSES;

    const tasks = [
        { name: 'Task 1 Completed', dueDate: '01/01/2019' },
        { name: 'Task 2 Completed', dueDate: '02/01/2019' },
        { name: 'Task 3 Completed', dueDate: '03/01/2019' },
        { name: 'Task 4', dueDate: '01/01/2019' },
        { name: 'Task 5', dueDate: '02/01/2019' },
        { name: 'Task 6', dueDate: '03/01/2019' }];

    beforeAll(async () => {
        const users = new UsersActions();

        await alfrescoJsApi.login(browser.params.testConfig.admin.email, browser.params.testConfig.admin.password);
        user = await users.createTenantAndUser(alfrescoJsApi);

        await alfrescoJsApi.login(user.email, user.password);
        const applicationsService = new ApplicationsUtil(alfrescoJsApi);
        const importedApp = await applicationsService.importPublishDeployApp(app.file_path);
        const appDefinitions = await alfrescoJsApi.activiti.appsApi.getAppDefinitions();
        appId = appDefinitions.data.find((currentApp) => currentApp.modelId === importedApp.id).id;

        await loginPage.login(user.email, user.password);
        await navigationBarPage.navigateToProcessServicesPage();
        await processServicesPage.checkApsContainer();
        await processServicesPage.goToApp(app.title);

        await tasksPage.createTask({name: tasks[0].name, dueDate: tasks[0].dueDate});
        await taskDetailsPage.clickCompleteTask();

        await tasksPage.createTask({name: tasks[1].name, dueDate: tasks[1].dueDate});
        await taskDetailsPage.clickCompleteTask();

        await tasksPage.createTask({name: tasks[2].name, dueDate: tasks[2].dueDate});
        await taskDetailsPage.clickCompleteTask();

        await tasksPage.createTask({name: tasks[3].name, dueDate: tasks[3].dueDate});
        await tasksPage.createTask({name: tasks[4].name, dueDate: tasks[4].dueDate});
        await tasksPage.createTask({name: tasks[5].name, dueDate: tasks[5].dueDate});
    });

    afterAll( async () => {
        await alfrescoJsApi.login(browser.params.testConfig.admin.email, browser.params.testConfig.admin.password);
        await alfrescoJsApi.activiti.adminTenantsApi.deleteTenant(user.tenantId);
    });

    it('[C277254] Should display tasks under new filter from newest to oldest when they are completed', async () => {
        const newFilter = new UserProcessInstanceFilterRepresentation({
            appId,
            name : 'Newest first',
            icon: 'glyphicon-filter',
            filter: { sort: 'created-desc', state: 'completed', assignment: 'involved' }
        });
        await alfrescoJsApi.activiti.userFiltersApi.createUserTaskFilter(newFilter);

        await browser.refresh();
        await taskFiltersDemoPage.customTaskFilter(newFilter.name).clickTaskFilter();

        await expect(await tasksListPage.getDataTable().contentInPosition(1)).toBe(tasks[2].name);
        await expect(await tasksListPage.getDataTable().contentInPosition(2)).toBe(tasks[1].name);
        await expect(await tasksListPage.getDataTable().contentInPosition(3)).toBe(tasks[0].name);
   });

    it('[C277255] Should display tasks under new filter from oldest to newest when they are completed', async () => {
        const newFilter = new UserProcessInstanceFilterRepresentation({
            appId,
            name : 'Newest last',
            icon: 'glyphicon-filter',
            filter: { sort: 'created-asc', state: 'completed', assignment: 'involved' }
        });
        await alfrescoJsApi.activiti.userFiltersApi.createUserTaskFilter(newFilter);

        await browser.refresh();
        await taskFiltersDemoPage.customTaskFilter(newFilter.name).clickTaskFilter();

        await expect(await tasksListPage.getDataTable().contentInPosition(1)).toBe(tasks[0].name);
        await expect(await tasksListPage.getDataTable().contentInPosition(2)).toBe(tasks[1].name);
        await expect(await tasksListPage.getDataTable().contentInPosition(3)).toBe(tasks[2].name);
    });

    it('[C277256] Should display tasks under new filter from closest due date to farthest when they are completed', async () => {
        const newFilter = new UserProcessInstanceFilterRepresentation({
            appId,
            name : 'Due first',
            icon: 'glyphicon-filter',
            filter: { sort: 'due-desc', state: 'completed', assignment: 'involved' }
        });
        await alfrescoJsApi.activiti.userFiltersApi.createUserTaskFilter(newFilter);

        await browser.refresh();
        await taskFiltersDemoPage.customTaskFilter(newFilter.name).clickTaskFilter();

        await expect(await tasksListPage.getDataTable().contentInPosition(1)).toBe(tasks[2].name);
        await expect(await tasksListPage.getDataTable().contentInPosition(2)).toBe(tasks[1].name);
        await expect(await tasksListPage.getDataTable().contentInPosition(3)).toBe(tasks[0].name);
    });

    it('[C277257] Should display tasks under new filter from farthest due date to closest when they are completed', async () => {
        const newFilter = new UserProcessInstanceFilterRepresentation({
            appId,
            name : 'Due last',
            icon: 'glyphicon-filter',
            filter: { sort: 'due-asc', state: 'completed', assignment: 'involved' }
        });
        await alfrescoJsApi.activiti.userFiltersApi.createUserTaskFilter(newFilter);

        await browser.refresh();
        await taskFiltersDemoPage.customTaskFilter(newFilter.name).clickTaskFilter();

        await expect(await tasksListPage.getDataTable().contentInPosition(1)).toBe(tasks[0].name);
        await expect(await tasksListPage.getDataTable().contentInPosition(2)).toBe(tasks[1].name);
        await expect(await tasksListPage.getDataTable().contentInPosition(3)).toBe(tasks[2].name);
    });

    it('[C277258] Should display tasks under new filter from newest to oldest when they are open  ', async () => {
        const newFilter = new UserProcessInstanceFilterRepresentation({
            appId,
            name : 'Newest first Open',
            icon: 'glyphicon-filter',
            filter: { sort: 'created-desc', state: 'open', assignment: 'involved' }
        });
        await alfrescoJsApi.activiti.userFiltersApi.createUserTaskFilter(newFilter);

        await browser.refresh();
        await taskFiltersDemoPage.customTaskFilter(newFilter.name).clickTaskFilter();

        await expect(await tasksListPage.getDataTable().contentInPosition(1)).toBe(tasks[5].name);
        await expect(await tasksListPage.getDataTable().contentInPosition(2)).toBe(tasks[4].name);
        await expect(await tasksListPage.getDataTable().contentInPosition(3)).toBe(tasks[3].name);
    });

    it('[C277259] Should display tasks under new filter from oldest to newest when they are open', async () => {
        const newFilter = new UserProcessInstanceFilterRepresentation({
            appId,
            name : 'Newest last Open',
            icon: 'glyphicon-filter',
            filter: { sort: 'created-asc', state: 'open', assignment: 'involved' }
        });
        await alfrescoJsApi.activiti.userFiltersApi.createUserTaskFilter(newFilter);

        await browser.refresh();
        await taskFiltersDemoPage.customTaskFilter(newFilter.name).clickTaskFilter();

        await expect(await tasksListPage.getDataTable().contentInPosition(1)).toBe(tasks[3].name);
        await expect(await tasksListPage.getDataTable().contentInPosition(2)).toBe(tasks[4].name);
        await expect(await tasksListPage.getDataTable().contentInPosition(3)).toBe(tasks[5].name);
    });

    it('[C277260] Should display tasks under new filter from closest due date to farthest when they are open', async () => {
        const newFilter = new UserProcessInstanceFilterRepresentation({
            appId,
            name : 'Due first Open',
            icon: 'glyphicon-filter',
            filter: { sort: 'due-desc', state: 'open', assignment: 'involved' }
        });
        await alfrescoJsApi.activiti.userFiltersApi.createUserTaskFilter(newFilter);

        await browser.refresh();
        await taskFiltersDemoPage.customTaskFilter(newFilter.name).clickTaskFilter();

        await expect(await tasksListPage.getDataTable().contentInPosition(1)).toBe(tasks[5].name);
        await expect(await tasksListPage.getDataTable().contentInPosition(2)).toBe(tasks[4].name);
        await expect(await tasksListPage.getDataTable().contentInPosition(3)).toBe(tasks[3].name);
    });

    it('[C277261] Should display tasks under new filter from farthest due date to closest when they are open', async () => {
        const newFilter = new UserProcessInstanceFilterRepresentation({
            appId,
            name : 'Due last Open',
            icon: 'glyphicon-filter',
            filter: { sort: 'due-asc', state: 'open', assignment: 'involved' }
        });
        await alfrescoJsApi.activiti.userFiltersApi.createUserTaskFilter(newFilter);

        await browser.refresh();
        await taskFiltersDemoPage.customTaskFilter(newFilter.name).clickTaskFilter();

        await expect(await tasksListPage.getDataTable().contentInPosition(1)).toBe(tasks[3].name);
        await expect(await tasksListPage.getDataTable().contentInPosition(2)).toBe(tasks[4].name);
        await expect(await tasksListPage.getDataTable().contentInPosition(3)).toBe(tasks[5].name);
    });
});
