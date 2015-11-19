'use strict';

var Sequelize = require('sequelize');
var sqldb = require('../sqldb');
var request = require('request-promise');
var App = sqldb.App;

var AppController = {};

AppController.getUserInfo = function(team_id, user_id) {
   return App.findById(team_id).then(function(app) {
      if (!app) throw { type: 'warning', message: 'App not installed for team ' + team_id };

      return request('https://slack.com/api/users.info', {
         method: 'POST',
         headers: {'content-type' : 'application/x-www-form-urlencoded'},
         form: {
            token: app.api_token,
            user: user_id
         },
      }).then(function(response) {
         response = JSON.parse(response);

         return response.user.profile;
      });
   });
};

// AppController.postMessage = function(team, )

module.exports = AppController;
