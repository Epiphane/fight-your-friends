'use strict';

var FightController = require('../controller/fight');
var ItemController = require('../controller/item');

module.exports = function(A, assert) {
   return {
      use: function(user, channel_id, argv) {
         assert.usage(argv[1], '|use| XXX');

         // Am I in a fight?
         return FightController.requireTurn(user, channel_id, true).then(function(fight) {
            return ItemController.getItem(user, 'move', argv.slice(1).join(' ')).then(function(move) {
               assert(move, 'You don\'t have a move named `' + argv.slice(1).join(' ') + '`!');

               return FightController.useMove(fight, user, move);
            });
         });
      }
   };
};