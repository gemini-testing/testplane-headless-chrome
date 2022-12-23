'use strict';

const proxyquire = require('proxyquire');
const fs = require('fs-extra');
const path = require('path');
const process = require('process');

describe('lib/utils', () => {
    let utils;
    let got;

    beforeEach(() => {
        got = sinon.stub();
        utils = proxyquire('lib/utils', {
            'got': got
        });
    });

    afterEach(() => sinon.restore());

    describe('get current OS name', () => {
        it('should return process "platform" if it is not "darwin" or "win32"', () => {
            sinon.stub(process, 'platform').value('some-platform');

            const osName = utils.getOSName();

            assert.equal(osName, 'some-platform');
        });

        it('should return "mac" if "platform" is "darwin', () => {
            sinon.stub(process, 'platform').value('darwin');

            const osName = utils.getOSName();

            assert.equal(osName, 'mac');
        });

        it('should return "win64" if "platform" is "win32" and "arch" is "x64"', () => {
            sinon.stub(process, 'platform').value('win32');
            sinon.stub(process, 'arch').value('x64');

            const osName = utils.getOSName();

            assert.equal(osName, 'win64');
        });

        it('should return "win" if "platform" is "win32" and "arch" is not "64"', () => {
            sinon.stub(process, 'platform').value('win32');
            sinon.stub(process, 'arch').value('x32');

            const osName = utils.getOSName();

            assert.equal(osName, 'win');
        });
    });

    describe('get last stable major', () => {
        it('should return last major for passed OS', async () => {
            got.resolves({body: [{
                versions: [{'current_version': '76.0.120.5'}]
            }]});

            const major = await utils.getLastStableMajor('mac');

            assert.equal(major, '76');
        });

        it('should throw if request was failed', () => {
            got.rejects();

            assert.isRejected(utils.getLastStableMajor('mac'), /Could not get Chromium last stable/);
        });
    });

    describe('get revision from file', () => {
        it('should return revision from file for passed version', async () => {
            sinon.stub(path, 'resolve').resolves();
            sinon.stub(fs, 'readJSON').resolves({'some-os': {'76': 6525}});

            const revision = await utils.getSavedRevision('some-os', '76');

            assert.equal(revision, 6525);
        });

        it('should return undefined if version was not found in file', async () => {
            sinon.stub(path, 'resolve').resolves();
            sinon.stub(fs, 'readJSON').resolves({'some-os': {'76': 6525}});

            const revision = await utils.getSavedRevision('some-os', 'bar');

            assert.isUndefined(revision);
        });

        it('should read from hot cache file if version was not found in static file', async () => {
            const readJSON = sinon.stub(fs, 'readJSON');

            sinon.stub(path, 'resolve').resolves();
            sinon.stub(fs, 'existsSync').resolves();
            readJSON.onFirstCall().resolves({'some-os': {'76': 6525}});
            readJSON.onSecondCall().resolves({'some-os': {'106': 1036822}});

            const revision = await utils.getSavedRevision('some-os', '106');

            assert.equal(revision, 1036822);
        });

        it('should throws if could not read Chromium revisions file', () => {
            sinon.stub(path, 'resolve').resolves();
            sinon.stub(fs, 'readJSON').rejects();

            assert.isRejected(utils.getSavedRevision('some-os', '76'), /Could not read Chromium revisions file/);
        });
    });

    describe('request revision', () => {
        it('should return revision from request for passed full version', async () => {
            got.resolves({body: {'chromium_base_position': '6225'}});

            const revision = await utils.requestRevision('76.0.130.5');

            assert.equal(revision, 6225);
        });

        it('should throws if request was failed', () => {
            got.rejects();

            assert.isRejected(utils.requestRevision('76.0.130.5'), /Could not get Chromium revision/);
        });
    });

    describe('get stable versions for passed OS', () => {
        it('should return array of versions', async () => {
            got.resolves({body: [
                {version: '74.0.100.3'}, {version: '75.0.110.2'}
            ]});

            const versions = await utils.getStableVersions('os');

            assert.deepEqual(versions, ['75.0.110.2', '74.0.100.3']);
        });

        it('should throws if request was failed', () => {
            got.rejects();

            assert.isRejected(utils.getStableVersions('os'), /Could not get Chromium full versions/);
        });

        it('should throws if request return empty array', () => {
            got.resolves({body: []});

            assert.isRejected(utils.getStableVersions('os'), /is unsupported for downloading Chromium/);
        });
    });

    describe('get full version', () => {
        it('should return full version for passed short version', () => {
            const versions = ['76.0.130.10', '75.0.110.2', '74.0.100.3'];
            const shortVersion = '75';

            const fullVersion = utils.getFullVersion(versions, shortVersion);

            assert.equal(fullVersion, '75.0.110.2');
        });

        it('should throws if version was not found', () => {
            const versions = ['76.0.130.10', '75.0.110.2', '74.0.100.3'];
            const shortVersion = '790';

            assert.throw(() => utils.getFullVersion(versions, shortVersion), /version 790 was not found/);
        });
    });

    describe('get revision for passed OS and version', () => {
        it('should returns saved revision', async () => {
            sinon.stub(path, 'resolve').resolves();
            sinon.stub(fs, 'readJSON').resolves({'some-os': {'76': 6525}});

            const revision = await utils.getRevision('some-os', '76');

            assert.equal(revision, 6525);
        });

        it('should returns requested revision', async () => {
            sinon.stub(path, 'resolve').resolves();
            sinon.stub(fs, 'readJSON').resolves({'some-os': {}});
            got.onFirstCall().resolves({body: [
                {version: '74.0.100.3'}, {version: '75.0.110.2'}
            ]});
            got.onSecondCall().resolves({body: {'chromium_base_position': '6335'}});

            const revision = await utils.getRevision('some-os', '75');

            assert.equal(revision, 6335);
        });
    });

    describe('revisions cache file', () => {
        it('should save revision to file', async () => {
            const writeJsonStub = sinon.stub(fs, 'writeJSON');

            await utils.saveRevision('some-os', '106', '1036822', '/cache/path');

            assert.calledOnceWith(writeJsonStub, '/cache/path/revisions.json', {'some-os': {'106': '1036822'}});
        });

        it('should read revision from file', async () => {
            const readJSON = sinon.stub(fs, 'readJSON');

            sinon.stub(fs, 'existsSync').resolves();
            readJSON.onFirstCall().resolves({'some-os': {'75': '6335'}});
            readJSON.onSecondCall().resolves({'some-os': {'106': '1036822'}});

            const revision = await utils.getSavedRevision('some-os', '106', 'cache/path');

            assert.equal(revision, 1036822);
        });
    });
});
