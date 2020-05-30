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

describe('Process List - Pagination', () => {

    const itemsPerPage = {
        five: '5',
        fiveValue: 5,
        ten: '10',
        tenValue: 10,
        fifteen: '15',
        fifteenValue: 15,
        twenty: '20',
        twentyValue: 20,
        default: '25'
    };

    const processFilterRunning = 'Running';

    const loginPage = new LoginSSOPage();
    const navigationBarPage = new NavigationBarPage();
    const paginationPage = new PaginationPage();
    const processFiltersPage = new ProcessFiltersPage();
    const processDetailsPage = new ProcessDetailsPage();
    let deployedTestApp;
    let processUserModel;
    const app = browser.params.resources.Files.SIMPLE_APP_WITH_USER_FORM;
    const nrOfProcesses = 20;
    let page;
    let totalPages;
    const alfrescoJsApi = new ApiService().apiService;

    beforeAll(async () => {
        const users = new UsersActions(alfrescoJsApi);

        await alfrescoJsApi.login(browser.params.testConfig.admin.email, browser.params.testConfig.admin.password);

        processUserModel = await users.createTenantAndUser();

        await alfrescoJsApi.login(processUserModel.email, processUserModel.password);

        const applicationsService = new ApplicationsUtil(alfrescoJsApi);

        deployedTestApp = await applicationsService.importPublishDeployApp(app.file_path);

        await loginPage.login(processUserModel.email, processUserModel.password);
    });

    describe('With processes Pagination', () => {
        beforeAll(async () => {
            await alfrescoJsApi.login(processUserModel.email, processUserModel.password);

            for (let i = 0; i < nrOfProcesses; i++) {
                await new ProcessUtil(alfrescoJsApi).startProcessOfApp(deployedTestApp.name);
            }
        });

        beforeEach(async () => {
            await (await (await navigationBarPage.navigateToProcessServicesPage()).goToTaskApp()).clickProcessButton();
        });

        it('[C261042] Should display default pagination', async () => {
            page = 1;
            totalPages = 1;
            await processFiltersPage.clickRunningFilterButton();
            await processFiltersPage.checkFilterIsHighlighted(processFilterRunning);
            await processDetailsPage.checkProcessTitleIsDisplayed();
            await processFiltersPage.waitForTableBody();
            await expect(await paginationPage.getCurrentPage()).toEqual('Page ' + page);
            await expect(await paginationPage.getTotalPages()).toEqual('of ' + totalPages);

            await expect(await paginationPage.getCurrentItemsPerPage()).toEqual(itemsPerPage.twenty);
            await expect(await paginationPage.getPaginationRange()).toEqual('Showing 1-' + nrOfProcesses + ' of ' + nrOfProcesses);
            await expect(await processFiltersPage.numberOfProcessRows()).toBe(nrOfProcesses);
            await paginationPage.checkNextPageButtonIsDisabled();
            await paginationPage.checkPreviousPageButtonIsDisabled();
        });

        it('[C261043] Should be possible to Items per page to 15', async () => {
            page = 1;
            totalPages = 2;
            await processFiltersPage.clickRunningFilterButton();
            await processFiltersPage.checkFilterIsHighlighted(processFilterRunning);
            await processDetailsPage.checkProcessTitleIsDisplayed();
            await processFiltersPage.waitForTableBody();
            await paginationPage.selectItemsPerPage(itemsPerPage.fifteen);
            await processDetailsPage.checkProcessTitleIsDisplayed();
            await processFiltersPage.waitForTableBody();
            await expect(await paginationPage.getCurrentPage()).toEqual('Page ' + page);
            await expect(await paginationPage.getTotalPages()).toEqual('of ' + totalPages);
            await expect(await paginationPage.getCurrentItemsPerPage()).toEqual(itemsPerPage.fifteen);
            await expect(await paginationPage.getPaginationRange()).toEqual('Showing 1-' + itemsPerPage.fifteenValue * page + ' of ' + nrOfProcesses);
            await expect(await processFiltersPage.numberOfProcessRows()).toBe(itemsPerPage.fifteenValue);
            await paginationPage.checkNextPageButtonIsEnabled();
            await paginationPage.checkPreviousPageButtonIsDisabled();

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

            page = 1;
            await (await (await navigationBarPage.navigateToProcessServicesPage()).goToTaskApp()).clickProcessButton();
            await processFiltersPage.clickRunningFilterButton();
            await processFiltersPage.checkFilterIsHighlighted(processFilterRunning);
            await processDetailsPage.checkProcessTitleIsDisplayed();
            await processFiltersPage.waitForTableBody();
            await expect(await paginationPage.getCurrentPage()).toEqual('Page ' + page);
            await expect(await paginationPage.getTotalPages()).toEqual('of ' + totalPages);
            await expect(await paginationPage.getCurrentItemsPerPage()).toEqual(itemsPerPage.fifteen);
        });

        it('[C261044] Should be possible to Items per page to 10', async () => {
            page = 1;
            totalPages = 2;
            await processFiltersPage.clickRunningFilterButton();
            await processFiltersPage.checkFilterIsHighlighted(processFilterRunning);
            await processDetailsPage.checkProcessTitleIsDisplayed();
            await processFiltersPage.waitForTableBody();
            await paginationPage.selectItemsPerPage(itemsPerPage.ten);
            await processDetailsPage.checkProcessTitleIsDisplayed();
            await processFiltersPage.waitForTableBody();
            await expect(await paginationPage.getCurrentPage()).toEqual('Page ' + page);
            await expect(await paginationPage.getTotalPages()).toEqual('of ' + totalPages);
            await expect(await paginationPage.getCurrentItemsPerPage()).toEqual(itemsPerPage.ten);
            await expect(await paginationPage.getPaginationRange()).toEqual('Showing 1-' + itemsPerPage.tenValue * page + ' of ' + nrOfProcesses);
            await expect(await processFiltersPage.numberOfProcessRows()).toBe(itemsPerPage.tenValue);
            await paginationPage.checkNextPageButtonIsEnabled();
            await paginationPage.checkPreviousPageButtonIsDisabled();

            page++;
            await paginationPage.clickOnNextPage();
            await processDetailsPage.checkProcessTitleIsDisplayed();
            await processFiltersPage.waitForTableBody();
            await expect(await paginationPage.getCurrentPage()).toEqual('Page ' + page);
            await expect(await paginationPage.getTotalPages()).toEqual('of ' + totalPages);
            await expect(await paginationPage.getCurrentItemsPerPage()).toEqual(itemsPerPage.ten);
            await expect(await paginationPage.getPaginationRange()).toEqual('Showing 11-' + nrOfProcesses + ' of ' + nrOfProcesses);
            await expect(await processFiltersPage.numberOfProcessRows()).toBe(itemsPerPage.tenValue);
            await paginationPage.checkNextPageButtonIsDisabled();
            await paginationPage.checkPreviousPageButtonIsEnabled();

            page = 1;
            await (await (await navigationBarPage.navigateToProcessServicesPage()).goToTaskApp()).clickProcessButton();
            await processFiltersPage.clickRunningFilterButton();
            await processFiltersPage.checkFilterIsHighlighted(processFilterRunning);
            await processDetailsPage.checkProcessTitleIsDisplayed();
            await processFiltersPage.waitForTableBody();
            await expect(await paginationPage.getCurrentPage()).toEqual('Page ' + page);
            await expect(await paginationPage.getTotalPages()).toEqual('of ' + totalPages);
            await expect(await paginationPage.getCurrentItemsPerPage()).toEqual(itemsPerPage.ten);
        });

        it('[C261047] Should be possible to Items per page to 20', async () => {
            page = 1;
            totalPages = 1;
            await processFiltersPage.clickRunningFilterButton();
            await processFiltersPage.checkFilterIsHighlighted(processFilterRunning);
            await processDetailsPage.checkProcessTitleIsDisplayed();
            await processFiltersPage.waitForTableBody();
            await paginationPage.selectItemsPerPage(itemsPerPage.twenty);
            await processDetailsPage.checkProcessTitleIsDisplayed();
            await processFiltersPage.waitForTableBody();
            await expect(await paginationPage.getCurrentPage()).toEqual('Page ' + page);
            await expect(await paginationPage.getTotalPages()).toEqual('of ' + totalPages);
            await expect(await paginationPage.getCurrentItemsPerPage()).toEqual(itemsPerPage.twenty);
            await expect(await paginationPage.getPaginationRange()).toEqual('Showing 1-' + nrOfProcesses + ' of ' + nrOfProcesses);
            await expect(await processFiltersPage.numberOfProcessRows()).toBe(nrOfProcesses);
            await paginationPage.checkNextPageButtonIsDisabled();
            await paginationPage.checkPreviousPageButtonIsDisabled();

            await (await (await navigationBarPage.navigateToProcessServicesPage()).goToTaskApp()).clickProcessButton();
            await processFiltersPage.clickRunningFilterButton();
            await processFiltersPage.checkFilterIsHighlighted(processFilterRunning);
            await processDetailsPage.checkProcessTitleIsDisplayed();
            await processFiltersPage.waitForTableBody();
            await expect(await paginationPage.getCurrentPage()).toEqual('Page ' + page);
            await expect(await paginationPage.getTotalPages()).toEqual('of ' + totalPages);
            await expect(await paginationPage.getCurrentItemsPerPage()).toEqual(itemsPerPage.twenty);
        });

        it('[C261045] Should be possible to Items per page to 5', async () => {
            let showing;
            page = 1;
            totalPages = 4;
            await processFiltersPage.clickRunningFilterButton();
            await processFiltersPage.checkFilterIsHighlighted(processFilterRunning);
            await processDetailsPage.checkProcessTitleIsDisplayed();
            await processFiltersPage.waitForTableBody();
            await paginationPage.selectItemsPerPage(itemsPerPage.five);
            await processDetailsPage.checkProcessTitleIsDisplayed();
            await processFiltersPage.waitForTableBody();
            await expect(await paginationPage.getCurrentPage()).toEqual('Page ' + page);
            await expect(await paginationPage.getTotalPages()).toEqual('of ' + totalPages);
            await expect(await paginationPage.getCurrentItemsPerPage()).toEqual(itemsPerPage.five);

            showing = (itemsPerPage.fiveValue * page);
            await expect(await paginationPage.getPaginationRange()).toEqual('Showing 1-' + showing + ' of ' + nrOfProcesses);
            await expect(await processFiltersPage.numberOfProcessRows()).toBe(itemsPerPage.fiveValue);
            await paginationPage.checkNextPageButtonIsEnabled();
            await paginationPage.checkPreviousPageButtonIsDisabled();

            page++;
            await paginationPage.clickOnNextPage();
            await processDetailsPage.checkProcessTitleIsDisplayed();
            await processFiltersPage.waitForTableBody();
            await expect(await paginationPage.getCurrentPage()).toEqual('Page ' + page);
            await expect(await paginationPage.getTotalPages()).toEqual('of ' + totalPages);
            await expect(await paginationPage.getCurrentItemsPerPage()).toEqual(itemsPerPage.five);

            showing = (itemsPerPage.fiveValue * page);
            await expect(await paginationPage.getPaginationRange()).toEqual('Showing 6-' + showing + ' of ' + nrOfProcesses);
            await expect(await processFiltersPage.numberOfProcessRows()).toBe(itemsPerPage.fiveValue);
            await paginationPage.checkNextPageButtonIsEnabled();
            await paginationPage.checkPreviousPageButtonIsEnabled();

            page++;
            await paginationPage.clickOnNextPage();
            await processDetailsPage.checkProcessTitleIsDisplayed();
            await processFiltersPage.waitForTableBody();
            await expect(await paginationPage.getCurrentPage()).toEqual('Page ' + page);
            await expect(await paginationPage.getTotalPages()).toEqual('of ' + totalPages);
            await expect(await paginationPage.getCurrentItemsPerPage()).toEqual(itemsPerPage.five);

            showing = (itemsPerPage.fiveValue * page);
            await expect(await paginationPage.getPaginationRange()).toEqual('Showing 11-' + showing + ' of ' + nrOfProcesses);
            await expect(await processFiltersPage.numberOfProcessRows()).toBe(itemsPerPage.fiveValue);
            await paginationPage.checkNextPageButtonIsEnabled();
            await paginationPage.checkPreviousPageButtonIsEnabled();

            page++;
            await paginationPage.clickOnNextPage();
            await processDetailsPage.checkProcessTitleIsDisplayed();
            await processFiltersPage.waitForTableBody();
            await expect(await paginationPage.getCurrentPage()).toEqual('Page ' + page);
            await expect(await paginationPage.getTotalPages()).toEqual('of ' + totalPages);
            await expect(await paginationPage.getCurrentItemsPerPage()).toEqual(itemsPerPage.five);

            showing = (itemsPerPage.fiveValue * page);
            await expect(await paginationPage.getPaginationRange()).toEqual('Showing 16-' + showing + ' of ' + nrOfProcesses);
            await expect(await processFiltersPage.numberOfProcessRows()).toBe(itemsPerPage.fiveValue);
            await paginationPage.checkNextPageButtonIsDisabled();
            await paginationPage.checkPreviousPageButtonIsEnabled();

            page = 1;
            await (await (await navigationBarPage.navigateToProcessServicesPage()).goToTaskApp()).clickProcessButton();
            await processFiltersPage.clickRunningFilterButton();
            await processFiltersPage.checkFilterIsHighlighted(processFilterRunning);
            await processDetailsPage.checkProcessTitleIsDisplayed();
            await processFiltersPage.waitForTableBody();
            await expect(await paginationPage.getCurrentPage()).toEqual('Page ' + page);
            await expect(await paginationPage.getTotalPages()).toEqual('of ' + totalPages);
            await expect(await paginationPage.getCurrentItemsPerPage()).toEqual(itemsPerPage.five);
        });

        it('[C261049] Should be possible to open page number dropdown', async () => {
            let showing;
            page = 1;
            totalPages = 2;
            await processFiltersPage.clickRunningFilterButton();
            await processDetailsPage.checkProcessTitleIsDisplayed();
            await processFiltersPage.waitForTableBody();
            await paginationPage.selectItemsPerPage(itemsPerPage.ten);
            await processDetailsPage.checkProcessTitleIsDisplayed();
            await processFiltersPage.waitForTableBody();
            await expect(await paginationPage.getCurrentPage()).toEqual('Page ' + page);
            await expect(await paginationPage.getTotalPages()).toEqual('of ' + totalPages);
            await expect(await paginationPage.getCurrentItemsPerPage()).toEqual(itemsPerPage.ten);

            showing = (itemsPerPage.tenValue * page);
            await expect(await paginationPage.getPaginationRange()).toEqual('Showing 1-' + showing + ' of ' + nrOfProcesses);
            await expect(await processFiltersPage.numberOfProcessRows()).toBe(itemsPerPage.tenValue);
            await paginationPage.checkNextPageButtonIsEnabled();
            await paginationPage.checkPreviousPageButtonIsDisabled();

            await paginationPage.clickOnPageDropdown();
            await expect(await paginationPage.getPageDropdownOptions()).toEqual(['1', '2']);
            page = 2;
            await paginationPage.clickOnPageDropdownOption('2');
            await processDetailsPage.checkProcessTitleIsDisplayed();
            await processFiltersPage.waitForTableBody();
            await expect(await paginationPage.getCurrentPage()).toEqual('Page ' + page);
            await expect(await paginationPage.getTotalPages()).toEqual('of ' + totalPages);
            await expect(await paginationPage.getCurrentItemsPerPage()).toEqual(itemsPerPage.ten);

            showing = (itemsPerPage.tenValue * page);
            await expect(await paginationPage.getPaginationRange()).toEqual('Showing 11-' + showing + ' of ' + nrOfProcesses);
            await expect(await processFiltersPage.numberOfProcessRows()).toBe(itemsPerPage.tenValue);
            await paginationPage.checkNextPageButtonIsDisabled();
            await paginationPage.checkPreviousPageButtonIsEnabled();

            await paginationPage.clickOnPageDropdown();
            await expect(await paginationPage.getPageDropdownOptions()).toEqual(['1', '2']);
            page = 1;
            await paginationPage.clickOnPageDropdownOption('1');
            await processDetailsPage.checkProcessTitleIsDisplayed();
            await processFiltersPage.waitForTableBody();
            await expect(await paginationPage.getCurrentPage()).toEqual('Page ' + page);
            await expect(await paginationPage.getTotalPages()).toEqual('of ' + totalPages);
            await expect(await paginationPage.getCurrentItemsPerPage()).toEqual(itemsPerPage.ten);

            showing = (itemsPerPage.tenValue * page);
            await expect(await paginationPage.getPaginationRange()).toEqual('Showing 1-' + showing + ' of ' + nrOfProcesses);
            await expect(await processFiltersPage.numberOfProcessRows()).toBe(itemsPerPage.tenValue);
            await paginationPage.checkNextPageButtonIsEnabled();
            await paginationPage.checkPreviousPageButtonIsDisabled();
        });

        it('[C261048] Should be possible to sort processes by name', async () => {
            await processFiltersPage.clickRunningFilterButton();
            await processFiltersPage.checkFilterIsHighlighted(processFilterRunning);
            await processDetailsPage.checkProcessTitleIsDisplayed();
            await processFiltersPage.waitForTableBody();

            await paginationPage.selectItemsPerPage(itemsPerPage.twenty);
            await processDetailsPage.checkProcessTitleIsDisplayed();
            await processFiltersPage.waitForTableBody();

            await processFiltersPage.sortByName('ASC');
            await processFiltersPage.waitForTableBody();
            await processFiltersPage.checkProcessesSortedByNameAsc();

            await processFiltersPage.sortByName('DESC');
            await processFiltersPage.waitForTableBody();
            await processFiltersPage.checkProcessesSortedByNameDesc();
        });

        it('[C286260] Should keep sorting when changing \'Items per page\'', async () => {
            await processFiltersPage.clickRunningFilterButton();
            await processFiltersPage.checkFilterIsHighlighted(processFilterRunning);
            await processDetailsPage.checkProcessTitleIsDisplayed();
            await processFiltersPage.waitForTableBody();

            await paginationPage.selectItemsPerPage(itemsPerPage.twenty);
            await processDetailsPage.checkProcessTitleIsDisplayed();
            await processFiltersPage.waitForTableBody();

            await processFiltersPage.sortByName('ASC');
            await processFiltersPage.waitForTableBody();
            await processFiltersPage.checkProcessesSortedByNameAsc();

            await paginationPage.selectItemsPerPage(itemsPerPage.five);
            await processFiltersPage.waitForTableBody();
            await processFiltersPage.checkProcessesSortedByNameAsc();
        });
    });
});
