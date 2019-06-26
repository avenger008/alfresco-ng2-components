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
import { ApiService, IdentityService, LoginSSOPage, SettingsPage, LocalStorageUtil, ApplicationsService } from '@alfresco/adf-testing';
import { AppListCloudPage } from '@alfresco/adf-testing';
import { NavigationBarPage } from '../pages/adf/navigationBarPage';
import resources = require('../util/resources');

describe('Applications list', () => {

    const loginSSOPage = new LoginSSOPage();
    const navigationBarPage = new NavigationBarPage();
    const settingsPage = new SettingsPage();
    const appListCloudPage = new AppListCloudPage();
    const simpleApp = resources.ACTIVITI7_APPS.SIMPLE_APP.name;
    let identityService: IdentityService;
    let applicationsService: ApplicationsService;
    let testUser;
    const appNames = [];
    let applications;
    const apiService = new ApiService(browser.params.config.oauth2.clientId, browser.params.config.bpmHost, browser.params.config.oauth2.host, 'BPM');

    beforeAll(async (done) => {
        await apiService.login(browser.params.identityAdmin.email, browser.params.identityAdmin.password);
        identityService = new IdentityService(apiService);
        testUser = await identityService.createIdentityUserWithRole(apiService, [identityService.ROLES.APS_USER, identityService.ROLES.APS_DEVOPS_USER]);
        await settingsPage.setProviderBpmSso(
            browser.params.config.bpmHost,
            browser.params.config.oauth2.host,
            browser.params.config.identityHost);
        loginSSOPage.loginSSOIdentityService(testUser.email, testUser.password);
        await apiService.login(testUser.email, testUser.password);
        applicationsService = new ApplicationsService(apiService);
        applications = await applicationsService.getApplicationsByStatus('RUNNING');

        applications.list.entries.forEach(async (app) => {
            appNames.push(app.entry.name.toLowerCase());
        });

        await LocalStorageUtil.setConfigField('alfresco-deployed-apps', '[]');

        done();
    });

    afterAll(async(done) => {
        await apiService.login(browser.params.identityAdmin.email, browser.params.identityAdmin.password);
        await identityService.deleteIdentityUser(testUser.idIdentityService);
        done();
    });

    it('[C310373] Should all the app with running state be displayed on dashboard when alfresco-deployed-apps is not used in config file', async () => {
        navigationBarPage.navigateToProcessServicesCloudPage();
        appListCloudPage.checkApsContainer();

        appListCloudPage.getNameOfTheApplications().then((list) => {
            expect(JSON.stringify(list) === JSON.stringify(appNames)).toEqual(true);
        });
    });

    it('[C289910] Should the app be displayed on dashboard when is deployed on APS', () => {
        browser.refresh();
        navigationBarPage.navigateToProcessServicesCloudPage();
        appListCloudPage.checkApsContainer();

        appListCloudPage.checkAppIsDisplayed(simpleApp);
        appListCloudPage.checkAppIsDisplayed(resources.ACTIVITI7_APPS.CANDIDATE_BASE_APP.name);
        appListCloudPage.checkAppIsDisplayed(resources.ACTIVITI7_APPS.SUB_PROCESS_APP.name);

        expect(appListCloudPage.countAllApps()).toEqual(3);
    });
});
