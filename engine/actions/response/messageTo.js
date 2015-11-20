var _ = require('lodash');

module.exports = require('./response').extend({
   color: 'good',
   size: 'normal',
   user_id: null,
   initialize: function(user, text, color) {
      this.color = color || this.color;
      this.text = text;

      if (!Array.isArray(this.text)) {
         this.text = [this.text];
      }

      if (user) {
         this.user_id = user._id;
      }
   },
   toSlackAttachment: function(user) {
      if (this.user_id === null) {
         return this.toAttachment(user);
      }
      else {
         return null;
      }
   },
   toAttachment: function(user) {
      return {
         author_name: user ? '@' + user.alias.slack_name : '',
         author_icon: 'https://s3-us-west-2.amazonaws.com/slack-files2/avatars/2015-10-21/12951962519_a5f5bebd7affa4fc602b_48.jpg',
         fallback: 'Message: ' + this.text.join('\n'),
         color: this.color,
         size: this.size,
         text: this.text.join('\n'),
         mrkdwn_in: ['text', 'pretext']
      };
   },
   toString: function(user) {
      return this.text.join('\n');
   }
});
