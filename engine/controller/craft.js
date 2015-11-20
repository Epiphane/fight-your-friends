'use strict';

require('../util');

var _ = require('lodash');
var sqldb = require('../sqldb');
var assert = require('../actions/assert');
var A = require('../actions/response');

var Fighting = sqldb.Fighting;
var Fight = sqldb.Fight;
var User = sqldb.User;
var Item = sqldb.Item;

var FightController = require('./fight');
var UserController = require('./user');

var Warning = require('../warning');

var CraftController = {};

var elements = {
   physical: ['haste', 'strength', 'toughness']
};

var alignments = {
   haste:      { 'Iron':   'iron', 'Water': 'water' },
   strength:   { 'Earth': 'earth', 'Iron':  'iron' },
   toughness:  { 'Earth': 'earth', 'Water': 'water' }
};

var origins = {
   'toughness:water': ['alliance', 'village'],
   'toughness:earth': ['cliff', 'cave'],
   'haste:iron':      ['trees', 'skies'],
   'haste:water':     ['tsunami', 'typhoon'],
   'strength:earth':  ['forest', 'cavern'],
   'strength:iron':   ['forge', 'mechanical']
};

var virtues = {
   trees: { freedom: 0, order: 2 },
   skies: { attentiveness: 3, individuality: 4 },
   tsunami: { honor: 0, loyalty: 1 },
   typhoon: { cooperation: 0, resilience: 5 },
   forest: { justice: 0, loyalty: 2 },
   cavern: { mystery: 0, elusiveness: 4 },
   forge: { sharp: 0, heavy: 2 },
   mechanical: { preparedness: 4, strategy: 5 },
   alliance: { diplomacy: 4, steadfastness: 5 },
   village: { coalition: 0, government: 2 },
   cliff: { vigilance: 0, support: 3 },
   cave: { watchfulness: 1, strategy: 5 }
};

var traits = {
   elemental: ['wind', 'electric', 'forest', 'cavern'],
   physical: ['strength', 'iron', 'fighting', 'typhoon', 'cliff'],
   luck: ['haste', 'sparrow', 'eagle', 'tsunami', 'mechanical', 'alliance'],
   defense: ['toughness', 'water', 'earth', 'village', 'cave']
};

CraftController.generateQuestion = (function() {
   function craftify(strings) {
      return _.map(strings, function(str) { return '`|[craft ]' + str.ucwords() + '|`' }).join(' or ');
   };

   function generateQuestion(item) {
      if (!item.name) return 'What is the name of your creation? `|craft |itemName`';
      if (!item.type) return 'Is your creation a move or an item? `|[craft move]|` or `|[craft item]|`';
      
      var stats = item.getDataValue('stats') || {};
      // Required order: element, alignment, origin, virtue
      if (stats.virtue || stats.virtue === 0) return 'Type `|[craft complete]|` to finish ' + item.name + '!';
      if (stats.origin) {
         return 'Choose a Virtue: ' + craftify(_.keys(virtues[stats.origin]));
      }
      if (stats.alignment) {
         return 'Choose an Origin: ' + craftify(origins[stats.element + ':' + stats.alignment]);
      }
      if (stats.element) {
         return 'Choose an Alignment: ' + craftify(_.keys(alignments[stats.element]));
      }
      return 'Choose an Element: ' + craftify(elements.physical);
   };

   return function(item) {
      return new A.Good(generateQuestion(item));
   };
})()

CraftController.begin = function(user, channel_id, itemName) {
   return Item.create({
      name: itemName,
      type: '',
   }).then(function(item) {
      return CraftController.getCraftbot().then(function(craftbot) {
         return Fight.create({
            channel_id: channel_id,
            team_id: user.alias.team_id
         }).then(function(fight) {
            return fight.addUsers([ user, craftbot ], { health: item._id }).then(function(fightings) {
               return fight.recordAction(user, user.tag + ' wants to begin crafting!');
            });
         });
      }).then(function() {
         return CraftController.generateQuestion(item);
      });
   });
};

CraftController.verifyStat = function(values, response) {
   if (_.indexOf(values, response) < 0) {
      return null;
   }
   return response;
};

CraftController.incStats = function(stats, trait) {
   _.forEach(['elemental', 'physical', 'luck', 'defense'], function(traitType) {
      if (_.indexOf(traits[traitType], trait) >= 0) {
         stats[traitType] += 5;
      }
   });

   return stats;
};

