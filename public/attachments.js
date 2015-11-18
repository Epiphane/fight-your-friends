(function(window) {
   var Attachments = {};

   function ExtendAttachment(type) {
      var attachment = function(text) { this.text = text; };

      attachment.prototype.type = type;

      return attachment;
   }

   Attachments.Info = ExtendAttachment('info');
   Attachments.Good = ExtendAttachment('good');
   Attachments.Error = ExtendAttachment('error');
   Attachments.Small = ExtendAttachment('small');

   window.A = Attachments;
})(window);