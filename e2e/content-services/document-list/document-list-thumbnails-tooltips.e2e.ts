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
import { browser } from 'protractor';
import { ApiService, LoginSSOPage, StringUtil, UploadActions } from '@alfresco/adf-testing';
import { FileModel } from '../../models/ACS/file.model';
import { NavigationBarPage } from '../../pages/adf/navigation-bar.page';

describe('Document List Component', () => {

    const loginPage = new LoginSSOPage();
    const contentServicesPage = new ContentServicesPage();
    let uploadedFolder, uploadedFolderExtra;
    const alfrescoJsApi = new ApiService().apiService;

    const uploadActions = new UploadActions(alfrescoJsApi);
    let acsUser = null;
    let testFileNode, pdfBFileNode;
    const navigationBarPage = new NavigationBarPage();

    afterEach(async () => {
        await alfrescoJsApi.login(browser.params.testConfig.admin.email, browser.params.testConfig.admin.password);
        if (uploadedFolder) {
            await uploadActions.deleteFileOrFolder(uploadedFolder.entry.id);
            uploadedFolder = null;
        }
        if (uploadedFolderExtra) {
            await uploadActions.deleteFileOrFolder(uploadedFolderExtra.entry.id);
            uploadedFolderExtra = null;
        }
        if (testFileNode) {
            await uploadActions.deleteFileOrFolder(testFileNode.entry.id);
            testFileNode = null;
        }
        if (pdfBFileNode) {
            await uploadActions.deleteFileOrFolder(pdfBFileNode.entry.id);
            pdfBFileNode = null;
        }
    });

    describe('Thumbnails and tooltips', () => {
        const pdfFile = new FileModel({
            name: browser.params.resources.Files.ADF_DOCUMENTS.PDF.file_name,
            location: browser.params.resources.Files.ADF_DOCUMENTS.PDF.file_path
        });

        const testFile = new FileModel({
            name: browser.params.resources.Files.ADF_DOCUMENTS.TEST.file_name,
            location: browser.params.resources.Files.ADF_DOCUMENTS.TEST.file_path
        });

        const docxFile = new FileModel({
            name: browser.params.resources.Files.ADF_DOCUMENTS.DOCX.file_name,
            location: browser.params.resources.Files.ADF_DOCUMENTS.DOCX.file_path
        });
        const folderName = `MEESEEKS_${StringUtil.generateRandomString(5)}_LOOK_AT_ME`;
        let filePdfNode, fileTestNode, fileDocxNode, folderNode;

        beforeAll(async () => {
            acsUser = new AcsUserModel();
            await alfrescoJsApi.login(browser.params.testConfig.admin.email, browser.params.testConfig.admin.password);

            await alfrescoJsApi.core.peopleApi.addPerson(acsUser);

            await alfrescoJsApi.login(acsUser.id, acsUser.password);
            filePdfNode = await uploadActions.uploadFile(pdfFile.location, pdfFile.name, '-my-');
            fileTestNode = await uploadActions.uploadFile(testFile.location, testFile.name, '-my-');
            fileDocxNode = await uploadActions.uploadFile(docxFile.location, docxFile.name, '-my-');
            folderNode = await uploadActions.createFolder(folderName, '-my-');
        });

        afterAll(async () => {
            await navigationBarPage.clickLogoutButton();

            await alfrescoJsApi.login(browser.params.testConfig.admin.email, browser.params.testConfig.admin.password);
            if (filePdfNode) {
                await uploadActions.deleteFileOrFolder(filePdfNode.entry.id);
            }
            if (fileTestNode) {
                await uploadActions.deleteFileOrFolder(fileTestNode.entry.id);
            }
            if (fileDocxNode) {
                await uploadActions.deleteFileOrFolder(fileDocxNode.entry.id);
            }
            if (folderNode) {
                await uploadActions.deleteFileOrFolder(folderNode.entry.id);
            }
    });

        beforeEach(async () => {
            await loginPage.login(acsUser.id, acsUser.password);
            await contentServicesPage.goToDocumentList();
        });

        it('[C260108] Should display tooltip for file\'s name', async () => {
            await expect(await contentServicesPage.getDocumentList().getTooltip(pdfFile.name)).toEqual(pdfFile.name);
        });

        it('[C260109] Should display tooltip for folder\'s name', async () => {
            await expect(await contentServicesPage.getDocumentList().getTooltip(folderName)).toEqual(folderName);
        });

        it('[C260119] Should have a specific thumbnail for folders', async () => {
            const folderIconUrl = await contentServicesPage.getRowIconImageUrl(folderName);
            await expect(folderIconUrl).toContain('/assets/images/ft_ic_folder.svg');
        });

        it('[C280066] Should have a specific thumbnail PDF files', async () => {
            const fileIconUrl = await contentServicesPage.getRowIconImageUrl(pdfFile.name);
            await expect(fileIconUrl).toContain('/assets/images/ft_ic_pdf.svg');
        });

        it('[C280067] Should have a specific thumbnail DOCX files', async () => {
            const fileIconUrl = await contentServicesPage.getRowIconImageUrl(docxFile.name);
            await expect(fileIconUrl).toContain('/assets/images/ft_ic_ms_word.svg');
        });

        it('[C280068] Should have a specific thumbnail files', async () => {
            const fileIconUrl = await contentServicesPage.getRowIconImageUrl(testFile.name);
            await expect(fileIconUrl).toContain('/assets/images/ft_ic_document.svg');
        });

        it('[C274701] Should be able to enable thumbnails', async () => {
            await contentServicesPage.enableThumbnails();
            await contentServicesPage.checkAcsContainer();
            const fileIconUrl = await contentServicesPage.getRowIconImageUrl(pdfFile.name);
            await expect(fileIconUrl).toContain(`/versions/1/nodes/${filePdfNode.entry.id}/renditions`);
        });
    });
});
