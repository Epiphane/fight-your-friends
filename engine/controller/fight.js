'use strict';

var Sequelize = require('sequelize');
var sqldb = require('../sqldb');
var Warning = require('../warning');

var AIController = require('./ai');
var UserController = require('./user');

var Alias = sqldb.Alias;
var User = sqldb.User;
var Fighting = sqldb.Fighting;
var Fight = sqldb.Fight;

var FightController = {};

FightController.create = function(channel_id, user1, user2) {
   if (user1._id === user2._id) throw new Warning('You cannot fight yourself!');

   return Fight.create({
      channel_id: channel_id,
      team_id: user1.alias.team_id
   }).then(function(fight) {
      return fight.addUsers([ user1, user2 ]).then(function() {
         fight.recordAction(user1, user1.tag + ' challenges ' + user2.tag + '!');
      });
   });
};

var elements = ['water', 'earth', 'iron'];//, 'wind', 'electric', 'fighting'];
var superEffective = {
   'water': ['iron'],
   'earth': ['water', 'electric'],
   'iron': ['earth', 'fighting'],
   'wind': ['electric', 'wind'],
   'electric': ['water', 'fighting'],
   'fighting': ['wind', 'earth'],
   'none': []
};
var notEffective = {
   'water': ['earth', 'electric'],
   'earth': ['iron', 'fighting'],
   'iron': ['water'],
   'wind': ['fighting'],
   'electric': ['wind', 'earth'],
   'fighting': ['electric', 'iron'],
   'none': []
};

FightController.useMove = function(fight, user, move) {
   var opponent = fight.opponents[0];
   var messages = [];

   return user.getWeapon().then(function(weapon) {
      messages.push(user.tag + ' uses `' + move.name + '` with `' + weapon.name + '`!');

      return opponent.getArmor().then(function(armor) {

         var moveAlignment = move.stats.alignment;
         var armorAlignment = armor.stats.alignment;

         var physical = move.stats.physical + weapon.stats.physical;
         var elemental = move.stats.elemental;

         if (weapon.stats.alignment === move.stats.alignment) {
            elemental += weapon.stats.elemental;
         }

         if (superEffective[moveAlignment].indexOf(armorAlignment) >= 0) {
            elemental *= 1.5;
            messages.push('It\'s super effective!!');
         }
         else if (notEffective[moveAlignment].indexOf(armorAlignment) >= 0) {
            elemental /= 2;
            messages.push('It\'s not very effective...');
         }

         if (Math.random() * 100 <= 5 + move.stats.luck + weapon.stats.luck) {
            physical *= 1.5;
            elemental *= 1.5;
            messages.push('Critical hit!');
         }

         // Compute Damage
         var damage = Math.max(2, physical * (1 - armor.stats.physical / 100) - armor.stats.defense);
             damage += Math.max(2, elemental * (1 - armor.stats.elemental / 100) - armor.stats.defense);

         damage = Math.round(damage);
         messages.push('(' + damage + ' damage) ');

         // Update health
         opponent.fighting.setDataValue('user_id', opponent._id);
         opponent.fighting.setDataValue('fight_id', fight._id);
         return opponent.fighting.update({
            health: opponent.fighting.health - damage
         });

      });
   }).then(function() {
      if (opponent.fighting.health <= 0) {
         return FightController.registerWinner(fight, user);
      }
      else return null; // continue...

   }).then(function() {
      if (opponent.fighting.health > 0) {
         messages[messages.length - 1] += opponent.tag + ' now has ' + opponent.fighting.health + ' health';
      }
      else {
         messages[messages.length - 1] += opponent.tag + ' fainted!!';
      }

      return fight.recordAction(user, messages.join('\n'));
   }).then(function() {
      var result = {
         type: 'good',
         md_text: messages,
         mentions: [opponent.say(messages, 'warning')]
      };

      if (opponent.AI && opponent.fighting.health > 0) {
         // Translate the fight so
         return AIController.move(opponent, fight.channel_id).then(function(res) {
            res.user_id = opponent._id;
            result.next = res;

            return result;
         });
      }

      return result;
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
               $or: [
                  { team_id: user.alias.team_id },
                  { team_id: 'GLOBAL' }
               ]
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

FightController.requireTurn = function(user, channel_id, getOpponents) {
   return FightController.requireFight(user, channel_id, getOpponents).then(function(fight) {
      return fight.getActions({
         where: {
            createdAt: {
               $gte: new Date(new Date().getTime() - 5*60000) // 5 minutes
            }
         },
         order: '_id DESC'
      }).then(function(actions) {
         if (actions.length && actions[0].user_id === user._id) {
            throw new Warning('It is not your turn! (if your opponent does not go for 5 minutes, it will become your turn)');
         }

         return fight;
      });
   });
};

module.exports = FightController;
