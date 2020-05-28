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

import { LoginSSOPage, PaginationPage, ApplicationsUtil, ProcessUtil, ApiService } from '@alfresco/adf-testing';
import { browser } from 'protractor';
import { UsersActions } from '../actions/users.actions';
import { NavigationBarPage } from '../pages/adf/navigation-bar.page';
import { ProcessDetailsPage } from '../pages/adf/process-services/process-details.page';
import { ProcessFiltersPage } from '../pages/adf/process-services/process-filters.page';

describe('Process List - Pagination when adding processes', () => {

    const itemsPerPage = {
        fifteen: '15',
        fifteenValue: 15
    };

    const loginPage = new LoginSSOPage();
    const paginationPage = new PaginationPage();
    const processFiltersPage = new ProcessFiltersPage();
    const processDetailsPage = new ProcessDetailsPage();
    const alfrescoJsApi = new ApiService().apiService;

    let processUserModel;
    const app = browser.params.resources.Files.SIMPLE_APP_WITH_USER_FORM;
    const nrOfProcesses = 25;
    let page, totalPages;
    let i;
    let resultApp;

    beforeAll(async () => {
        const users = new UsersActions();

        await alfrescoJsApi.login(browser.params.testConfig.admin.email, browser.params.testConfig.admin.password);

        processUserModel = await users.createTenantAndUser(alfrescoJsApi);

        await alfrescoJsApi.login(processUserModel.email, processUserModel.password);

        const applicationsService = new ApplicationsUtil(alfrescoJsApi);

        resultApp = await applicationsService.importPublishDeployApp(app.file_path);

        const processUtil = new ProcessUtil(alfrescoJsApi);
        for (i = 0; i < (nrOfProcesses - 5); i++) {
            await processUtil.startProcessOfApp(resultApp.name);
        }

        await loginPage.login(processUserModel.email, processUserModel.password);

        await (await (await new NavigationBarPage().navigateToProcessServicesPage()).goToTaskApp()).clickProcessButton();
   });

    it('[C261046] Should keep Items per page after adding processes', async () => {
        await processDetailsPage.checkProcessTitleIsDisplayed();
        await processFiltersPage.waitForTableBody();
        totalPages = 2;
        page = 1;

        await paginationPage.selectItemsPerPage(itemsPerPage.fifteen);
        await processDetailsPage.checkProcessTitleIsDisplayed();
        await processFiltersPage.waitForTableBody();

        await expect(await paginationPage.getCurrentPage()).toEqual('Page ' + page);
        await expect(await paginationPage.getTotalPages()).toEqual('of ' + totalPages);
        await expect(await paginationPage.getCurrentItemsPerPage()).toEqual(itemsPerPage.fifteen);
        await expect(await paginationPage.getPaginationRange()).toEqual('Showing 1-' + itemsPerPage.fifteenValue * page + ' of ' + (nrOfProcesses - 5));
        await expect(await processFiltersPage.numberOfProcessRows()).toBe(itemsPerPage.fifteenValue);
        await paginationPage.checkNextPageButtonIsEnabled();
        await paginationPage.checkPreviousPageButtonIsDisabled();

        const processUtil = new ProcessUtil(alfrescoJsApi);
        for (i; i < nrOfProcesses; i++) {
            await processUtil.startProcessOfApp(resultApp.name);
        }

        page++;
        await paginationPage.clickOnNextPage();
        await processDetailsPage.checkProcessTitleIsDisplayed();
        await processFiltersPage.waitForTableBody();
        await expect(await paginationPage.getCurrentPage()).toEqual('Page ' + page);
        await expect(await paginationPage.getTotalPages()).toEqual('of ' + totalPages);
        await expect(await paginationPage.getCurrentItemsPerPage()).toEqual(itemsPerPage.fifteen);
        await expect(await paginationPage.getPaginationRange()).toEqual('Showing 16-' + nrOfProcesses + ' of ' + nrOfProcesses);
        await expect(await processFiltersPage.numberOfProcessRows()).toBe(nrOfProcesses - itemsPerPage.fifteenValue);
        await paginationPage.checkNextPageButtonIsDisabled();
        await paginationPage.checkPreviousPageButtonIsEnabled();
    });
});
