'use strict';

var Sequelize = require('sequelize');
var sqldb = require('../sqldb');
var Warning = require('../warning');

var UserController = require('./user');

var Alias = sqldb.Alias;
var User = sqldb.User;
var Fighting = sqldb.Fighting;
var Fight = sqldb.Fight;

var FightController = {};

ActionController.use = function(channel_id, user1, user2) {
   return Fight.create({
      channel_id: channel_id,
      team_id: user1.alias.team_id
   }).then(function(fight) {
      return fight.addUsers([ user1, user2 ]).then(function() {
         fight.recordAction(user1, user1.tag + ' challenges ' + user2.tag + '!');
      });
   });
};

FightController.registerWinner = function(fight, user) {
   return fight.setWinner(user).then(function() {
      return Fighting.update({
         status: 'lose',
      }, {
         where: {
            fight_id: fight._id,
            user_id: {
               $ne: user._id
            }
         }
      })
   }).then(function() {
      return Fighting.update({
         status: 'win'
      }, {
         where: {
            fight_id: fight._id,
            user_id: user._id
         }
      });
   });
};

FightController.findFight = function(user, channel_id, getOpponents) {
   return user.getFights({
      where: {
         channel_id: channel_id,
         winner_id: null
      },
      joinTableAttributes: ['health']
   }).then(function(fight) {
      fight = fight[0];
      if (!getOpponents || !fight) {
         return fight;
      }
      else {
         return FightController.getOpponents(user, fight).then(function(opponents) {
            fight.opponents = opponents;
            return fight;
         });
      }
   });
};

FightController.getOpponents = function(user, fight) {
   return fight.getUsers({
      where: {
         _id: {
            $ne: user._id
         }
      },
      joinTableAttributes: ['health'],
      include: [
         {
            model: Alias,
            where: {
               team_id: user.alias.team_id
            }
         }
      ]
   }).then(function(opponents) {
      opponents.forEach(function(opponent) { opponent.alias = opponent.aliases[0]; });

      return opponents;
   });
};

FightController.requireNoFight = function(user, channel_id, getOpponents) {
   return FightController.findFight(user, channel_id, getOpponents).then(function(fight) {
      if (fight) throw new Warning('You\'re already in a fight!');
   })
};

FightController.requireFight = function(user, channel_id, getOpponents) {
   return FightController.findFight(user, channel_id, getOpponents).then(function(fight) {
      if (!fight) throw new Warning('You cannot do that unless you\'re in a fight!');

      return fight;
   });
};

module.exports = FightController;
