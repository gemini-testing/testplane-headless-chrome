'use strict';

const parseConfig = require('lib/parse-config');
const {config: configDefaults} = require('lib/constants/defaults');

describe('lib/parse-config', () => {
    const getDefaultOpts = () => ({
        browserId: 'default-browser-id'
    });

    describe('"enabled" option', () => {
        it('should be true by default', () => {
            const opts = getDefaultOpts();

            assert.isTrue(parseConfig(opts).enabled);
        });

        it('should be set from configuration file', () => {
            const opts = getDefaultOpts();
            opts.enabled = false;

            const config = parseConfig(opts);

            assert.isFalse(config.enabled);
        });

        it('should throw error if passed value is not boolean', () => {
            const opts = getDefaultOpts();
            opts.enabled = 'false';

            assert.throws(() => parseConfig(opts), /option must be boolean, but got string/);
        });
    });

    describe('"browserId" option', () => {
        it('should throws on missing', () => {
            const opts = getDefaultOpts();
            delete opts.browserId;

            assert.throws(() => parseConfig(opts));
        });

        it('should be set from configuration file', () => {
            const opts = getDefaultOpts();
            opts.browserId = 'foo-bar';

            const config = parseConfig(opts);

            assert.equal(config.browserId, 'foo-bar');
        });

        it('should validate if passed value is number', () => {
            const opts = getDefaultOpts();
            opts.browserId = 10;

            assert.throws(() => parseConfig(opts), /option must be string, but got number/);
        });
    });

    describe('"version" option', () => {
        it('should be null by default', () => {
            const opts = getDefaultOpts();

            assert.isNull(parseConfig(opts).version);
        });

        it('should be set from configuration file', () => {
            const opts = getDefaultOpts();
            opts.version = '76';

            const config = parseConfig(opts);

            assert.equal(config.version, '76');
        });

        it('should validate if passed value is not string', () => {
            const opts = getDefaultOpts();
            opts.version = 76;

            assert.throws(() => parseConfig(opts), /option must be string, but got number/);
        });
    });

    describe('"cachePath" option', () => {
        it('should has default value', () => {
            const opts = getDefaultOpts();

            assert.equal(parseConfig(opts).cachePath, configDefaults.cachePath);
        });

        it('should be set from configuration file', () => {
            const opts = getDefaultOpts();
            opts.cachePath = 'chromium/base/path';

            const config = parseConfig(opts);

            assert.equal(config.cachePath, 'chromium/base/path');
        });

        it('should validate if passed value is not string', () => {
            const opts = getDefaultOpts();
            opts.cachePath = 28;

            assert.throws(() => parseConfig(opts), /option must be string, but got number/);
        });
    });

    describe('"downloadAttempts" option', () => {
        it('should has default value', () => {
            const opts = getDefaultOpts();

            assert.equal(parseConfig(opts).downloadAttempts, configDefaults.downloadAttempts);
        });

        it('should be set from configuration file', () => {
            const opts = getDefaultOpts();
            opts.downloadAttempts = 10;

            const config = parseConfig(opts);

            assert.equal(config.downloadAttempts, 10);
        });

        it('should validate if passed value is not number', () => {
            const opts = getDefaultOpts();
            opts.downloadAttempts = 'foo';

            assert.throws(() => parseConfig(opts), /option must be number, but got string/);
        });
    });
});
