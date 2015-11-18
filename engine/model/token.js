'use strict';

var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

function randomString(length) {
   var text = '';

   for(var i = 0; i < length; i ++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
   }

   return text;
}

module.exports = function(sequelize, DataTypes) {
   return sequelize.define('token', {
      token: {
         type: DataTypes.STRING,
         allowNull: false,
         primaryKey: true
      },
      expires: DataTypes.DATE,
      user_id: DataTypes.INTEGER,
      team_id: DataTypes.STRING
   }, {
      /**
      * Pre-save hooks
      */
      hooks: {
         beforeUpdate: function(token, fields, fn) {
            var expires = new Date();
            expires.setHours(expires.getHours() + 24);
            token.setDataValue('expires', expires);
         },

         beforeValidate: function(token) {
            if (!token.getDataValue('token')) {
               token.setDataValue('token', randomString(20));
            }

            var expires = new Date();
            expires.setHours(expires.getHours() + 24);
            token.setDataValue('expires', expires);
         }
      }
   });
};