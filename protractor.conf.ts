// tslint:disable: no-var-requires
// tslint:disable: no-console

const path = require('path');
const { SpecReporter } = require('jasmine-spec-reporter');
const retry = require('protractor-retry').retry;
const tsConfig = require('./e2e/tsconfig.e2e.json');
const testConfig = require('./e2e/test.config');
const RESOURCES = require('./e2e/util/resources');
const smartRunner = require('protractor-smartrunner');
const resolve = require('path').resolve;

// require('ts-node').register({
//     project: './lib/tsconfig.e2e.json'
// });
// const ACTIVITI_CLOUD_APPS = require('./lib/testing').ACTIVITI_CLOUD_APPS;

const ACTIVITI_CLOUD_APPS = {
    CANDIDATE_BASE_APP: {
        name: 'candidatebaseapp',
        file_location: 'https://github.com/Alfresco/alfresco-ng2-components/blob/develop/e2e/resources/activiti7/candidatebaseapp.zip?raw=true',
        processes: {
            candidateUserProcess: 'candidateuserprocess',
            candidateGroupProcess: 'candidategroupprocess',
            anotherCandidateGroupProcess: 'anothercandidategroup',
            uploadFileProcess: 'uploadfileprocess',
            processwithstarteventform: 'processwithstarteventform',
            processwithjsonfilemapping: 'processwithjsonfilemapping',
            assigneeProcess: 'assigneeprocess',
            errorStartEventProcess: {
                process_name: 'errorstartevent',
                error_id: 'Error_END_EVENT',
                error_code: '123'
            },
            errorBoundaryEventProcess: {
                process_name: 'errorboundaryevent',
                error_id: 'Error_END_EVENT',
                error_code: '567'
            },
            errorExclusiveGateProcess: {
                process_name: 'errorexclusivegate',
                error_id: 'Error_OK',
                error_code: '200'
            }
        },
        forms: {
            starteventform: 'starteventform',
            formtotestvalidations: 'formtotestvalidations',
            uploadfileform: 'uploadfileform',
            inputform: 'inputform',
            outputform: 'outputform'
        },
        security: [
            { 'role': 'ACTIVITI_ADMIN', 'groups': [], 'users': ['superadminuser', 'processadminuser'] },
            { 'role': 'ACTIVITI_USER', 'groups': ['hr', 'testgroup'], 'users': ['hruser', 'salesuser'] }
        ],
        tasks: {
            uploadFileTask: 'UploadFileTask',
            candidateUserTask: 'candidateUserTask'
        }
    },
    SIMPLE_APP: {
        name: 'simpleapp',
        file_location: 'https://github.com/Alfresco/alfresco-ng2-components/blob/develop/e2e/resources/activiti7/simpleapp.zip?raw=true',
        processes: {
            processwithvariables: 'processwithvariables',
            simpleProcess: 'simpleprocess',
            dropdownrestprocess: 'dropdownrestprocess',
            multilingualprocess: 'multilingualprocess',
            processWithTabVisibility: 'processwithtabvisibility',
            startmessageevent: 'start-message-event',
            intermediatemessageevent: 'intermediate-message-event',
            intboundaryevent: 'int-boundary-event',
            nonintboundaryevent: 'nonint-boundary-event',
            intboundarysubprocess: 'int-boundary-subprocess',
            intstartmessageevent: 'int-start-message-event',
            nonintstartmessageevent: 'nonint-start-message-event',
            siblingtaskprocess: 'siblingtaskprocess',
            startTaskVisibilityForm: 'start-task-visibility-form',
            startVisibilityForm: 'start-visibility-form',
            processstring: 'processstring',
            processinteger: 'processinteger',
            processboolean: 'processboolean',
            processdate: 'processdate',
            multiprocess: 'multiprocess',
            terminateexclusive: 'terminate-exclusive',
            terminatesubprocess: 'terminate-subprocess',
            multiinstancedmnparallel: 'multiinstance-dmnparallel',
            multiinstancecallactivity: 'multiinstance-callactivity',
            multiinstancecollection: 'multiinstance-collection',
            multiinstancecompletion: 'multiinstance-completion',
            multiinstancesequential: 'multiinstance-sequential',
            multiinstanceservicetask: 'multiinstance-servicetask',
            multiinstanceusertask: 'multiinstance-usertask',
            multiinstancedmnsequence: 'multiinstance-dmnsequence',
            multiinstancemanualtask: 'multiinstance-manualtask',
            multiinstancesubprocess: 'multiinstance-subprocess',
            calledprocess: 'calledprocess',
            booleanvisibilityprocess: 'booleanvisibilityprocess',
            numbervisibilityprocess: 'numbervisibilityprocess',
            processformoutcome: 'outcomebuttons',
            uploadSingleMultipleFiles: 'upload-single-multiple-pro',
            processDisplayRestJson: 'process-display-rest-json',
            poolStartEndMessageThrow: 'pool-start-end-mess-throw',
            poolStartEndMessageCatch: 'pool-start-end-mess-catch',
            poolProcessCalled: 'pool-process-called',
            poolProcessCalling: 'pool-process-calling',
            poolNonIntBoundaryThrown: 'pool-nonint-boundary-throw',
            poolNonIntBoundaryCatch: 'pool-nonint-boundary-catch',
            poolIntermediateMessageThrow: 'pool-interm-message-throw',
            poolIntermediateMessageCatch: 'pool-interm-message-catch',
            poolInterruptingBoundarySubprocessThrow: 'pool-int-bound-subpr-throw',
            poolInterruptingBoundarySubprocessCatch: 'pool-int-bound-subpr-catch',
            poolInterruptingBoundaryThrow: 'pool-int-boundary-throw',
            poolInterruptingBoundaryCatch: 'pool-int-boundary-catch'
        },
        forms: {
            tabVisibilityFields: {
                name: 'tabvisibilitywithfields'
            },
            tabVisibilityVars: {
                name: 'tabvisibilitywithvars'
            },
            usertaskform: {
                name: 'usertaskform'
            },
            dropdownform: {
                name: 'dropdownform'
            },
            formVisibility: {
                name: 'form-visibility'
            },
            multilingualform: {
                name: 'multilingualform'
            },
            inputform: {
                name: 'inputform'
            },
            outputform: {
                name: 'outputform'
            },
            exclusiveconditionform: {
                name: 'exclusive-condition-form'
            },
            uploadlocalfileform: {
                name: 'upload-localfile-form'
            },
            booleanvisibility: {
                name: 'booleanvisibility'
            },
            requirednumbervisibility: {
                name: 'requirednumbervisibility'
            },
            mealform: {
                name: 'mealform'
            },
            resultcollectionform: {
                name: 'resultcollectionform'
            },
            uploadSingleMultiple: {
                name: 'upload-single-multiple',
                widgets: {
                    contentMultipleAttachFileId: 'UploadMultipleFileFromContentId'
                }
            },
            formWithJsonWidget: {
                name: 'form-with-json-widget'
            },
            formWithAllWidgets: {
                name: 'form-with-all-widgets'
            },
            poolForm: {
                name: 'pool-usertaskform'
            }

        },
        tasks: {
            processstring: 'inputtask',
            uploadSingleMultipleFiles: 'UploadSingleMultipleFiles'
        },
        security: [
            { 'role': 'ACTIVITI_ADMIN', 'groups': [], 'users': ['superadminuser', 'processadminuser'] },
            { 'role': 'ACTIVITI_USER', 'groups': ['hr', 'sales', 'testgroup'], 'users': ['hruser'] }
        ],
        infrastructure: {connectors: {restconnector: {}}, bridges: {}}
    },
    SUB_PROCESS_APP: {
        name: 'subprocessapp',
        file_location: 'https://github.com/Alfresco/alfresco-ng2-components/blob/develop/e2e/resources/activiti7/subprocessapp.zip?raw=true',
        processes: {
            processchild: 'processchild',
            processparent: 'processparent'
        },
        security: [
            { 'role': 'ACTIVITI_ADMIN', 'groups': [], 'users': ['superadminuser'] },
            { 'role': 'ACTIVITI_USER', 'groups': ['hr', 'testgroup'], 'users': ['hruser'] }
        ]
    }
};

