'use strict';

const path = require('path');
const os = require('os');

module.exports = {
    HTTP_REQUEST_RETRIES: 5,
    REVISIONS_PER_REQUEST: 150,
    config: {
        version: null,
        cachePath: path.join(os.homedir(), 'hermione-headless-chrome'),
        downloadAttempts: 30
    }
};
