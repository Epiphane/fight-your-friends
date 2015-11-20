/**
 * Populate DB with sample data on server start
 * to disable, edit config/environment/index.js, and set `seedDB: false`
 */

'use strict';

var sqldb = require('../sqldb');
var UserController = require('../controller/user');
var FightController = require('../controller/fight');
var AliasController = require('../controller/alias');

var User = sqldb.User;
var Fight = sqldb.Fight;
var Action = sqldb.Action;
var Fighting = sqldb.Fighting;
var Item = sqldb.Item;
var Token = sqldb.Token;
var Alias = sqldb.Alias;

var modelsSmallToLarge = [Alias, Token, Fighting, Action, Fight, User, Item];
var modelsLargeToSmall = [Item, User, Fight, Action, Fighting, Token, Alias];

module.exports = function() {
   var LOG = function(message) { 
      if (!module.exports.silent) console.log(message);
   }

   return (function(dbSync) {
      return dbSync().then(function() {
         
         LOG('Creating thomas...');
         return UserController.create({
            email: 'exyphnos@gmail.com',
            password: 'thomas'
         }, module.exports.TEAM).then(function(thomas) {

            thomas.alias.update({ slack_name: 'epiphane' });
            
            LOG('Creating slackbot...');
            return UserController.create({
               email: 'slackbot@thomassteinke.com',
               password: 'slackbot',
               AI: true
            }, module.exports.TEAM).then(function(slackbot) {
               
               slackbot.alias.update({ slack_name: 'slackbot' });

               LOG('Creating basic fight...');
               return FightController.create(module.exports.CHANNEL, thomas, slackbot);
            });
         });
      });
   })(function() {
      LOG('Syncing tables...');
      function performAll(command, models, args) {
         var _models = [];
         for (var i = 0; i < models.length; i ++) _models.push(models[i]);
         models = _models;

         var model = models.shift();
         args = Array.prototype.slice.call(arguments, 2);

         LOG('Performing ' + command + ' on ' + model);
         var promise = model[command].apply(model, args);
         while (models.length > 0) {
            promise = (function(model) {
               return promise.then(function() {
                  LOG('Performing ' + command + ' on ' + model);
                  return model[command].apply(model, args);
               })
            })(models.shift());
         }

         return promise;
      }

      return performAll('sync', modelsLargeToSmall, { force: true }).then(function() {
         return performAll('destroy', modelsSmallToLarge, { where: {} });
      });
   });
};
module.exports.TEAM = 'THOMASSTEINKE';
module.exports.CHANNEL = 'TEST';
module.exports.silent = false;
