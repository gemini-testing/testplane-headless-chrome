'use sctrict';

const fs = require('fs-extra');
const path = require('path');
const got = require('got');
const NestedError = require('nested-error-stacks');
const utils = require('../lib/utils');

const {HTTP_REQUEST_RETRIES} = require('../lib/constants/defaults');
const REVISION_REQUEST_ATTEMPTS = 30;
const REVISIONS_PATH = path.join(process.cwd(), 'lib/constants/revisions.json');
const CHROMIUM_MIN_VERSION = 100;

const osPrefix = {
    'mac': 'Mac',
    'linux': 'Linux_x64',
    'Win32': 'Win',
    'Windows': 'Win_x64'
};
const supportedPlatforms = ['mac', 'linux', 'Win32', 'Windows'];

async function updateRevisions() {
    const revisions = await readRevisions();

    console.info('Start update revisions\n');
    for (const platformName of supportedPlatforms) {
        const revisionsForPlatform = revisions[platformName] = revisions[platformName] || {};
        const releases = await utils.getStableReleases(platformName, {num: 300});
        const lastStable = await utils.getLastStableMajor(platformName).then(res => res.major);
        const lastInFile = Number(Object.keys(revisionsForPlatform).sort((a, b) => a - b).pop());
        const startVersion = lastInFile ? lastInFile + 1 : CHROMIUM_MIN_VERSION;

        console.info(`Updating revisions for "${platformName}":`);

        for (let ver = startVersion; ver <= lastStable; ver++) {
            const fullVersion = utils.getFullVersion(releases.map(release => release.version), ver.toString());
            let revision = releases.find(release => release.version === fullVersion).revision;

            for (let i = 0; i < REVISION_REQUEST_ATTEMPTS; i++) {
                try {
                    const os = osPrefix[platformName];
                    const revisionsFileUrl = `https://www.googleapis.com/download/storage/v1/b/chromium-browser-snapshots/o/${os}%2F${revision}%2FREVISIONS?alt=media`;

                    await got(revisionsFileUrl, {json: true, retry: HTTP_REQUEST_RETRIES});
                    console.info('\tsaved revision', revision, 'for Chromium', ver);
                    revisionsForPlatform[ver] = Number(revision);
                    break;
                } catch (e) {
                    if (e.statusCode === 404) {
                        revision--;
                    } else {
                        throw new NestedError(`Could not find Chromium revision ${revision} for version ${ver}`);
                    }
                }
            }
        }
    }

    await fs.writeFile(REVISIONS_PATH, JSON.stringify(revisions, null, 4) + '\n');
    console.info('\nRevisions were updated successfully');
}

async function readRevisions() {
    try {
        return await fs.readJSON(REVISIONS_PATH);
    } catch (e) {
        throw new NestedError(`Could not read Chromium revisions file`);
    }
}

process.on('unhandledRejection', (reason, p) => {
    console.error('Unhandled Rejection:\nPromise: ', p, '\nReason: ', reason);
});

updateRevisions().catch(e => {
    console.error('\nCould not update Chromium revisions file:', e);
    process.exit(1);
});
