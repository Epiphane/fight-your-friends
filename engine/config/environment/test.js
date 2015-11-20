'use strict';

// Test specific configuration
// ==================================
module.exports = {
  sequelize: {
    uri: process.env.TEST_DATABASE_URL,
    options: {
      dialog: 'postgres',
      port: 5432,
      logging: false
    }
  }
};
