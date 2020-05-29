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

import { ContentServicesPage } from '../../pages/adf/content-services.page';
import { AcsUserModel } from '../../models/ACS/acs-user.model';
import { FileModel } from '../../models/ACS/file.model';
import { LoginSSOPage, UploadActions, BrowserVisibility, FileBrowserUtil, ApiService } from '@alfresco/adf-testing';
import { browser } from 'protractor';
import { NavigationBarPage } from '../../pages/adf/navigation-bar.page';
import { FolderModel } from '../../models/ACS/folder.model';

describe('Version component actions', () => {

    const loginPage = new LoginSSOPage();
    const contentServicesPage = new ContentServicesPage();
    const navigationBarPage = new NavigationBarPage();
    const contentListPage = contentServicesPage.getDocumentList();

    const acsUser = new AcsUserModel();

    const txtFileComma = new FileModel({
        name: 'comma,name',
        location: browser.params.resources.Files.ADF_DOCUMENTS.TXT.file_path
    });

    const txtFileModel = new FileModel({
        name: browser.params.resources.Files.ADF_DOCUMENTS.TXT.file_name,
        location: browser.params.resources.Files.ADF_DOCUMENTS.TXT.file_path
    });

    const file0BytesModel = new FileModel({
        name: browser.params.resources.Files.ADF_DOCUMENTS.TXT_0B.file_name,
        location: browser.params.resources.Files.ADF_DOCUMENTS.TXT_0B.file_path
    });

    const folderInfo = new FolderModel({
        name: 'myFolder',
        location: browser.params.resources.Files.ADF_DOCUMENTS.TEXT_FOLDER.folder_path
    });

    const folderSecond = new FolderModel({
        name: 'myrSecondFolder',
        location: browser.params.resources.Files.ADF_DOCUMENTS.TEXT_FOLDER.folder_location
    });

    const alfrescoJsApi = new ApiService().apiService;
    const uploadActions = new UploadActions(alfrescoJsApi);

    beforeAll(async () => {
        await alfrescoJsApi.login(browser.params.testConfig.admin.email, browser.params.testConfig.admin.password);
        await alfrescoJsApi.core.peopleApi.addPerson(acsUser);
        await alfrescoJsApi.login(acsUser.id, acsUser.password);

        await uploadActions.uploadFile( txtFileModel.location, txtFileModel.name, '-my-');
        await uploadActions.uploadFile(file0BytesModel.location, file0BytesModel.name, '-my-');
        await uploadActions.uploadFile(txtFileComma.location, txtFileComma.name, '-my-');

        const textFolderUploaded = await uploadActions.createFolder(folderInfo.name, '-my-');
        await uploadActions.uploadFolder(folderInfo.location, textFolderUploaded.entry.id);

        await uploadActions.createFolder(folderSecond.name, '-my-');

        await loginPage.login(acsUser.id, acsUser.password);

        await navigationBarPage.clickContentServicesButton();
        await contentServicesPage.waitForTableBody();
   });

    afterAll(async () => {
        await navigationBarPage.clickLogoutButton();
    });

    afterEach(async () => {
        await BrowserVisibility.waitUntilDialogIsClose();
    });

    it('[C260083] Download files - Different size values', async () => {
        await contentListPage.selectRow(txtFileModel.name);
        await contentServicesPage.clickDownloadButton();
        await FileBrowserUtil.isFileDownloaded(txtFileModel.name);
        await BrowserVisibility.waitUntilDialogIsClose();

        await contentListPage.selectRow(file0BytesModel.name);
        await contentServicesPage.clickDownloadButton();
        await FileBrowserUtil.isFileDownloaded(file0BytesModel.name);
    });

    it('[C260084] Download folder', async () => {
        await contentListPage.selectRow(folderInfo.name);
        await contentServicesPage.clickDownloadButton();
        await FileBrowserUtil.isFileDownloaded(folderInfo.name + '.zip');
    });

    it('[C261032] File and Folder', async () => {
        await contentServicesPage.clickMultiSelectToggle();
        await contentServicesPage.checkAcsContainer();
        await contentListPage.dataTablePage().checkAllRows();
        await contentServicesPage.clickDownloadButton();
        await FileBrowserUtil.isFileDownloaded('archive.zip');
    });

    it('[C261033] Folder and Folder', async () => {
        await contentListPage.selectRow(folderInfo.name);
        await contentListPage.selectRow(folderSecond.name);

        await contentServicesPage.clickDownloadButton();

        await FileBrowserUtil.isFileDownloaded('archive.zip');
        await BrowserVisibility.waitUntilDialogIsClose();
    });

    it('[C277757] Download file - Comma in file name', async () => {
        await contentListPage.selectRow(txtFileComma.name);
        await contentServicesPage.clickDownloadButton();
        await FileBrowserUtil.isFileDownloaded(txtFileComma.name);
    });
});
