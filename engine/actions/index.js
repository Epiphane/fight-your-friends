var _ = require('lodash');

module.exports = _.merge(
   require('./status'),
   require('./items'),
   require('./fight'),
   require('./action'),
   require('./craft'),
   require('./help')
);