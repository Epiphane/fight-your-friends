var Engine  = require('../engine');
var A       = Engine.Response;
var _       = require('lodash');

module.exports = function(io) {
   var connections = {};

   function indexOf(channel_id, user) {
      var users = connections[channel_id];
      if (!users) return -1;

      var user_id = user._id || user;

      // Binary search the users
      var ndx = Math.floor(users.length / 2);
      var top = users.length - 1;
      var bottom = 0;

      while (top >= bottom) {
         if (users[ndx]._id === user_id) {
            return ndx;
         }
         else if (users[ndx]._id > user_id) {
            top = ndx - 1;
         }
         else {
            bottom = ndx + 1;
         }

         ndx = Math.floor(top + bottom) / 2;
      }

      return -1;
   }

   var addUser = function(user, channel_id) {
      io.to(channel_id).emit('users add', user.format());

      var users = connections[channel_id] || [];

      users.splice(_.sortedIndex(users, user, function(user) {
         return user._id;
      }), 0, user);

      connections[channel_id] = users;
   };

   var removeUser = function(user, channel_id) {
      io.to(channel_id).emit('users remove', user._id);

      var users = connections[channel_id] || [];

      users.splice(indexOf(channel_id, user), 1);

      connections[channel_id] = users;
   };

   var Connection = function(socket) {
      this.socket = socket;
      this.user = null;
      this.team_id = null;
      this.validated = false;
      this.channel_id = null;

      this.handler = function(message) {
         this.send(new A.Error('Team ID not sent yet'));
      }

      var self = this;
      socket.on('disconnect', function() {
         if (self.user) {
            removeUser(self.user, self.channel_id);
         }
      });
   };

   Connection.prototype.broadcastUser = function() {
      if (!this.channel_id || !this.user) return false;

      addUser(this.user, this.channel_id);

      this.socket.emit('users add', _.map(connections[this.channel_id], function(user) { 
         return user.format();
      }));

      return true;
   };

   Connection.prototype.formatAttachments = function(result) {
      var self = this;
      var attachments = {};

      function push(user_id, attach) {
         attachments[user_id] = attachments[user_id] || [];
         attachments[user_id].push(attach);
      }

      function concat(user_id, attachs) {
         while (attachs.length) {
            push(user_id, attachs.shift());
         }
      }

      if (Array.isArray(result)) {
         _.forEach(result, function(a) {
            var formatted = self.formatAttachments(a);

            for (var user_id in formatted) {
               concat(user_id, formatted[user_id]);
            }
         });
      }
      else {
         if (!result.user_id) result.user_id = this.user._id;

         push(result.user_id, {
            type: result.type || 'good',
            text: result.text,
            md_text: result.md_text
         });

         if (result.next) {
            var formatted = self.formatAttachments(result.next);

            for (var user_id in formatted) {
               concat(user_id, formatted[user_id]);
            }
         }

         if (result.mentions) {
            _.forEach(result.mentions, function(mention) {
               var formatted = self.formatAttachments(mention);

               for (var user_id in formatted) {
                  concat(user_id, formatted[user_id]);
               }
            });
         }

         if (result.updateUser) {
            this.sendUserInfo();
         }

         return attachments;
      }
   };

   Connection.prototype.send = function(attachment) {
      if (Array.isArray(attachment)) {
         var self = this;
         this.socket.emit('attachments', _.map(res, function(attachment) {
            return attachment.toAttachment(self.user);
         }));
      }
      else {
         this.socket.emit('attachment', attachment.toAttachment(this.user));
      }
   };

   Connection.prototype.setTeam = function(team_id) {
      this.team_id = team_id;
      this.handler = this.login;
   };

   Connection.prototype.setChannel = function(channel_id) {
      if (this.channel_id) {
         this.socket.leave(this.channel_id);
      }

      this.channel_id = channel_id;
      this.socket.join(this.channel_id);

      this.broadcastUser();
   };

   Connection.prototype.setUser = function(user) {
      this.user = user;
      this.socket.join('user ' + user._id + '_' + this.team_id);
   };

   Connection.prototype.setToken = function(token) {
      var self = this;
      Engine.validateToken(token).then(function(user) {
         if (user) {
            self.token = token;
            self.team_id = user.alias.team_id;
            self.setUser(user);
            self.validated = true;
            self.handler = self.act;
            self.sendToken(token);
            self.broadcastUser();
         }
         else {
            self.socket.emit('team');
            self.send({
               type: 'small',
               text: 'Enter your email to log in.'
            });
         }
      })
   };

   Connection.prototype.sendToken = function(token) {
      this.socket.emit('token', token);
      this.sendUserInfo();
   };

   Connection.prototype.sendUserInfo = function() {
      this.socket.emit('user', {
         user_id: this.user._id,
         tag: this.user.tag,
         name: this.user.alias.slack_name,
         email: this.user.email,
         level: this.user.level,
         experience: this.user.experience,
         gold: this.user.gold
      });
   };

   Connection.prototype.lookup = function(tag, callback) {
      var self = this;

      if (tag[0] === '@') {
         tag = tag.substr(1);
         Engine.lookup(tag, this.team_id, this.channel_id).then(function(result) {
            callback(_.map(result, function(user) { return user.format(); }));
         });
      }
      else if (tag[0] === '#') {
         tag = tag.substr(1);
         Engine.findUserById(tag, this.team_id).then(function(user) {
            callback(user.format());
         });
      }
   };

   Connection.prototype.login = function(email) {
      var self = this;
      Engine.findUserByEmail(email, this.team_id).then(function(user) {
         if (user) {
            self.setUser(user);

            self.handler = self.validate;
            self.send([
               new A.Good('Welcome back, ' + user.email + '!'),
               new A.Small('Please enter your password.')
            ]);
            self.socket.emit('password');
         }
         else {
            var re = /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i;
            if (re.test(email)) {
               Engine.createUser(email, self.team_id).then(function(user) {
                  self.handler = self.register;
                  self.setUser(user);

                  self.send([
                     new A.Good('Welcome to Fight Your Friends!'),
                     new A.Small('Please enter a password for your account.')
                  ]);

                  self.socket.emit('password');
                  self.socket.emit('confirm');
               });
            }
            else {
               self.send(new A.Error('Sorry, that is not a valid email.'));
            }
         }
      });
   };

   Connection.prototype.logout = function() {
      if (this.user) {
         this.socket.leave('user ' + this.user._id + '_' + this.team_id);

         removeUser(this.user, this.channel_id);
         this.user = null;
         this.setToken(null);
      }

      this.handler = this.login;
      this.validated = false;
   }

   Connection.prototype.validate = function(password) {
      var self = this;
      Engine.authenticate(this.user, password, this.team_id).then(function(token) {
         if (token) {
            self.validated = true;

            self.handler = self.act;
            self.send(new A.Good('Authentication Successful!'));
            self.sendToken(token);
            self.broadcastUser();
         }
         else {
            self.send(new A.Error('No match found for this user and password. Please try again.'))
         }
      });
   }

   Connection.prototype.register = function(password) {
      var self = this;
      this.user.update({
         password: password
      }).then(function() {
         self.validated = true;

         self.send(new A.Good('Account created!'));
         self.handler = self.act;

         Engine.authenticate(self.user, password).then(function(token) {
            self.sendToken(token);
         });
      });
   };

   Connection.prototype.sendError = function(tag, e) {
      console.error(tag, e);
      if (!(e.isResponse || (Array.isArray(e) && e[0].isResponse))) {
         e = new Engine.A.Error('Error: ' + e.message);
      }
      return this.send(e);
   }

   Connection.prototype.act = function(command) {
      if (!this.channel_id) {
         this.send(new A.Error('Channel ID not set'));
         return;
      }

      var argv = _.compact(command.split(' '));

      if (Engine.actions[argv[0]]) {
         try {
            var self = this;
            var result = Engine.actions[argv[0]](this.user, this.channel_id, argv);
         
            if (result.then) {
               result.then(function(res) {
                  self.send(res);

                  // var formatted = self.formatAttachments(res);

                  // console.log(formatted);
                  // for (var user_id in formatted) {
                  //    var attachments = formatted[user_id];
                  //    if (user_id === self.user_id) {
                  //       self.send(attachments);
                  //    }
                  //    else if (Array.isArray(attachments)) {
                  //       io.to('user ' + user_id + '_' + self.team_id).emit('attachments', attachments);
                  //    }
                  //    else {
                  //       io.to('user ' + user_id + '_' + self.team_id).emit('attachment', attachments);
                  //    }
                  // }
               }).catch(function(e) {
                  self.sendError('S Error 1:', e);
               });
            }
            else if (typeof(result) === 'string') {
               self.send(new A.Good(result));
            }
            else {
               self.send(result);
            }
         }
         catch (e) {
            self.sendError('S Error 2:', e);
         }
      }
      else {
         this.send(new A.Error('Sorry, `' + argv[0] + '` is not a command'));
      }
   };

   Connection.prototype.handle = function(message) {
      this.handler.apply(this, arguments);
   };

   return Connection;
};