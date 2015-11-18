'use strict';

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('fight', {
    _id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    team_id: {
      type: DataTypes.STRING,
      allowNull: false
    },
    channel_id: {
      type: DataTypes.STRING,
      allowNull: false
    },
    // winner: {
    //   type: DataTypes.INTEGER,
    //   defaultValue: null
    // },
    length: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    deleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  }, {
    instanceMethods: {
      recordAction: function(user, description) {
        return this.increment('length').then(function(fight) {
          return fight.createAction({
            _id: fight.length,
            description: description,
            user_id: user._id
          });
        });
      }
    }
  });
};