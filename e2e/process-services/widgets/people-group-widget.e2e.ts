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
import { LoginSSOPage, StringUtil, Widget, ApplicationsUtil, ApiService } from '@alfresco/adf-testing';
import { TasksPage } from '../../pages/adf/process-services/tasks.page';
import { browser } from 'protractor';
import { NavigationBarPage } from '../../pages/adf/navigation-bar.page';
import CONSTANTS = require('../../util/constants');
import { UserRepresentation } from '@alfresco/js-api';

describe('People and Group widget', () => {

    const loginPage = new LoginSSOPage();
    const taskPage = new TasksPage();
    const navigationBarPage = new NavigationBarPage();
    const widget = new Widget();
    const alfrescoJsApi = new ApiService().apiService;
    const usersActions = new UsersActions(alfrescoJsApi);

    const app = browser.params.resources.Files.MORE_WIDGETS;
    let user: UserRepresentation;

    beforeAll(async () => {
        await alfrescoJsApi.login(browser.params.testConfig.admin.email, browser.params.testConfig.admin.password);

        user = await usersActions.createTenantAndUser();
        await createGroupAndUsers(user.tenantId);
        await alfrescoJsApi.login(user.email, user.password);

        try {
            const applicationsService = new ApplicationsUtil(alfrescoJsApi);
            await applicationsService.importPublishDeployApp(app.file_path, { renewIdmEntries: true });
        } catch (e) { console.error('failed to deploy the application'); }

        await loginPage.login(user.email, user.password);
    });

    beforeEach(async () => {
        await (await navigationBarPage.navigateToProcessServicesPage()).goToTaskApp();
        await taskPage.tasksListPage().checkTaskListIsLoaded();
    });

    it('[C275715] Add group widget - Visibility and group restriction', async () => {
        const name = 'group visibility task';
        const groupVisibilityForm = app.ADD_GROUP_VISIBILITY;
        await taskPage.createTask({name, formName: groupVisibilityForm.formName});
        await expect(await taskPage.taskDetails().getTitle()).toEqual('Activities');

        await taskPage.formFields().checkWidgetIsHidden(groupVisibilityForm.FIELD.widget_id);
        await widget.checkboxWidget().clickCheckboxInput(groupVisibilityForm.FIELD.checkbox_id);
        await taskPage.formFields().checkWidgetIsVisible(groupVisibilityForm.FIELD.widget_id);

        await widget.groupWidget().insertGroup(groupVisibilityForm.FIELD.widget_id, groupVisibilityForm.searchTerm);
        await widget.groupWidget().checkDropDownListIsDisplayed();
        const suggestions = await widget.groupWidget().getDropDownList();
        await expect(suggestions.sort()).toEqual([ 'Heros', 'Users' ]);
        await widget.groupWidget().selectGroupFromDropDown('Users');
        await taskPage.taskDetails().clickCompleteFormTask();
    });

    it('[C275716] Add group widget - sub group restrictions', async () => {
        const name = 'group widget - subgroup restriction';
        const subgroupFrom = app.ADD_GROUP_AND_SUBGROUP_RESTRICTION;
        await taskPage.createTask({name, formName: subgroupFrom.formName});
        await expect(await taskPage.taskDetails().getTitle()).toEqual('Activities');

        await taskPage.formFields().checkWidgetIsHidden(subgroupFrom.FIELD.widget_id);
        await widget.checkboxWidget().clickCheckboxInput(subgroupFrom.FIELD.checkbox_id);
        await taskPage.formFields().checkWidgetIsVisible(subgroupFrom.FIELD.widget_id);

        await widget.groupWidget().insertGroup(subgroupFrom.FIELD.widget_id, subgroupFrom.searchTerm);
        await widget.groupWidget().checkDropDownListIsDisplayed();
        const suggestions = await widget.groupWidget().getDropDownList();
        await expect(suggestions.sort()).toEqual(getSubGroupsName().sort());
        await widget.groupWidget().selectGroupFromDropDown(getSubGroupsName()[0]);
        await taskPage.taskDetails().clickCompleteFormTask();

        await taskPage.filtersPage().goToFilter(CONSTANTS.TASK_FILTERS.COMPLETED_TASKS);
        await taskPage.tasksListPage().checkTaskListIsLoaded();

        await taskPage.tasksListPage().selectRow(name);
        await widget.groupWidget().checkGroupFieldIsDisplayed();
        await expect(await widget.groupWidget().getFieldValue(subgroupFrom.FIELD.widget_id)).toBe('Heros');
    });

    it('[C275714] Add people widget - group restrictions', async () => {
        const name = 'people widget - group restrictions';
        const peopleWidget = app.ADD_PEOPLE_AND_GROUP_RESTRICTION;
        await taskPage.createTask({name, formName: peopleWidget.formName});
        await expect(await taskPage.taskDetails().getTitle()).toEqual('Activities');

        await taskPage.formFields().checkWidgetIsHidden(peopleWidget.FIELD.widget_id);
        await widget.checkboxWidget().clickCheckboxInput(peopleWidget.FIELD.checkbox_id);
        await taskPage.formFields().checkWidgetIsVisible(peopleWidget.FIELD.widget_id);

        await widget.peopleWidget().insertUser(peopleWidget.FIELD.widget_id, peopleWidget.searchTerm);
        await widget.peopleWidget().checkDropDownListIsDisplayed();
        const suggestions = await widget.peopleWidget().getDropDownList();
        await expect(suggestions.sort()).toEqual(getGroupMembers().sort());
        await widget.peopleWidget().selectUserFromDropDown(getGroupMembers()[0]);
        await taskPage.taskDetails().clickCompleteFormTask();
    });

    async function createGroupAndUsers(tenantId) {
        await alfrescoJsApi.login(browser.params.testConfig.admin.email, browser.params.testConfig.admin.password);

        try {
            const happyUsers: any[] = await Promise.all(app.groupUser.map(happyUser =>
                usersActions.createApsUser(tenantId, StringUtil.generateRandomString(), happyUser.firstName, happyUser.lastName)));
            const subgroupUser = await usersActions.createApsUser(
                 tenantId, StringUtil.generateRandomString(), app.subGroupUser.firstName, app.subGroupUser.lastName);

            const group = await alfrescoJsApi.activiti.adminGroupsApi.createNewGroup({ name: app.group.name, tenantId, type: 1 });
            await  Promise.all(happyUsers.map(happyUser => alfrescoJsApi.activiti.adminGroupsApi.addGroupMember(group.id, happyUser.id)));

            const subgroups: any[] = await Promise.all(getSubGroupsName().map((name) =>
                alfrescoJsApi.activiti.adminGroupsApi.createNewGroup({ name, tenantId , type: 1, parentGroupId: group.id })));
            await Promise.all(subgroups.map((subgroup) => alfrescoJsApi.activiti.adminGroupsApi.addGroupMember(subgroup.id, subgroupUser.id)));

        } catch (e) {}
    }

    function getSubGroupsName() {
        return app.group.subgroup.map(subgroup => subgroup.name);
    }

    function getGroupMembers() {
        return app.groupUser.map(groupUser => `${groupUser.firstName} ${groupUser.lastName}`);
    }
});
