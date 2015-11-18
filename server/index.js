var express = require('express');
var app     = new express();
var http    = require('http').Server(app);
var io      = require('socket.io')(http);

var api     = require('./api');
var Connection = require('./connection')(io);

app.use('/api', api);
app.use('/', express.static(__dirname + '/../public/'));

http.listen(process.env.PORT || 3000, function(){
   console.log('listening on port ' + (process.env.PORT || 3000));
});

io.on('connection', function(socket) {
   var conn = new Connection(socket);

   socket.on('command', function(msg) {
      conn.handle(msg);
   });

   socket.on('token', function(token) {
      conn.setToken(token);
   });

   socket.on('channel', function(channel_id) {
      conn.setChannel(channel_id);
   });

   socket.on('lookup', function(tag, callback) {
      conn.lookup(tag, callback);
   });

   socket.on('team', function(team_id) {
      conn.setTeam(team_id);
   });

   socket.on('logout', function() {
      conn.logout();
   })
});