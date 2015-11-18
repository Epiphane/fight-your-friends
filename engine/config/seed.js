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

(function(dbSync) {
   dbSync().then(function() {
      
      console.log('Creating users...');
      return UserController.create({
         email: 'exyphnos@gmail.com',
         password: 'thomas'
      }).then(function(thomas) {

         return AliasController.getAlias(thomas, 'THOMASSTEINKE').then(function(alias) {
            thomas.alias = alias;
            alias.update({ slack_name: 'epiphane' });
         }).then(function() {

            console.log('Creating slackbot...');
            return UserController.create({
               email: 'slackbot@thomassteinke.com',
               password: 'slackbot',
               AI: true
            }).then(function(slackbot) {
               
               AliasController.getAlias(slackbot, 'THOMASSTEINKE').then(function(alias) {
                  slackbot.alias = alias;
                  alias.update({ slack_name: 'slackbot' });
               }).then(function() {

                  console.log('Creating basic fight...');
                  return FightController.create('TESTCHANNEL', thomas, slackbot);

               });
            });
         });
      });
   });
})(function() {
   console.log('Syncing tables...');
   function performAll(command, models, args) {
      var _models = [];
      for (var i = 0; i < models.length; i ++) _models.push(models[i]);
      models = _models;

      var model = models.shift();
      args = Array.prototype.slice.call(arguments, 2);

      console.log('Performing ' + command + ' on ' + model);
      var promise = model[command].apply(model, args);
      while (models.length > 0) {
         promise = (function(model) {
            return promise.then(function() {
               console.log('Performing ' + command + ' on ' + model);
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
