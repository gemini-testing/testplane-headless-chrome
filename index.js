'use strict';

const _ = require('lodash');
const parseConfig = require('./lib/parse-config');
const downloadChromiumByVersion = require('./lib/download-chromium-by-version');

module.exports = async (hermione, opts) => {
    const config = parseConfig(opts);
    if (!config.enabled) {
        return;
    }

    const browser = hermione.config.browsers[config.browserId];
    if (_.isUndefined(browser)) {
        throw new Error('Headless browser id was not specified in hermione config');
    }

    hermione.on(hermione.events.INIT, async () => {
        if (!hermione.isWorker()) {
            const {version, cachePath, downloadAttempts} = config;
            const chromiumPath = await downloadChromiumByVersion(version, cachePath, downloadAttempts);
            const {desiredCapabilities} = browser;

            desiredCapabilities.chromeOptions = _.mergeWith(desiredCapabilities.chromeOptions, {
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
