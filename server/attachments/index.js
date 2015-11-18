var Attachments = {};

function ExtendAttachment(type) {
   var attachment = function(text) {
      this.text = text;
      this.type = type;
   };

   attachment.prototype.type = type;

   return attachment;
}

Attachments.Info = ExtendAttachment('info');
Attachments.Good = ExtendAttachment('good');
Attachments.Error = ExtendAttachment('error');
Attachments.Small = ExtendAttachment('small');

Attachments.Hidden = ExtendAttachment('hidden');
Attachments.Password = function() {
   this.text = 'password';
   this.type = 'hidden';
}

module.exports = Attachments;
