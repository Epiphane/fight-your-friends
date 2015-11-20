process.env.PORT = 6060;
process.env.NODE_ENV = 'test';

global.LOG = function(data) {
   if (Array.isArray(data)) data = data.join('\n');

   console.log(data);
};

global.Seed = module.exports = require('../engine/config/seed');
Seed.silent = module.exports.silent = true;

global.expect = require('chai').expect;

global.db = require('../engine/sqldb');
