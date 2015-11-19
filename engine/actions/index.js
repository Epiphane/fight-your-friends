var _ = require('lodash');
var A = require('./response');
var assert = require('./assert');

var notActions = ['.DS_Store', 'assert.js', 'index.js'];

module.exports = {};
require("fs").readdirSync(__dirname).forEach(function(file) {
   if (notActions.indexOf(file) >= 0 || !file.match(/.js$/)) return;

   file = file.substr(0, file.length - 3);

   module.exports = _.merge(module.exports, require('./' + file)(A, assert));
});

