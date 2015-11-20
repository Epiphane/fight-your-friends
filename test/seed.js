process.env.PORT = 6060;
process.env.NODE_ENV = 'test';

global.LOG = function(data) {
   if (Array.isArray(data)) data = data.join('\n');

   console.log(data);
};

module.exports = require('../engine/config/seed');
module.exports.silent = true;