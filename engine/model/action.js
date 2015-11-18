'use strict';

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('action', {
    fight_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    _id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    description: DataTypes.STRING,
  });
};