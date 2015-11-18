var express = require('express');
var app     = new express();
var Engine  = require('../../engine');

module.exports = app;

app.get('/', function(req, res) {
   res.end('Hello!');
});

app.get('/lookup', function(req, res) {
   res.end('[]');
   return;
   if (!req.query.name) res.end('[]');
   else {
      Engine.lookup(req.query.name).then(function(result) {
         res.end(JSON.stringify(result));
      });
   }
});