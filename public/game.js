(function(window) {
   var Game = window.Game = {};

   var token = localStorage.getItem('token');
   var socket;
   var user;
   var users = [];
   var usersByName = [];
   var User = function(info) {
      this.user_id = info.user_id;
      this.tag = info.tag;
      this.name = info.name;
   };

   User.prototype.toString = function() { return this.name; };

   function binSearch(user_id, compare, find) {
      user_id = user_id.user_id || user_id;
      compare = compare || 'user_id';

      var arr = (compare === 'user_id' ? users : usersByName);

      // Binary search users
      var ndx = Math.floor(arr.length / 2);
      var top = arr.length - 1;
      var bottom = 0;

      while (top >= bottom) {
         if (arr[ndx][compare] === user_id) {
            return ndx;
         }
         else if (arr[ndx][compare] > user_id) {
            top = ndx - 1;
         }
         else {
            bottom = ndx + 1;
         }

         ndx = Math.floor((top + bottom) / 2);
      }

      return find ? -1 : ndx + 1;
   }

   function indexOf(user_id, compare) {
      return binSearch(user_id, compare, true);
   }

   function addUser(_user) {
      if (user && user.user_id === _user.user_id || indexOf(_user) >= 0) {
         return;
      }

      if (_user.__proto__ !== User.prototype) {
         _user = new User(_user);
      }

      var nameNdx = binSearch(_user.name, 'name');
      usersByName.splice(nameNdx, 0, _user);
      var idNdx = binSearch(_user.user_id);
      users.splice(idNdx, 0, _user);

      // console.log(_.map(usersByName, function(u) { return u.name }));
      // console.log(_.map(users, function(u) { return u.user_id }));

      $('.user-' + _user.user_id).text('@' + _user.name);
   }

   Game.autocomplete = function(name, callback) {
      callback(_.filter(users, function(user) {
         return user.name.indexOf(name) === 0 && user.name !== 'Unnamed';
      }), true);

      socket.emit('lookup', '@' + name, function(users) {
         var result = [];
         while (users.length) {
            var user = users.shift();
            if (indexOf(user) === -1) {
               result.push(new User(user));
            }
         }

         callback(result);
         _.forEach(result, function(user) {
            addUser(user);
         });
      });
   };

   Game.lookup = function(tag) {
      if (tag === user.tag) return '@' + user.name;

      var user_id = tag.match(/<#(.*?)>/)[1];
      if (!user_id) return tag;
      else {
         var ndx = indexOf(parseInt(user_id, 10));

         if (ndx < 0) {
            socket.emit('lookup', '#' + user_id, function(user) {
               addUser(user);
            });
            return '[User ' + user_id + ']';
         }

         return '@' + users[ndx].name;
      }
   };

   Game.toTag = function(name) {
      if (user.name === name) return user.tag;

      var ndx = indexOf(name, 'name');
      return usersByName[ndx].tag;
   };

   Game.logout = function() {
      localStorage.removeItem('token');
      socket.emit('logout');
   }

   Game.init = function(sock) {
      socket = sock;

      socket.on('token', function(t) {
         token = t;
         localStorage.setItem('token', token);
      });

      socket.on('user', function(_user) {
         user = _user;
         $('.user-' + user.user_id).text('@' + user.name);
      });

      socket.on('users add', function(res) {
         if (!Array.isArray(res)) res = [res];

         for (var i = res.length - 1; i >= 0; i--) {
            addUser(res[i]);
         };
      });

      socket.on('users remove', function(res) {
         return;
         // if (!Array.isArray(res)) res = [res];

         // for (var i = res.length - 1; i >= 0; i--) {
         //    removeUser(res[i]);
         // };
      });

      socket.on('team', function() {
         socket.emit('team', 'THOMASSTEINKE');
      });

      var token = localStorage.getItem('token');
      socket.on('connect', function() {
         users = [];

         socket.emit('token', token);
         socket.emit('channel', 'MAIN');
      });
   }
})(window);