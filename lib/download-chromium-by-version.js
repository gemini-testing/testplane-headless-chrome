'use strict';

const fs = require('fs-extra');
const ora = require('ora');
const downloadChromium = require('download-chromium');
const NestedError = require('nested-error-stacks');
const utils = require('./utils');

module.exports = async function(version, cachePath, downloadAttempts) {
    try {
        await fs.ensureDir(cachePath);
    } catch (e) {
        throw new NestedError('Could not create directory for Chromium', e);
    }

    const spinner = ora({spinner: 'point'});
    const plaftormName = utils.getPlatformName();

    let passedVersion;
    let revision;

    if (version) {
        passedVersion = version;
        revision = await utils.getRevision(plaftormName, passedVersion, cachePath);
    } else {
        const majorInfo = await utils.getLastStableMajor(plaftormName);
        passedVersion = majorInfo.version;
        revision = majorInfo.revision;
    }

    const cachedRevision = revision;
    let chromiumPath = null;

    // decrement revision number for finding build: https://www.chromium.org/getting-involved/download-chromium
    for (let i = 0; i < downloadAttempts; i++) {
        spinner.start(`Trying to download Chromium ${passedVersion} (r${revision})\n`);
        try {
            chromiumPath = await downloadChromium({
                revision,
                installPath: cachePath
            });
            spinner.succeed();
            console.info(`Chromium binary was downloaded to '${chromiumPath}'\n`);
            break;
        } catch (e) {
            if (e.message.match(/Response code 404/)) {
                revision--;
            } else {
                spinner.fail();
                throw new NestedError('Could not download Chromium', e);
            }
        }
    }

    if (!chromiumPath) {
        spinner.fail();
        throw new Error(`Could not find Chromium build in ${downloadAttempts} retries. Increase retries count or choose another version.`);
    }

    if (revision !== cachedRevision) {
        // Do not stop process if saving failed, it is not critical
        utils.saveRevision(plaftormName, passedVersion, revision, cachePath).catch(e => console.error(e));
    }

    return chromiumPath;
};
