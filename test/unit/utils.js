'use strict';

const QEmitter = require('qemitter');

const defaultEvents = {
    INIT: 'fooBarInit'
};

exports.stubTool = (config, events = defaultEvents, isWorker = () => false) => {
    const tool = new QEmitter();

    tool.config = config;
    tool.events = events;
    tool.isWorker = isWorker;

    return tool;
};