CraftController.abort = function(user, session) {
   assert (session, 'You are not crafting anything.');

   return Item.update({
      deleted: true
   }, {
      where: { _id: session.fighting.health }
   }).then(function() {
      return CraftController.getCraftbot();
   }).then(function(craftbot) {
      return session.setWinner(craftbot);
   }).then(function() {
      return Fighting.update({
         status: 'aborted',
      }, {
         where: {
            fight_id: session._id,
         }
      });
   }).then(function() {
      return session.recordAction(user, user.tag + ' aborted item creation.');
   }).then(function() {
      return new A.Warning('Crafting aborted!');
   });
};

CraftController.handle = function(user, session, response) {
   return session.recordAction(user, 'User response: ' + response).then(function() {
      return Item.findById(session.fighting.health).then(function(item) {
         assert(item, 'Error finding item in DB');

         if (response) { 
            if (!item.name) return item.update({ name: response });

            else if (!item.type) {
               if (response === 'move' || response === 'item') {
                  return item.update({ type: response });
               }
               else {
                  return item;
               }
            }

            else { // It's a stat for the item!
               var stats = item.getDataValue('stats') || {};

               if (!stats.element) {
                  stats.element = CraftController.verifyStat(elements.physical, response);
               }
               else if (!stats.alignment) {
                  if (origins[stats.element + ':' + response]) {
                     stats.alignment = response;
                  }
               }
               else if (!stats.origin) {
                  stats.origin = CraftController.verifyStat(origins[stats.element + ':' + stats.alignment], response);
               }
               else if (!stats.virtue && stats.virtue !== 0) {
                  stats.virtue = virtues[stats.origin][response];
               }
               else if (response === 'complete') {
                  stats.elemental = 7 + Math.floor(Math.pow(Math.random() * 3, Math.random() + 1));
                  stats.physical  = 12 + Math.floor(Math.pow(Math.random() * 3, Math.random() + 1));
                  stats.defense   = Math.floor(Math.pow(Math.random() * 3, 1.5));
                  stats.luck      = Math.floor(Math.pow(Math.random() * 2, 2));

                  switch (stats.virtue) {
                     case 0:
                        stats.elemental += 10;
                        stats.physical += 10;
                        break;
                     case 1:
                        stats.elemental += 5;
                        stats.physical += 10;
                        stats.luck += 5;
                        break;
                     case 2:
                        stats.elemental += 5;
                        stats.physical += 10;
                        stats.defense += 5;
                        break;
                     case 3:
                        stats.luck += 10;
                        stats.physical += 10;
                        break;
                     case 4:
                        stats.elemental += 5;
                        stats.luck += 10;
                        stats.defense += 5;
                        break;
                     case 5:
                        stats.elemental += 5;
                        stats.defense += 10;
                        stats.physical += 5;
                        break;
                  }

                  stats = CraftController.incStats(stats, stats.origin);
                  stats = CraftController.incStats(stats, stats.alignment);
                  stats = CraftController.incStats(stats, stats.element);

                  return item.update({ stats: stats }).then(function() {
                     return item.setUser(user);
                  }).then(function() {
                     return session.setWinner(user);
                  }).then(function() {
                     return Fighting.update({
                        status: 'complete',
                     }, {
                        where: {
                           fight_id: session._id,
                        }
                     });
                  }).then(function() {
                     return session.recordAction(user, item.name + ' created!');
                  }).then(function() {
                     // Cut execution here
                     throw new A.Good(item.name + ' created!');
                  })
               }

               return item.update({ stats: stats });
            }
         }

         return item;
      });
   }).then(function(item) {

      return CraftController.generateQuestion(item);
   });
};

var craftbot = null;
CraftController.getCraftbot = function() {
   if (craftbot) {
      return { then: function(cb) { return cb(craftbot); } };
   }

   return User.findById(1).then(function(user) {
      if (user) return user;
      else {
         return User.create({
            _id: 1,
            email: 'craft@thomassteinke.com',
            password: 'craft_thomassteinke',
         });
      }
   }).then(function(user) {
      return UserController.getAlias(user, 'GLOBAL');

   }).then(function(user) {
      craftbot = user;
      return craftbot;
   });
};

CraftController.findSession = function(user, channel_id) {
   return FightController.findFight(user, channel_id, true).then(function(fight) {
      if (fight) {
         return CraftController.getCraftbot().then(function(craftbot) {
            assert(fight.opponents[0]._id === craftbot._id, 'You cannot craft in the middle of a fight!');
         
            return fight;
         });
      }

      return fight;
   });
};

module.exports = CraftController;
