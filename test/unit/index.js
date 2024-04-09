'use strict';

const proxyquire = require('proxyquire');
const {stubTool} = require('./utils');

describe('index', () => {
    let plugin;
    const parseConfig = sinon.stub();
    const downloadChromium = sinon.stub();

    const mkTestplane_ = (config = {}, events) => stubTool(config, events);

    const initPlugin = (testplane, opts) => {
        parseConfig.returns(opts);
        return plugin(testplane, opts);
    };

    beforeEach(() => {
        plugin = proxyquire('index', {
            './lib/parse-config': parseConfig,
            './lib/download-chromium-by-version': downloadChromium
        });
    });

    it('should does nothing if plugin is disabled', () => {
        initPlugin(mkTestplane_(), {enabled: false});

        assert.notCalled(downloadChromium);
    });

    it('should throws if headless browser was not specified', () => {
        const testplane = mkTestplane_({browsers: {'foo-bar': {}}});
        const opts = {enabled: true, browserId: 'bar-foo'};

        assert.isRejected(initPlugin(testplane, opts));
    });

    it('should sets desired capabilities for passed browser', async () => {
        const browser = {desiredCapabilities: {}};
        const testplane = mkTestplane_({browsers: {'foo-bar': browser}});
        const expectedBrowser = {
            desiredCapabilities: {
                'goog:chromeOptions': {
                    args: ['headless'],
                    binary: 'path/to/bin'
                }
            }
        };
        downloadChromium.resolves('path/to/bin');

        initPlugin(testplane, {enabled: true, browserId: 'foo-bar'});
        await testplane.emitAndWait(testplane.events.INIT);

        assert.deepEqual(browser, expectedBrowser);
    });

    it('should union Chrome options for passed browser', async () => {
        const browser = {desiredCapabilities: {
            'goog:chromeOptions': {
                args: ['some-arg']
            }
        }};
        const testplane = mkTestplane_({browsers: {'foo-bar': browser}});
        const expectedBrowser = {
            desiredCapabilities: {
                'goog:chromeOptions': {
                    args: ['some-arg', 'headless'],
                    binary: 'path/to/bin'
                }
            }
        };
        downloadChromium.resolves('path/to/bin');

        initPlugin(testplane, {enabled: true, browserId: 'foo-bar'});
        await testplane.emitAndWait(testplane.events.INIT);

        assert.deepEqual(browser, expectedBrowser);
    });
});
