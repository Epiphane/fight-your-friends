require('../../util');

module.exports = {};

require("fs").readdirSync(__dirname).forEach(function(file) {
   file = file.substr(0, file.length - 3);
   if (file === 'index') return;

   module.exports[file.ucwords()] = require('./' + file);
});

