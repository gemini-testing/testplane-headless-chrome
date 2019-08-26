'use strict';

const _ = require('lodash');
const {root, section, option} = require('gemini-configparser');

const {config: configDefaults} = require('./constants/defaults');

const ENV_PREFIX = 'hermione_headless_chrome_';
const CLI_PREFIX = '--headless-chrome-';

const assertType = (name, validationFn, type) => {
    return (v) => {
        if (!validationFn(v)) {
            throw new Error(`"${name}" option must be ${type}, but got ${typeof v}`);
        }
    };
};

const assertBoolean = (name) => assertType(name, _.isBoolean, 'boolean');
const assertString = (name) => assertType(name, _.isString, 'string');
const assertNumber = (name) => assertType(name, _.isNumber, 'number');

const getParser = () => {
    return root(section({
        enabled: option({
            defaultValue: true,
            parseEnv: JSON.parse,
            parseCli: JSON.parse,
            validate: assertBoolean('enabled')
        }),
        browserId: option({
            validate: assertString('browserId')
        }),
        version: option({
            defaultValue: configDefaults.version,
            validate: (value) => _.isNull(value) || assertString('version')(value)
        }),
        cachePath: option({
            defaultValue: configDefaults.cachePath,
            validate: assertString('cachePath')
        }),
        downloadAttempts: option({
            defaultValue: configDefaults.downloadAttempts,
            validate: assertNumber('downloadAttempts')
        })
    }), {envPrefix: ENV_PREFIX, cliPrefix: CLI_PREFIX});
};

module.exports = (options) => {
    const {env, argv} = process;

    return getParser()({options, env, argv});
};
