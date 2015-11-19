'use strict';

var sqldb = require('../sqldb');

var Alias = sqldb.Alias;
var AliasController = {};

AliasController.getAlias = function(user, team_id, slack_user_id) {
   return Alias.findOne({
      where: {
         user_id: user._id,
         team_id: team_id
      }
   }).then(function(alias) {
      if (alias) return alias;
      else return Alias.create({
         user_id: user._id,
         team_id: team_id,
         slack_user_id: slack_user_id
      });
   });
};

AliasController.findByTag = function(tag, team_id) {
   console.log(tag, team_id);
   if (tag.match(/^<@(.*)>$/)) {
      tag = tag.replace(/^<@(.*)>$/g, '$1');

      return Alias.findOne({
         where: {
            slack_user_id: tag,
            team_id: team_id
         }
      });
   }
   else if (tag.match(/^<#(.*)$/)) {
      tag = tag.replace(/^<#(.*)>$/g, '$1');

      return Alias.findOne({
         where: {
            user_id: tag,
            team_id: team_id
         }
      });
   }
};

module.exports = AliasController;
