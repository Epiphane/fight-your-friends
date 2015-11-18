'use strict';

var sqldb = require('../sqldb');

var Token = sqldb.Token;
var UserController = require('./user');

var TokenController = {};

TokenController.generateToken = function(user) {
   return Token.create({
      user_id: user.alias.user_id,
      team_id: user.alias.team_id
   }).then(function(token) {
      return token.token;
   });
};

TokenController.validate = function(token) {
   return Token.findOne({
      where: {
         token: token,
         expires: {
            $gte: new Date()
         }
      }
   }).then(function(token) {
      if (!token) {
         return null;
      }
      
      return UserController.findById(token.user_id, token.team_id);
   });
}

module.exports = TokenController;
