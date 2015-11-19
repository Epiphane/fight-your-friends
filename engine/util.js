String.prototype.ucwords = function() {
   return this.replace(/^[a-z]/g, function(l) { return l.toUpperCase(); });
};