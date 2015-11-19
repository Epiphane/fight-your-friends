var _ = require('lodash');

module.exports = require('./response').extend({
   color: 'good',
   initialize: function(text, color) {
      this.color = color || this.color;
      this.text = text;

      if (!Array.isArray(this.text)) {
         this.text = [this.text];
      }
   },
   toAttachment: function(user) {
      return {
         author_name: user ? '@' + user.alias.slack_name : '',
         author_icon: 'https://s3-us-west-2.amazonaws.com/slack-files2/avatars/2015-10-21/12951962519_a5f5bebd7affa4fc602b_48.jpg',
         fallback: 'Message: ' + this.text.join('\n'),
         color: this.color,
         text: this.text.join('\n'),
         mrkdwn_in: ['text', 'pretext']
      };
   },
   toString: function(user) {
      return this.text.join('\n');
   }
});
