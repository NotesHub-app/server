const path = require('path');

module.exports = {
    rootDir: process.cwd(),
    // testRegex: "__tests__/(files).js",
    // forceExit: true,

    globalSetup: path.join(__dirname, 'setup.js'),
    globalTeardown: path.join(__dirname, 'teardown.js'),
    testEnvironment: path.join(__dirname, 'mongo-environment.js'),
    setupTestFrameworkScriptFile: path.join(__dirname, 'setupTestFrameworkScript.js'),
};
