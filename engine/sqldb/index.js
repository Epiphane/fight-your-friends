/**
 * Sequelize initialization module
 */

'use strict';

var path = require('path');
var config = require('../config/environment');

var Sequelize = require('sequelize');

var db = {
   Sequelize: Sequelize,
   sequelize: new Sequelize(config.sequelize.uri, config.sequelize.options)
};

function importModel(name) {
   return db.sequelize.import(path.join(
      config.root,
      'engine',
      'model',
      name
   ));
}

// Insert models below
var User      = db.User = importModel('user');
var Alias     = db.Alias = importModel('alias');
var Fight     = db.Fight = importModel('fight');
var Fighting  = db.Fighting = importModel('fighting');
var Action    = db.Action = importModel('action');
var Item      = db.Item = importModel('item');
var Token     = db.Token = importModel('token');

Token.belongsTo(User, { foreignKey: 'user_id' });

// User has many items and aliases
Alias.belongsTo(User, { foreignKey: 'user_id' });
User.hasMany(Alias, { foreignKey: 'user_id' });
User.hasMany(Item, { foreignKey: 'user_id', constraints: false });

// User has a weapon and armor
User.belongsTo(Item, { as: 'weapon', foreignKey: 'weapon_id' });
User.belongsTo(Item, { as: 'armor', foreignKey: 'armor_id' });

// Every fighting is a relationship between User and Fight
User.belongsToMany(Fight, {
   through: {
      model: Fighting,
      unique: false,
   },
   foreignKey: 'user_id'
});
Fight.belongsToMany(User, {
  through: {
    model: Fighting,
    unique: false,
  },
  foreignKey: 'fight_id'
});

// Fight has a list of actions
Fight.belongsTo(User, { as: 'winner', foreignKey: 'winner_id' });
Fight.hasMany(Action, { foreignKey: 'fight_id' });
Action.belongsTo(User, { foreignKey: 'user_id' });

// Set up auto ID generation
function autogenerate_ids(Model, field) {
   Model.options.hooks.beforeValidate = function(instance) {
      if (!instance.getDataValue('_id')) {
         instance.setDataValue('_id', Math.floor(Math.random() * 99999999));
      }
   };

   Model.options.hooks.beforeBulkCreate = function(instances) {
      var promise;

      for (var i = instances.length - 1; i >= 0; i--) {
         (function(instance) {
            if (promise) {
               promise.then(function() {
                  return instance.Model.runHooks('beforeValidate', instance);
               });
            }
            else {
               promise = instance.Model.runHooks('beforeValidate', instance);
            }
         })(instances[i]);
      };

      return promise;
   };
};

autogenerate_ids(Fight, '_id');
autogenerate_ids(User, '_id');
autogenerate_ids(Item, '_id');

module.exports = db;