/*!
 * @license
 * Copyright 2016 Alfresco Software, Ltd.
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

import { by } from 'protractor';

import { LoginPage } from '../pages/adf/loginPage';
import { ProcessServicesPage } from '../pages/adf/process_services/processServicesPage';
import { TasksPage } from '../pages/adf/process_services/tasksPage';
import { AttachmentListPage } from '../pages/adf/process_services/attachmentListPage';
import { AppNavigationBarPage } from '../pages/adf/process_services/appNavigationBarPage';

import Task = require('../models/APS/Task');
import Tenant = require('../models/APS/Tenant');

import TaskModel = require('../models/APS/TaskModel');
import FileModel = require('../models/ACS/fileModel');
import FormModel = require('../models/APS/FormModel');

import TestConfig = require('../test.config');
import resources = require('../util/resources');

import dateFormat = require('dateformat');

import AlfrescoApi = require('alfresco-js-api-node');
import { AppsActions } from '../actions/APS/apps.actions';
import { UsersActions } from '../actions/users.actions';

import CONSTANTS = require('../util/constants');

describe('Start Task - Custom App', () => {

    let TASKDATAFORMAT = 'mmm dd yyyy';

    let loginPage = new LoginPage();
    let processServicesPage = new ProcessServicesPage();
    let attachmentListPage = new AttachmentListPage();
    let appNavigationBarPage = new AppNavigationBarPage();

    let processUserModel, assigneeUserModel;
    let app = resources.Files.SIMPLE_APP_WITH_USER_FORM;
    let formTextField = app.form_fields.form_fieldId;
    let formFieldValue = 'First value ';
    let taskPage = new TasksPage();
    let firstComment = 'comm1', firstChecklist = 'checklist1';
    let tasks = ['Modifying task', 'Information box', 'No form', 'Not Created', 'Refreshing form', 'Assignee task', 'Attach File', 'Spinner'];
    let showHeaderTask = 'Show Header';
    let appModel;
    let pngFile = new FileModel({
        'location': resources.Files.ADF_DOCUMENTS.PNG.file_location,
        'name': resources.Files.ADF_DOCUMENTS.PNG.file_name
    });

    beforeAll(async (done) => {
        let apps = new AppsActions();
        let users = new UsersActions();

        this.alfrescoJsApi = new AlfrescoApi({
            provider: 'BPM',
            hostBpm: TestConfig.adf.url
        });

        await this.alfrescoJsApi.login(TestConfig.adf.adminEmail, TestConfig.adf.adminPassword);

        let newTenant = await this.alfrescoJsApi.activiti.adminTenantsApi.createTenant(new Tenant());

        assigneeUserModel = await users.createApsUser(this.alfrescoJsApi, newTenant.id);

        processUserModel = await users.createApsUser(this.alfrescoJsApi, newTenant.id);

        await this.alfrescoJsApi.login(processUserModel.email, processUserModel.password);

        appModel = await apps.importPublishDeployApp(this.alfrescoJsApi, app.file_location);

        loginPage.loginToProcessServicesUsingUserModel(processUserModel);

        done();
    });

    it('[C263942] Should be possible to modify a task', () => {
        processServicesPage
            .goToProcessServices()
            .goToApp(appModel.name)
            .clickTasksButton();

        taskPage
            .filtersPage()
            .goToFilter(CONSTANTS.TASKFILTERS.MY_TASKS);

        taskPage
            .createNewTask()
            .addName(tasks[0])
            .addForm(app.formName).clickStartButton()
            .then(() => {
                taskPage
                    .tasksListPage()
                    .checkTaskIsDisplayedInTasksList(tasks[0]);

                taskPage
                    .taskDetails()
                    .clickInvolvePeopleButton()
                    .typeUser(assigneeUserModel.firstName + ' ' + assigneeUserModel.lastName)
                    .selectUserToInvolve(assigneeUserModel.firstName + ' ' + assigneeUserModel.lastName)
                    .checkUserIsSelected(assigneeUserModel.firstName + ' ' + assigneeUserModel.lastName);

                taskPage
                    .taskDetails()
                    .clickAddInvolvedUserButton();

                expect(taskPage.taskDetails().getInvolvedUserEmail(assigneeUserModel.firstName + ' ' + assigneeUserModel.lastName)).toEqual(assigneeUserModel.email);

                taskPage
                    .taskDetails()
                    .selectActivityTab()
                    .addComment(firstComment)
                    .checkCommentIsDisplayed(firstComment);

                taskPage
                    .clickOnAddChecklistButton()
                    .addName(firstChecklist)
                    .clickCreateChecklistButton();

                taskPage
                    .checkChecklistIsDisplayed(firstChecklist);

                taskPage
                    .taskDetails()
                    .selectDetailsTab();
            });
    });

    it('[C263946] Should display information box for started task', () => {
        processServicesPage.goToProcessServices().goToApp(appModel.name).clickTasksButton();
        taskPage.filtersPage().goToFilter(CONSTANTS.TASKFILTERS.MY_TASKS);
        taskPage.createNewTask().addName(tasks[1]).addDescription('Description')
            .addForm(app.formName).clickStartButton()
            .then(() => {
                expect(taskPage.taskDetails().getTitle()).toEqual('Activities');
            })
            .then(() => {
                return this.alfrescoJsApi.activiti.taskApi.listTasks(new Task({ sort: 'created-desc' }));
            })
            .then((response) => {
                let taskModel = new TaskModel(response.data[0]);
                taskPage.tasksListPage().checkTaskIsDisplayedInTasksList(taskModel.getName());

                expect(taskPage.taskDetails().getCreated()).toEqual(dateFormat(taskModel.getCreated(), TASKDATAFORMAT));
                expect(taskPage.taskDetails().getId()).toEqual(taskModel.getId());
                expect(taskPage.taskDetails().getDescription()).toEqual(taskModel.getDescription());
                expect(taskPage.taskDetails().getAssignee()).toEqual(taskModel.getAssignee().getEntireName());
                expect(taskPage.taskDetails().getCategory())
                    .toEqual(taskModel.getCategory() === null ? CONSTANTS.TASKDETAILS.NO_CATEGORY : taskModel.getCategory());
                expect(taskPage.taskDetails().getDueDate())
                    .toEqual(taskModel.getDueDate() === null ? CONSTANTS.TASKDETAILS.NO_DATE : taskModel.getDueDate());
                expect(taskPage.taskDetails().getParentName())
                    .toEqual(taskModel.getParentTaskName() === null ? CONSTANTS.TASKDETAILS.NO_PARENT : taskModel.getParentTaskName());
                expect(taskPage.taskDetails().getStatus()).toEqual(CONSTANTS.TASKSTATUS.RUNNING);

                return this.alfrescoJsApi.activiti.taskFormsApi.getTaskForm(response.data[0].id);
            })
            .then((response) => {
                let formModel = new FormModel(response);
                expect(taskPage.taskDetails().getFormName())
                    .toEqual(formModel.getName() === null ? CONSTANTS.TASKDETAILS.NO_FORM : formModel.getName());
            });
    });

    it('[C263947] Should be able to start a task without form', () => {
        processServicesPage
            .goToProcessServices()
            .goToApp(appModel.name)
            .clickTasksButton();

        taskPage
            .filtersPage()
            .goToFilter(CONSTANTS.TASKFILTERS.MY_TASKS);

        taskPage
            .createNewTask()
            .addName(tasks[2])
            .clickStartButton();

        taskPage
            .tasksListPage()
            .checkTaskIsDisplayedInTasksList(tasks[2]);

        taskPage
            .formFields()
            .noFormIsDisplayed();

        expect(taskPage.taskDetails().getFormName()).toEqual(CONSTANTS.TASKDETAILS.NO_FORM);
    });

    it('[C263948] Should be possible to cancel a task', () => {
        processServicesPage.goToProcessServices()
            .goToApp(appModel.name)
            .clickTasksButton();

        taskPage
            .filtersPage()
            .goToFilter(CONSTANTS.TASKFILTERS.MY_TASKS);

        taskPage
            .createNewTask()
            .checkStartButtonIsDisabled()
            .addName(tasks[3])
            .checkStartButtonIsEnabled()
            .clickCancelButton();

        taskPage.tasksListPage()
            .checkTaskIsNotDisplayedInTasksList(tasks[3]);

        expect(taskPage.filtersPage().getActiveFilter()).toEqual(CONSTANTS.TASKFILTERS.MY_TASKS);
    });

    it('[C263949] Should be possible to save filled form', () => {
        processServicesPage.goToProcessServices().goToApp(appModel.name).clickTasksButton();
        taskPage.filtersPage()
            .goToFilter(CONSTANTS.TASKFILTERS.MY_TASKS);

        taskPage.createNewTask()
            .addForm(app.formName)
            .addName(tasks[4])
            .clickStartButton();

        taskPage
            .tasksListPage()
            .checkTaskIsDisplayedInTasksList(tasks[4]);

        expect(taskPage.formFields()
            .setFieldValue(by.id, formTextField, formFieldValue)
            .getFieldValue(formTextField)).toEqual(formFieldValue);

        taskPage
            .formFields()
            .refreshForm()
            .checkFieldValue(by.id, formTextField, '');

        taskPage
            .tasksListPage()
            .checkTaskIsDisplayedInTasksList(tasks[4]);

        taskPage
            .formFields()
            .setFieldValue(by.id, formTextField, formFieldValue)
            .checkFieldValue(by.id, formTextField, formFieldValue);

        taskPage
            .formFields()
            .saveForm()
            .checkFieldValue(by.id, formTextField, formFieldValue);
    });

    it('[C263951] Should be possible to assign a user', () => {
        processServicesPage.goToProcessServices().goToApp(appModel.name).clickTasksButton();
        taskPage
            .filtersPage()
            .goToFilter(CONSTANTS.TASKFILTERS.MY_TASKS);

        taskPage
            .createNewTask()
            .addName(tasks[5])
            .addAssignee(assigneeUserModel.firstName)
            .clickStartButton();

        taskPage
            .tasksListPage()
            .checkTaskListIsLoaded();

        taskPage
            .tasksListPage()
            .waitForTableBody();

        taskPage
            .filtersPage()
            .goToFilter(CONSTANTS.TASKFILTERS.INV_TASKS);

        taskPage.tasksListPage()
            .checkTaskIsDisplayedInTasksList(tasks[5])
            .selectTaskFromTasksList(tasks[5]);

        taskPage.checkTaskTitle(tasks[5]);

        expect(taskPage.taskDetails().getAssignee()).toEqual(assigneeUserModel.firstName + ' ' + assigneeUserModel.lastName);
    });

    it('Attach a file', () => {
        processServicesPage.goToProcessServices().goToApp(appModel.name).clickTasksButton();
        taskPage.filtersPage().goToFilter(CONSTANTS.TASKFILTERS.MY_TASKS);
        taskPage
            .createNewTask()
            .addName(tasks[6])
            .clickStartButton();

        attachmentListPage.clickAttachFileButton(pngFile.location);
        attachmentListPage.checkFileIsAttached(pngFile.name);
    });

    it('[C263945] Should Information box be hidden when showHeaderContent property is set on false on custom app', () => {
        processServicesPage.goToProcessServices().goToApp(appModel.name).clickTasksButton();
        taskPage.filtersPage().goToFilter(CONSTANTS.TASKFILTERS.MY_TASKS);
        taskPage.createNewTask().addName(showHeaderTask).clickStartButton();
        taskPage.tasksListPage().checkTaskIsDisplayedInTasksList(showHeaderTask).selectTaskFromTasksList(showHeaderTask);

        appNavigationBarPage.clickSettingsButton();
        taskPage.taskDetails().appSettingsToggles().disableShowHeader();
        appNavigationBarPage.clickTasksButton();

        taskPage.taskDetails().taskInfoDrawerIsNotDisplayed();

        appNavigationBarPage.clickSettingsButton();
        taskPage.taskDetails().appSettingsToggles().enableShowHeader();
        appNavigationBarPage.clickTasksButton();

        taskPage.taskDetails().taskInfoDrawerIsDisplayed();
    });

    it('[C263950] Should be able to see Spinner loading on task list when clicking on Tasks on custom app', () => {
        processServicesPage.goToProcessServices().goToApp(appModel.name).clickTasksButton();
        taskPage.filtersPage().goToFilter(CONSTANTS.TASKFILTERS.MY_TASKS);
        taskPage.createNewTask().addName(tasks[7]).clickStartButton();

        processServicesPage.goToProcessServices().goToTaskApp();
        taskPage.tasksListPage().checkSpinnerIsDisplayed();
    });

});
