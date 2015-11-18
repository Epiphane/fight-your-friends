'use strict';

// Development specific configuration
// ==================================
module.exports = {
  sequelize: {
    uri: process.env.DATABASE_URL,
    options: {
      dialog: 'postgres',
      port: 5432,
      logging: false//true
    }
  },

  seedDB: false
};
