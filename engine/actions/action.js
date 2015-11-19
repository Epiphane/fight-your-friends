'use strict';

var FightController = require('../controller/fight');
var ItemController = require('../controller/item');

module.exports = function(A, assert) {
   return {
      use: function(user, channel_id, argv) {
         assert.usage(argv[1], '|use| XXX');

         // Am I in a fight?
         return FightController.requireTurn(user, channel_id, true).then(function(fight) {
            return ItemController.getItem(user, 'move', argv[1]).then(function(move) {
               assert(move, 'You don\'t have a move named `' + argv[1] + '`!');

               return FightController.useMove(fight, user, move);
            });
         });
      }
   };
};