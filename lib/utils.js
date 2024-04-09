'use strict';

const _ = require('lodash');
const fs = require('fs-extra');
const path = require('path');
const got = require('got');
const compareVersions = require('compare-versions');
const NestedError = require('nested-error-stacks');

const {HTTP_REQUEST_RETRIES, REVISIONS_PER_REQUEST} = require('./constants/defaults');
const API_HOST = 'https://chromiumdash.appspot.com';

const getPlatformName = () => {
    const {platform, arch} = process;

    if (platform === 'darwin') {
        return 'mac';
    }

    if (platform === 'win32') {
        return arch === 'x64' ? 'Windows' : 'Win32';
    }

    return platform;
};

const getLastStableMajor = async (platformName) => {
    const url = `${API_HOST}/fetch_releases?channel=Stable&platform=${platformName}&num=1`;

    try {
        const response = await got(url, {json: true, retry: HTTP_REQUEST_RETRIES});
        const obj = response.body[0];

        return {
            major: obj.milestone,
            version: obj.version,
            revision: obj.chromium_main_branch_position
        };
    } catch (e) {
        throw new NestedError(`Could not get Chromium last stable version for ${platformName}`, e);
    }
};

const getSavedRevision = async (platformName, version, cachePath) => {
    try {
        const filePath = path.resolve(__dirname, './constants/revisions.json');
        const revisions = await fs.readJSON(filePath);

        const revision = _.get(revisions, [platformName, version]);
        if (revision) {
            return revision;
        }

        const hotCachePath = path.resolve(cachePath, './revisions.json');
        if (fs.existsSync(hotCachePath)) {
            const revisionsCache = await fs.readJSON(hotCachePath);

            return _.get(revisionsCache, [platformName, version]);
        }
    } catch (e) {
        throw new NestedError('Could not read Chromium revisions file', e);
    }
};

const getStableReleases = async (platformName, {num = 150, offset = 0} = {}) => {
    const url = `${API_HOST}/fetch_releases?channel=stable&platform=${platformName}&num=${num}&offset=${offset}`;

    let response = null;
    try {
        response = await got(url, {json: true, retry: HTTP_REQUEST_RETRIES});
    } catch (e) {
        throw new NestedError('Could not get Chromium full versions', e);
    }

    if (_.isEmpty(response.body)) {
        throw new Error(`Platform "${platformName}" is unsupported for downloading Chromium`);
    }

    return _.map(response.body, (obj) => ({
        version: obj.version,
        revision: obj.chromium_main_branch_position
    })).sort((a, b) => compareVersions(a.version, b.version)).reverse();
};

const getFullVersion = (versions, shortVer) => {
    const fullVersion = _.find(versions, (item) => _.startsWith(item, shortVer));

    if (!fullVersion) {
        throw new Error(`Chromium version ${shortVer} was not found`);
    }

    return fullVersion;
};

const tryGetRevision = async (platformName, version, {num = 150, offset = 0} = {}) => {
    const stableReleases = await getStableReleases(platformName, {num, offset});

    try {
        const fullVersion = getFullVersion(stableReleases.map(release => release.version), version);
        return stableReleases.find(v => v.version === fullVersion).revision;
    } catch (_) {
        return null;
    }
};

const getRevision = async (platformName, version, cachePath) => {
    const savedRevision = await getSavedRevision(platformName, version, cachePath);

    if (savedRevision) {
        return savedRevision;
    }

    for (let requestNum = 0; requestNum <= 3; requestNum++) {
        const num = REVISIONS_PER_REQUEST;
        const offset = REVISIONS_PER_REQUEST * requestNum;
        const revision = await tryGetRevision(platformName, version, {num, offset});

        if (revision) {
            return revision;
        }
    }

    throw new Error(`Chromium version ${version} was not found`);
};

const saveRevision = async (platformName, version, revision, cachePath) => {
    try {
        const filePath = path.resolve(cachePath, './revisions.json');
        const revisionsCache = await fs.readJSON(filePath).catch(() => {}) || {};

        if (!revisionsCache[platformName]) {
            revisionsCache[platformName] = {};
        }
        revisionsCache[platformName][version] = revision;

        return fs.writeJSON(filePath, revisionsCache);
    } catch (e) {
        throw new NestedError('Could not save Chromium revision number', e);
    }
};

module.exports = {
    getPlatformName,
    getLastStableMajor,
    getSavedRevision,
    getStableReleases,
    getFullVersion,
    getRevision,
    saveRevision
};
