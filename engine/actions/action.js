'use strict';

var UserController = require('../controller/user');
var FightController = require('../controller/fight');
var ItemController = require('../controller/item');

var Warning = require('../warning');

var Action = module.exports = {
   use: function(user, channel_id, argv) {
      if (!argv[1]) throw 'Usage: `|use| XXX`';

      // Am I in a fight?
      return FightController.requireTurn(user, channel_id, true).then(function(fight) {
         return ItemController.getItem(user, 'move', argv[1]).then(function(move) {
            if (!move) return new Warning('You don\'t have a move named `' + argv[1] + '`!');

            return FightController.useMove(fight, user, move);
         });
      });
   }
};