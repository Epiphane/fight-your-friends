'use strict';

module.exports = function(sequelize, DataTypes) {
   return sequelize.define('alias', {
      team_id: {
         type: DataTypes.STRING,
         allowNull: false,
         primaryKey: true
      },
      user_id: {
         type: DataTypes.INTEGER,
         allowNull: false,
         primaryKey: true
      },
      slack_user_id: {
         type: DataTypes.STRING
      },
      slack_name: {
         type: DataTypes.STRING,
         defaultValue: 'Unnamed'
      }
   }, {
      getterMethods: {
         hidden: function() {
            return this.slack_name === 'Unnamed';
         },
         tag: function() {
            if (this.slack_user_id) {
               return '<@' + this.slack_user_id + '>';
            }
            return '<#' + this.user_id + '>';
         }
      }
   });
};