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

import { element, by, browser, protractor, ElementFinder } from 'protractor';
import { BrowserVisibility } from '../utils/browser-visibility';
import { BrowserActions } from '../utils/browser-actions';
import { LocalStorageUtil } from '../utils/local-storage.util';

export class LoginSSOPage {

    ssoButton = element(by.css(`[data-automation-id="login-button-sso"]`));
    usernameField = element(by.id('username'));
    passwordField = element(by.id('password'));
    loginButton = element(by.css('input[type="submit"]'));
    header = element(by.tagName('adf-layout-header'));
    loginError = element(by.css(`div[data-automation-id="login-error"]`));

    txtUsernameBasicAuth: ElementFinder = element(by.css('input[id="username"]'));
    txtPasswordBasicAuth: ElementFinder = element(by.css('input[id="password"]'));
    signInButtonBasicAuth: ElementFinder = element(by.id('login-button'));

    async goToLoginPage(): Promise<void> {
        await BrowserActions.getUrl(browser.baseUrl + '/login');
        await BrowserVisibility.waitUntilElementIsVisible(this.txtUsernameBasicAuth);
        await BrowserVisibility.waitUntilElementIsVisible(this.txtPasswordBasicAuth);
    }

    async login(username: string, password: string) {
        if (browser.params.testConfig.appConfig.authType === 'OAUTH') {
            this.loginSSOIdentityService(username, password);
        } else {
            this.loginBasicAuth(username, password);
        }
    }

    async loginSSOIdentityService(username, password) {
        browser.ignoreSynchronization = true;

        let currentUrl;

        try {
            currentUrl = await browser.getCurrentUrl();
        } catch (e) {
        }

        if (!currentUrl || currentUrl === '' || currentUrl === 'data:,') {
            const loginURL: string = browser.baseUrl + browser.params.loginRoute ? browser.params.loginRoute : '';
            await browser.get(loginURL);
        }

        await BrowserVisibility.waitUntilElementIsVisible(this.usernameField);
        await this.enterUsername(username);
        await this.enterPassword(password);
        await this.clickLoginButton();
        await browser.actions().sendKeys(protractor.Key.ENTER).perform();
        await BrowserVisibility.waitUntilElementIsVisible(this.header);

        await browser.waitForAngular();
    }

    async loginBasicAuth(username, password): Promise<void> {
        await this.goToLoginPage();

        await LocalStorageUtil.clearStorage();
        await LocalStorageUtil.setStorageItem('providers', browser.params.testConfig.appConfig.provider);
        await LocalStorageUtil.apiReset();

        await this.enterUsernameBasicAuth(username);
        await this.enterPasswordBasicAuth(password);
        await this.clickSignInBasicAuthButton();
        await BrowserVisibility.waitUntilElementIsVisible(this.header);
    }

    async clickSignInBasicAuthButton(): Promise<void> {
        await BrowserActions.click(this.signInButtonBasicAuth);
    }

    async enterUsernameBasicAuth(username): Promise<void> {
        await BrowserActions.clearSendKeys(this.txtUsernameBasicAuth, username);
    }

    async enterPasswordBasicAuth(password): Promise<void> {
        await BrowserActions.clearSendKeys(this.txtPasswordBasicAuth, password);
    }

    async clickOnSSOButton() {
        await BrowserActions.clickExecuteScript('[data-automation-id="login-button-sso"]');
    }

    async enterUsername(username) {
        await BrowserActions.clearSendKeys(this.usernameField, username);
    }

    async enterPassword(password) {
        await BrowserActions.clearSendKeys(this.passwordField, password);
    }

    async clickLoginButton() {
        await BrowserActions.click(this.loginButton);
    }

    async checkLoginErrorIsDisplayed() {
        await BrowserVisibility.waitUntilElementIsVisible(this.loginError);
    }

    async getLoginErrorMessage() {
        return BrowserActions.getText(this.loginError);
    }

}
