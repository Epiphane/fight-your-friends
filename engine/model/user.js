'use strict';

var crypto = require('crypto');

module.exports = function(sequelize, DataTypes) {
   return sequelize.define('user', {
      _id: {
         type: DataTypes.INTEGER,
         allowNull: false,
         primaryKey: true
      },
      email: {
         type: DataTypes.STRING,
         allowNull: false,
         unique: {
           msg: 'The specified email address is already in use.'
         },
         validate: {
           isEmail: true
         }
      },
      password: {
         type: DataTypes.STRING,
         allowNull: false
      },
      salt: DataTypes.STRING,
      AI: {
         type: DataTypes.BOOLEAN,
         defaultValue: false
      },
      level: {
         type: DataTypes.INTEGER,
         defaultValue: 0
      },
      experience: {
         type: DataTypes.INTEGER,
         defaultValue: 0
      },
      gold: {
         type: DataTypes.INTEGER,
         defaultValue: 0
      },
   }, {
      getterMethods: {
         tag: function(user) {
            if (!this.alias) return this._id;
            return this.alias.tag;
         }
      },

      /**
      * Pre-save hooks
      */
      hooks: {
         beforeBulkCreate: function(users, fields, fn) {
            var totalUpdated = 0;
            users.forEach(function(user) {
               user.updatePassword(function(err) {
                  if (err) {
                     return fn(err);
                  }
                  totalUpdated += 1;
                  if (totalUpdated === users.length) {
                     return fn();
                  }
               });
            });
         },
         beforeCreate: function(user, fields, fn) {
            user.updatePassword(fn);
         },
         beforeUpdate: function(user, fields, fn) {
            // console.log(user);
            if (user.changed('password')) {
               user.updatePassword(fn);
            }
            else {
               fn();
            }
         }
      },

      /**
      * Instance Methods
      */
      instanceMethods: {
         format: function() {
            return {
               user_id: this._id,
               tag: this.tag,
               name: this.alias.slack_name
            };
         },

         say: function(message, type) {
            return {
               type: type,
               user_id: this._id,
               md_text: message
            };
         },

         /**
         * Authenticate - check if the passwords are the same
         *
         * @param {String} password
         * @param {Function} callback
         * @return {Boolean}
         * @api public
         */
         authenticate: function(password, callback) {
            if (!callback) {
               return this.password === this.encryptPassword(password);
            }

            var _this = this;
            this.encryptPassword(password, function(err, pwdGen) {
               if (err) {
                  callback(err);
               }

               if (_this.password === pwdGen) {
                  callback(null, true);
               }
               else {
                  callback(null, false);
               }
            });
         },

         /**
         * Make salt
         *
         * @param {Number} byteSize Optional salt byte size, default to 16
         * @param {Function} callback
         * @return {String}
         * @api public
         */
         makeSalt: function(byteSize, callback) {
            var defaultByteSize = 16;

            if (typeof arguments[0] === 'function') {
               callback = arguments[0];
               byteSize = defaultByteSize;
            }
            else if (typeof arguments[1] === 'function') {
               callback = arguments[1];
            }

            if (!byteSize) {
               byteSize = defaultByteSize;
            }

            if (!callback) {
               return crypto.randomBytes(byteSize).toString('base64');
            }

            return crypto.randomBytes(byteSize, function(err, salt) {
               if (err) {
                  callback(err);
               }
               return callback(null, salt.toString('base64'));
            });
         },

         /**
         * Encrypt password
         *
         * @param {String} password
         * @param {Function} callback
         * @return {String}
         * @api public
         */
         encryptPassword: function(password, callback) {
            if (!password || !this.salt) {
               if (!callback) {
                  return null;
               }
                  return callback(null);
               }

               var defaultIterations = 10000;
               var defaultKeyLength = 64;
               var salt = new Buffer(this.salt, 'base64');

               if (!callback) {
                  return crypto.pbkdf2Sync(password, salt, defaultIterations, defaultKeyLength).toString('base64');
               }

               return crypto.pbkdf2(password, salt, defaultIterations, defaultKeyLength, function(err, key) {
                  if (err) {
                     callback(err);
                  }
                  return callback(null, key.toString('base64'));
               });
         },

         /**
         * Update password field
         *
         * @param {Function} fn
         * @return {String}
         * @api public
         */
         updatePassword: function(fn) {
            // Handle new/update passwords
            if (this.password) {
               if (!this.password && authTypes.indexOf(this.provider) === -1) {
                  fn(new Error('Invalid password'));
               }

               // Make salt with a callback
               var _this = this;
               this.makeSalt(function(saltErr, salt) {
                  if (saltErr) {
                     fn(saltErr);
                  }
                  _this.salt = salt;
                  _this.encryptPassword(_this.password, function(encryptErr, hashedPassword) {
                     if (encryptErr) {
                        fn(encryptErr);
                     }
                     _this.password = hashedPassword;
                     fn(null);
                  });
               });
            } else {
               fn(null);
            }
         }
      }
   });
};