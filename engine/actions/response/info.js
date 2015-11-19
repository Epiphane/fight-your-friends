module.exports = require('./message').extend({
   color: '#23D5E4',
   toAttachment: function() {
      return this.parent.toAttachment.call(this);
   }
});
