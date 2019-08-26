'use strict';

const proxyquire = require('proxyquire');
const fs = require('fs-extra');

describe('lib/download-chromium-by-version', () => {
    let downloadChromiumByVersion = null;
    let ensureDir = null;
    const downloadChromium = sinon.stub();

    beforeEach(() => {
        ensureDir = sinon.stub(fs, 'ensureDir');

        downloadChromiumByVersion = proxyquire('lib/download-chromium-by-version', {
            'download-chromium': downloadChromium,
            './utils': {
                getOSName: sinon.stub().resolves('some-os'),
                getRevision: sinon.stub().resolves('6225')
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
});