const { uploadScreenshot, cleanReportFolder } = require('./e2e/protractor/save-remote');
const argv = require('yargs').argv;

const projectRoot = path.resolve(__dirname);
const width = 1657, height = 1657;

const ENV_FILE = process.env.ENV_FILE;
const GROUP_SUFFIX = process.env.PREFIX || 'adf';

RESOURCES.ACTIVITI_CLOUD_APPS = ACTIVITI_CLOUD_APPS;
if (ENV_FILE) {
    require('dotenv').config({ path: ENV_FILE });
}

const HOST = process.env.URL_HOST_ADF;
const BROWSER_RUN = !!process.env.BROWSER_RUN;
const FOLDER = process.env.FOLDER || '';
const SELENIUM_SERVER = process.env.SELENIUM_SERVER || '';
const DIRECT_CONNECCT = !SELENIUM_SERVER;
const MAXINSTANCES = process.env.MAXINSTANCES || 1;
const TIMEOUT = parseInt(process.env.TIMEOUT, 10);
const SAVE_SCREENSHOT = (process.env.SAVE_SCREENSHOT === 'true');
const LIST_SPECS = process.env.LIST_SPECS || [];
const LOG = !!process.env.LOG;
let arraySpecs = [];

if (LOG) {
    console.log('======= PROTRACTOR CONFIGURATION ====== ');
    console.log('BROWSER_RUN : ' + BROWSER_RUN);
    console.log('SAVE_SCREENSHOT : ' + SAVE_SCREENSHOT);
    console.log('FOLDER : ' + FOLDER);
    console.log('MAXINSTANCES : ' + MAXINSTANCES);
    console.log('LIST_SPECS : ' + LIST_SPECS);
    console.log('SELENIUM_SERVER : ' + SELENIUM_SERVER);
}

