process.env.PORT = 6060;
process.env.NODE_ENV = 'test';

global.LOG = function(data) {
   if (Array.isArray(data)) data = data.join('\n');

   console.log(data);
};

global.Seed = module.exports = require('../engine/config/seed');
Seed.silent = module.exports.silent = true;

global.expect = require('chai').expect;

global._ = require('lodash');

// Controllers
global.db = require('../engine/sqldb');
require('../engine/util');

require("fs").readdirSync(__dirname + '/../engine/controller/').forEach(function(file) {
   file = file.substr(0, file.length - 3);

   global[file.ucwords() + 'Controller'] = require('../engine/controller/' + file);
});