'use strict';

const proxyquire = require('proxyquire');
const fs = require('fs-extra');

describe('lib/download-chromium-by-version', () => {
    let downloadChromiumByVersion = null;
    let ensureDir = null;
    let downloadChromium = null;
    let saveRevision = null;

    beforeEach(() => {
        ensureDir = sinon.stub(fs, 'ensureDir');
        saveRevision = sinon.stub();
        downloadChromium = sinon.stub();

        downloadChromiumByVersion = proxyquire('lib/download-chromium-by-version', {
            'download-chromium': downloadChromium,
            './utils': {
                getOSName: sinon.stub().resolves('some-os'),
                getRevision: sinon.stub().resolves('6225'),
                saveRevision
            }
        });
    });

    afterEach(() => sinon.restore());

    it('should make directory for passed cache path', async () => {
        downloadChromium.resolves('path/to/bin');

        await downloadChromiumByVersion('78', 'cache/path', 5);

        assert.calledOnceWith(ensureDir, 'cache/path');
    });

    it('should throw if could not create directory', () => {
        ensureDir.rejects();

        assert.isRejected(downloadChromiumByVersion('78', 'cache/path', 5), /Could not create directory/);
    });

    it('should return path to downloaded Chromium binary', async () => {
        downloadChromium.resolves('path/to/bin');

        const chromiumPath = await downloadChromiumByVersion('78', 'cache/path', 5);

        assert.equal(chromiumPath, 'path/to/bin');
    });

    it('should throws if could not download Chromium', () => {
        downloadChromium.rejects('Error');

        assert.isRejected(downloadChromiumByVersion('78', 'cache/path', 5), /Could not download Chromium/);
    });

    it('should throws if could not found Chromium build', () => {
        downloadChromium.rejects(new Error('Response code 404 (Not Found)'));

        assert.isRejected(downloadChromiumByVersion('787', 'cache/path', 5), /Could not find Chromium build/);
    });

    it('should save revision to cache', async () => {
        downloadChromium.onFirstCall().rejects(new Error('Response code 404 (Not Found)'));
        downloadChromium.onSecondCall().resolves('path/to/bin');
        saveRevision.resolves();

        await downloadChromiumByVersion('78', 'cache/path', 5);

        sinon.assert.calledOnce(saveRevision);
    });

    it('should not throws if could not save revision to cache', async () => {
        downloadChromium.onFirstCall().rejects(new Error('Response code 404 (Not Found)'));
        downloadChromium.onSecondCall().rejects(new Error('Response code 404 (Not Found)'));
        downloadChromium.onThirdCall().resolves('path/to/bin');
        saveRevision.rejects();

        await downloadChromiumByVersion('78', 'cache/path', 5);

        sinon.assert.calledOnce(saveRevision);
    });
});
