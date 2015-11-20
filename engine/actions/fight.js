'use strict';

var UserController = require('../controller/user');
var AIController = require('../controller/ai');
var FightController = require('../controller/fight');

module.exports = function(A, assert) {
   return {
      fight: function(user, channel_id, argv) {
         assert.usage(argv[1], '|fight| @XXX');

         // Am I in a fight?
         return FightController.requireNoFight(user, channel_id).then(function() {

            return UserController.findByTag(argv[1], user.alias.team_id).then(function(opponent) {
               assert(opponent, 'User ' + argv[1] + ' not found.');

               // Are you in a fight?
               return FightController.requireNoFight(opponent, channel_id).then(function() {

                  return FightController.create(channel_id, user, opponent);
               }).then(function() {
                  return [
                     new A.Good('Bring it on, ' + opponent.tag + '!'),
                     new A.Warning(opponent, user.tag + ' challenges you to a fight! Bring it on!')
                  ];
               }).then(function(result) {
                  if (!opponent.AI) {
                     return result;
                  }
                  else {
                     return AIController.move(opponent, channel_id).then(function(res) {
                        result.concat(res);
                        return result;
                     });
                  }
               });
            });
         });
      },
      ping: function(user, channel_id) {
         // Am I in a fight?
         return FightController.requireFight(user, channel_id, true).then(function(fight) {
            var opponent = fight.opponents[0];

            return [
               new A.Info('You poked ' + opponent.tag + '!'),
               new A.Warning(opponent, 'Come on, ' + opponent.tag + '! Make a move!')
            ];
         });
      },
      forefeit: function(user, channel_id, argv) {
         // Am I in a fight?
         return FightController.requireFight(user, channel_id, true).then(function(fight) {
            return FightController.registerWinner(fight, user).then(function() {
               return [
                  new A.Good('You gave up! ' + fight.opponents[0].tag + ' wins!'),
                  new A.Good(fight.opponents[0], user.tag + ' gave up! You win!')
               ];
            });
         });
      }
   };
};