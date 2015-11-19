'use strict';

module.exports = function(sequelize, DataTypes) {
   return sequelize.define('app', {
      team_id: {
         type: DataTypes.STRING,
         allowNull: false,
         primaryKey: true
      },
      api_token: {
         type: DataTypes.STRING,
         allowNull: false
      },
      channel: {
         type: DataTypes.STRING
      }
   });
};