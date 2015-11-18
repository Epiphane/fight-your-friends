'use strict';

var Sequelize = require('sequelize');
var sqldb = require('../sqldb');
var Warning = require('../warning');

var ItemController = require('./item');
var FightController = require('./fight');

var AIController = {};

AIController.move = function(user, channel_id) {
   if (!FightController.fightFight) FightController = require('./fight');

   return FightController.findFight(user, channel_id, true).then(function(fight) {
      return ItemController.find(user, 'move').then(function(moves) {
         return FightController.useMove(fight, user, moves[Math.floor(Math.random() * moves.length)]);
      });
   });
};

module.exports = AIController;
