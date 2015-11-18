'use strict';

var UserController = require('../controller/user');
var CraftController = require('../controller/craft');

var Craft = module.exports = {
   craft: function(user, channel_id, argv) {
      return CraftController.findSession(user, channel_id).then(function(session) {
         if (argv[1] === 'abort') {
            return CraftController.abort(user, session);
         }
         else if (!session) {
            return CraftController.begin(user, channel_id, argv.slice(1).join(' '));
         }
         else {
            return CraftController.handle(user, session, argv.slice(1).join(' '));
         }
      });
   }
};