'use strict';

const _ = require('lodash');
const fs = require('fs-extra');
const path = require('path');
const got = require('got');
const compareVersions = require('compare-versions');
const NestedError = require('nested-error-stacks');

const {HTTP_REQUEST_RETRIES} = require('./constants/defaults');
const API_HOST = 'https://omahaproxy.appspot.com';

const getOSName = () => {
    const {platform, arch} = process;

    if (platform === 'darwin') {
        return 'mac';
    }

    if (platform === 'win32') {
        return arch === 'x64' ? 'win64' : 'win';
    }

    return platform;
};

const getLastStableMajor = async (osName) => {
    const url = `${API_HOST}/all.json?channel=stable&os=${osName}`;

    try {
        const response = await got(url, {json: true, retry: HTTP_REQUEST_RETRIES});
        const versions = response.body[0]['versions'];
        const fullVersion = versions[0]['current_version'];

        return fullVersion.split('.').shift();
    } catch (e) {
        throw new NestedError(`Could not get Chromium last stable version for ${osName}`, e);
    }
};

const getSavedRevision = async (osName, version, cachePath) => {
    try {
        const filePath = path.resolve(__dirname, './constants/revisions.json');
        const revisions = await fs.readJSON(filePath);

        const revision = revisions[osName][version];
        if (revision) {
            return revision;
        }

        const hotCachePath = path.resolve(cachePath, './revisions.json');
        if (fs.existsSync(hotCachePath)) {
            const revisionsCache = await fs.readJSON(hotCachePath);

            return revisionsCache[osName][version];
        }
    } catch (e) {
        throw new NestedError('Could not read Chromium revisions file', e);
    }
};

const requestRevision = async (fullVersion) => {
    const url = `${API_HOST}/deps.json?version=${fullVersion}`;

    try {
        const response = await got(url, {json: true, retry: HTTP_REQUEST_RETRIES});

        return response.body.chromium_base_position;
    } catch (e) {
        throw new NestedError('Could not get Chromium revision number', e);
    }
};

const getStableVersions = async (osName) => {
    const url = `${API_HOST}/history.json?channel=stable&os=${osName}`;

    let response = null;
    try {
        response = await got(url, {json: true, retry: HTTP_REQUEST_RETRIES});
    } catch (e) {
        throw new NestedError('Could not get Chromium full versions', e);
    }

    if (_.isEmpty(response.body)) {
        throw new Error(`Platform "${osName}" is unsupported for downloading Chromium`);
    }

    return _.map(response.body, (obj) => obj.version).sort(compareVersions).reverse();
};

const getFullVersion = (versions, shortVer) => {
    const fullVersion = _.find(versions, (item) => _.startsWith(item, shortVer));

    if (!fullVersion) {
        throw new Error(`Chromium version ${shortVer} was not found`);
    }

    return fullVersion;
};

const getRevision = async (osName, version, cachePath) => {
    const savedRevision = await getSavedRevision(osName, version, cachePath);
    if (savedRevision) {
        return savedRevision;
    }

    const stableVersions = await getStableVersions(osName);
    const fullVersion = getFullVersion(stableVersions, version);

    return await requestRevision(fullVersion);
};

const saveRevision = async (osName, version, revision, cachePath) => {
    try {
        const filePath = path.resolve(cachePath, './revisions.json');
        const revisionsCache = await fs.readJSON(filePath).catch(() => {}) || {};

        if (!revisionsCache[osName]) {
            revisionsCache[osName] = {};
        }
        revisionsCache[osName][version] = revision;

        return fs.writeJSON(filePath, revisionsCache);
    } catch (e) {
        throw new NestedError('Could not save Chromium revision number', e);
    }
};

module.exports = {
    getOSName,
    getLastStableMajor,
    getSavedRevision,
    requestRevision,
    getStableVersions,
    getFullVersion,
    getRevision,
    saveRevision
};
