var _       = require('lodash');
var request = require('request-promise');
var Engine  = require('../../engine');
var assert  = require('../../engine/actions/assert');

function Responder(user, channel_id) {
   this.user = user;
   this.channel_id = channel_id;
};

Responder.prototype.handle = function(argv) {
   if (Engine.actions[argv[0]]) {
      try {
         var self = this;
         var result = Engine.actions[argv[0]](this.user, this.channel_id, argv);
      
         if (result.then) {
            return result.then(function(result) {
               return self.send(result);
            }).catch(function(e) {
               return self.sendError('Error 2:', e);
            });
         }
         else {
            return this.send(result);
         }
      }
      catch (e) {
         return this.sendError('Error 1:', e);
      }
   }
   else {
      return this.send(new Engine.A.Warning('Sorry, `' + argv[0] + '` is not a command'));
   }
};

Responder.prototype.sendError = function(tag, e) {
   console.error(tag, e);
   if (!(e.isResponse || (Array.isArray(e) && e[0].isResponse))) {
      e = new Engine.A.Error('Error: ' + e.message);
   }
   console.log(e);
   return this.send(e);
}

Responder.prototype.send = function(responses) {
   if (!Array.isArray(responses)) {
      responses = [responses];
   }

   var self = this;
   return Engine.getSlackApp(this.user.alias.team_id).then(function(app) {
      if (app) {
         // Format package...
         var attachments = _.map(responses, function(response) {
            return response.toAttachment(self.user);
         });

         return request('https://slack.com/api/chat.postMessage', {
            method: 'POST',
            headers: {'content-type' : 'application/x-www-form-urlencoded'},
            form: {
               token: app.api_token,
               channel: self.channel_id,
               text: '',
               username: 'Fight Club™',
               attachments: JSON.stringify(attachments)
            },
         }).then(function(response) {
            response = JSON.parse(response);

            return !!response.ok;
         });
      }
      return false;
   }).then(function(posted) {
      if (posted) return {};

      // Format package...
      return {
         text: ' ' + _.map(responses, function(response) {
            return response.toString();
         }).join('\n')
      };
   });
};

/* Example body:
   { 
      user_name: 'thomas_steinke',
      text: 'status',
      trigger_word: 'status',
      team_id: 'T0B2LSLP6',
      channel_id: 'C0CS03RK4',
      user_id: 'U0B2QPTNU',
      token: 'zuE4F5lLtrHkL7DKbpiwFH4m'
   }
 */
module.exports = function(req, res) {
   if (!req.body.text) { res.json({ ok: false, text: 'No text provided' }).end(); return; }
   // More validation...

   Engine.findUserBySlackId(req.body.user_id, req.body.team_id).then(function(user) {
      var argv = _.compact(req.body.text.split(' '));
      if (argv[0] === 'fight' && Engine.actions[argv[1]]) {
         argv.shift();
      }

      if (req.body.user_name !== user.alias.slack_name) {
         user.alias.update({ slack_name: req.body.user_name });
      }

      var responder;
      responder = new Responder(user, req.body.channel_id);
      responder.handle(argv).then(function(result) {
         res.json(result).end();
      });
   }).catch(function(e) {
      res.json(e).end();
   });
};