'use strict';

var _ = require('lodash');
var assert = require('../actions/assert');

var sqldb = require('../sqldb');
var User = sqldb.User;
var Alias = sqldb.Alias;
var Item = sqldb.Item;

var AliasController = require('./alias');
var AppController = require('./app');
var UserController = {};

// Restrict methods on db.User model
var PrivateUserMethods = {};
_.forEach(['findOne', 'findAll', 'findById'], function(methodName) {
   PrivateUserMethods[methodName] = User[methodName].bind(User);
});

var randomLetters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890';
function randomString(length) {
   var str = '';

   while (str.length < length) {
      str += randomLetters[Math.floor(Math.random() * randomLetters.length)];
   }

   return str;
};

UserController.create = function(values, team_id) {
   assert(team_id, 'Team ID is required');
   assert(values.email, 'Email is required');

   if (!values.password) {
      values.password = randomString(16);
   }

   return User.create(values).then(function(user) {
      return Item.bulkCreate([
         {
            user_id: user._id,
            name: 'attack',
            stats: {
               alignment: 'none',
               physical: 15
            },
            type: 'move'
         }, {
            user_id: user._id,
            name: 'fists',
            stats: {
               alignment: 'none',
               physical: 15
            },
            type: 'item'
         }, {
            user_id: user._id,
            name: 'clothes',
            stats: {
               alignment: 'none',
               physical: 8,
               defense: 7
            },
            type: 'item'
         }
      ]).then(function(items) {
         return user.update({
            weapon_id: items[1]._id,
            armor_id: items[2]._id
         });
      }).then(function() {
         return UserController.getAlias(user, team_id);
      });
   });
};

UserController.getAlias = function(user, team_id, slack_user_id) {
   if (user) {
      return AliasController.getAlias(user, team_id, slack_user_id).then(function(alias) {
         user.alias = alias;

         return user;
      });
   }

   return { then: function(cb) { return cb(user); } };
};

UserController.findAll = function(team_id, params) {
   params = params || {};
   params.include = params.include || [];
   params.include.push({
      model: Alias,
      where: { team_id: team_id }
   });

   return User.findAll(params).then(function(users) {
      _.forEach(users, function(user) {
         user.alias = user.aliases[0];
      });

      return users;
   });
};

UserController.findById = function(user_id, team_id, slack_user_id) {
   return User.findById(user_id).then(function(user) {
      return UserController.getAlias(user, team_id, slack_user_id);
   });
};

UserController.findBySlackId = function(slack_user_id, team_id) {
   return User.findOne({
      include: {
         model: Alias,
         where: {
            slack_user_id: slack_user_id,
            team_id: team_id
         }
      }
   }).then(function(user) {
      if (user) {
         user.alias = user.aliases[0];
         return user;
      }

      // Create a user and alias
      return AppController.getUserInfo(team_id, slack_user_id).then(function(profile) {
         var email = profile.email;

         return UserController.findByEmail(email, team_id, slack_user_id).then(function(user) {
            if (user) return user;

            return UserController.create({
               email: email
            });
         }).then(function(user) {
            return UserController.getAlias(user, team_id, slack_user_id);
         });
      })
   })
};

UserController.findByEmail = function(email, team_id, slack_user_id) {
   return User.findOne({
      where: {
         email: email
      }
   }).then(function(user) {
      return UserController.getAlias(user, team_id, slack_user_id);
   });
};

UserController.lookup = function(name, team_id) {
   return User.findAll({
      include: [{
         model: Alias,
         where: {
            slack_name: { 
               $iLike: name + '%',
               $ne: 'Unnamed'
            },
            team_id: team_id
         }
      }]
   }).then(function(users) {
      users.forEach(function(user) { user.alias = user.aliases[0]; });

      return users;
   });
};

UserController.findByTag = function(tag, team_id) {
   return AliasController.findByTag(tag, team_id).then(function(alias) {
      if (alias) {
         return User.findOne({
            where: {
               _id: alias.user_id
            }
         }).then(function(user) {
            user.alias = alias;

            return user;
         });
      }

      return null;
   });
};

module.exports = UserController;
