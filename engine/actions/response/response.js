var Response = module.exports = function(text, type) {
   this.type = type || 'good';
   this.text = text;
};

Response.prototype.isResponse = true;

Response.extend = function(type) {
   var extended = function(text, t) {
      Response.call(this, text, t || type);
   }

   extended.prototype = Response.prototype;

   return extended;
}