const downloadFolder = path.join(__dirname, 'e2e/downloads');

const specs = () => {
    const specsToRun = FOLDER ? './**/e2e/' + FOLDER + '/**/*.e2e.ts' : './**/e2e/**/*.e2e.ts';

    if (LIST_SPECS.length === 0) {
        arraySpecs = [specsToRun];
    } else {
        // @ts-ignore
        arraySpecs = LIST_SPECS.split(',');
        arraySpecs = arraySpecs.map((el) => './' + el);
    }

    return arraySpecs;
};

specs();

exports.config = {
    allScriptsTimeout: TIMEOUT,

    specs: arraySpecs,

    useAllAngular2AppRoots: true,

    capabilities: {

        loggingPrefs: {
            browser: 'ALL' // "OFF", "SEVERE", "WARNING", "INFO", "CONFIG", "FINE", "FINER", "FINEST", "ALL".
        },

        browserName: 'chrome',

        maxInstances: MAXINSTANCES,

        shardTestFiles: true,

        chromeOptions: {
            binary: require('puppeteer').executablePath(),
            prefs: {
                'credentials_enable_service': false,
                'download': {
                    'prompt_for_download': false,
                    'directory_upgrade': true,
                    'default_directory': downloadFolder
                },
                'browser': {
                    'setDownloadBehavior': {
                        'behavior': 'allow',
                        'downloadPath': downloadFolder
                    }
                }
            },
            args: ['--incognito',
                `--window-size=${width},${height}`,
                '--disable-gpu',
                '--no-sandbox',
                '--disable-web-security',
                '--disable-browser-side-navigation',
                ...(BROWSER_RUN === true ? [] : ['--headless'])]
        }
    },

    directConnect: DIRECT_CONNECCT,

    baseUrl: HOST,

    params: {
        testConfig,
        loginRoute: '/login',
        config: testConfig.appConfig,
        groupSuffix: GROUP_SUFFIX,
        identityAdmin: testConfig.identityAdmin,
        identityUser: testConfig.identityUser,
        rootPath: __dirname,
        resources: RESOURCES
    },

    framework: 'jasmine2',

    getPageTimeout: 90000,

    jasmineNodeOpts: {
        showColors: true,
        defaultTimeoutInterval: 120000,
        print: () => {},
        ...smartRunner.withOptionalExclusions(
            resolve(__dirname, './e2e/protractor.excludes.json')
        )
    },

    /**
     * The address of a running selenium server (must be manually start before running the tests). If this is specified seleniumServerJar and seleniumPort will be ignored.
     * @config {String} seleniumAddress
     */
    seleniumAddress: SELENIUM_SERVER,

    SELENIUM_PROMISE_MANAGER: false,

    plugins: [{
        package: 'jasmine2-protractor-utils',
        disableScreenshot: false,
        screenshotOnExpectFailure: true,
        screenshotOnSpecFailure: false,
        clearFoldersBeforeTest: true,
        screenshotPath: `${projectRoot}/e2e-output/screenshots/`
    }],

    onCleanUp(results) {
        retry.onCleanUp(results);
    },

    onPrepare() {
        retry.onPrepare();

        jasmine.DEFAULT_TIMEOUT_INTERVAL = TIMEOUT;

        require('ts-node').register({
            project: require('path').join(__dirname, './e2e/tsconfig.e2e.json')
        });

        require('tsconfig-paths').register({
            project: 'e2e/tsconfig.e2e.json',
            baseUrl: 'e2e/',
            paths: tsConfig.compilerOptions.paths
        });

        browser.driver.sendChromiumCommand('Page.setDownloadBehavior', {
            behavior: 'allow',
            downloadPath: downloadFolder
        });

        browser.manage().window().setSize(width, height);

        jasmine.getEnv().addReporter(
            new SpecReporter({
                spec: {
                    displayStacktrace: true,
                    displayDuration: true
                }
            })
        );

        return browser.driver.executeScript(disableCSSAnimation);

        function disableCSSAnimation() {
            const css = '* {' +
                '-webkit-transition-duration: 0s !important;' +
                'transition-duration: 0s !important;' +
                '-webkit-animation-duration: 0s !important;' +
                'animation-duration: 0s !important;' +
                '}';
            const head = document.head || document.getElementsByTagName('head')[0];
            const style = document.createElement('style');

            style.type = 'text/css';
            style.appendChild(document.createTextNode(css));
            head.appendChild(style);
        }

    },

    beforeLaunch: function () {
        if (SAVE_SCREENSHOT) {
            cleanReportFolder();
        }
    },

    afterLaunch: async function () {
        if (SAVE_SCREENSHOT) {

            let retryCount = 1;
            if (argv.retry) {
                retryCount = ++argv.retry;
            }
            try {
                await uploadScreenshot(retryCount);
            } catch (error) {
                console.error('Error saving screenshot', error);
            }
        }

        return retry.afterLaunch(4);
    }

};
