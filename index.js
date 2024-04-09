'use strict';

const _ = require('lodash');
const parseConfig = require('./lib/parse-config');
const downloadChromiumByVersion = require('./lib/download-chromium-by-version');

module.exports = async (testplane, opts) => {
    const config = parseConfig(opts);
    if (!config.enabled) {
        return;
    }

    const browser = testplane.config.browsers[config.browserId];
    if (_.isUndefined(browser)) {
        throw new Error('Headless browser id was not specified in testplane config');
    }

    testplane.on(testplane.events.INIT, async () => {
        if (!testplane.isWorker()) {
            const {version, cachePath, downloadAttempts} = config;
            const chromiumPath = await downloadChromiumByVersion(version, cachePath, downloadAttempts);
            const {desiredCapabilities} = browser;

            desiredCapabilities['goog:chromeOptions'] = _.mergeWith(desiredCapabilities['goog:chromeOptions'], {
                args: ['headless'],
                binary: chromiumPath
            }, (objValue) => {
                if (_.isArray(objValue)) {
                    return _.union(objValue, ['headless']);
                }
            });
        }
    });
};
