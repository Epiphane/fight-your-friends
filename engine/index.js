process.env.NODE_ENV = process.env.NODE_ENV || 'development';

var sqldb = require('./sqldb');
var config = require('./config/environment');

// Populate databases with sample data
if (config.seedDB) { require('./config/seed')(); }

var UserController = require('./controller/user');
var TokenController = require('./controller/token');

var Engine = module.exports = {};

Engine.A = Engine.Response = require('./actions/response');

Engine.getSlackApp = function(team_id) {
   return sqldb.App.findById(team_id);
};

Engine.findUserByEmail = function(email, team_id) {
   return UserController.findByEmail(email, team_id);
};

Engine.findUserBySlackId = function(slack_id, team_id) {
   return UserController.findBySlackId(slack_id, team_id);
};

Engine.findUserById = function(user_id, team_id) {
   return UserController.findById(user_id, team_id);
};

Engine.lookup = function(name, team_id, channel_id) {
   return UserController.lookup(name, team_id, channel_id);
};

Engine.createUser = function(email, team_id) {
   return UserController.create({ email: email }, team_id);
}

Engine.authenticate = function(user, password) {
   if (user.authenticate(password)) {
      return TokenController.generateToken(user);
   }
   else {
      return { then: function(cb) { return cb(false); } };
   }
};

Engine.validateToken = function(token) {
   return TokenController.validate(token);
};

Engine.actions = require('./actions');
