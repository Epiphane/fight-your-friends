var express    = require('express');
var app        = new express();
var Engine     = require('../../engine');
var bodyParser = require('body-parser');

module.exports = app;

// app.use(bodyParser.json());
// app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
//   extended: true
// })); 
app.use(bodyParser.urlencoded({
  extended: true
}));

app.get('/', function(req, res) {
   res.end('Hello!');
});

app.get('/lookup', function(req, res) {
   res.end('[]');
   return;
   if (!req.query.name) res.end('[]');
   else {
      Engine.lookup(req.query.name).then(function(result) {
         res.json(result).end();
      });
   }
});

app.post('/slack', function(req, res) {
   console.log(req.body);
   res.json(req.query).end();
});