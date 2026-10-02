const path = require('path');
const Module = require('module');

// Force Node to resolve modules from apps/api/node_modules first
process.env.NODE_PATH = path.resolve(__dirname, 'node_modules');
Module._initPaths();

// Now start the app
require('./dist/apps/api/src/main');
