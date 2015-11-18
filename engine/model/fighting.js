'use strict';

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('fighting', {
    fight_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    status: {
      type: DataTypes.STRING,
      defaultValue: 'progress'
    },
    health: {
      type: DataTypes.INTEGER,
      defaultValue: 100
    }
  });
};