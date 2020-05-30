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

import { ApiService, DataTableComponentPage, LoginSSOPage, UserModel } from '@alfresco/adf-testing';
import { browser } from 'protractor';
import { DataTablePage } from '../../pages/adf/demo-shell/data-table.page';
import { NavigationBarPage } from '../../pages/adf/navigation-bar.page';
import { UsersActions } from '../../actions/users.actions';

describe('Datatable component - selection', () => {

    const apiService = new ApiService();
    const usersActions = new UsersActions(apiService);

    const dataTablePage = new DataTablePage();
    const loginPage = new LoginSSOPage();
    const acsUser = new UserModel();
    const navigationBarPage = new NavigationBarPage();
    const dataTableComponent = new DataTableComponentPage();

    beforeAll(async () => {
        await apiService.getInstance().login(browser.params.testConfig.admin.email, browser.params.testConfig.admin.password);

        await usersActions.createUser(acsUser);

        await loginPage.login(acsUser.id, acsUser.password);

        await navigationBarPage.navigateToDatatable();
   });

    afterAll(async () => {
        await navigationBarPage.clickLogoutButton();
    });

    it('[C213258] Should be possible change the selection modes when change the selectionMode property', async () => {
        await dataTablePage.selectRow('2');
        await dataTableComponent.checkRowIsSelected('Id', '2');
        await expect(await dataTablePage.getNumberOfSelectedRows()).toEqual(1);
        await dataTablePage.selectRow('3');
        await dataTableComponent.checkRowIsSelected('Id', '3');
        await expect(await dataTablePage.getNumberOfSelectedRows()).toEqual(1);
        await dataTablePage.selectSelectionMode('Multiple');
        await dataTablePage.selectRow('1');
        await dataTableComponent.checkRowIsSelected('Id', '1');
        await dataTablePage.selectRowWithKeyboard('3');
        await dataTableComponent.checkRowIsSelected('Id', '1');
        await dataTableComponent.checkRowIsSelected('Id', '3');
        await dataTablePage.checkRowIsNotSelected('2');
        await dataTablePage.checkRowIsNotSelected('4');
        await dataTablePage.selectSelectionMode('None');
        await dataTablePage.selectRow('1');
        await dataTablePage.checkNoRowIsSelected();
    });

});
