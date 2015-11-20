var _ = require('lodash');

var Response = module.exports = function() {};
Response.prototype.isResponse = true;
Response.prototype.initialize = function() {};

Response.prototype.toSlackAttachment = function(user) {
   return this.toAttachment(user);
};

Response.prototype.toAttachment = function(user) {
   return {};
};

Response.prototype.toString = function(user) {
   return '';
};

// function merge(objA, objB) {
//    var result = {};

//    for (var key in objA) {
//       result[key] = objA[key];
//    }

//    for (var key in objA) {
//       result[key] = objA[key];
//    }

//    return result;
// }

function extend(parent, proto) {
   var child = function() {
      // this.parent.constructor.apply(this, arguments);
      this.initialize.apply(this, arguments);
   };

   proto = proto || {};
   child.prototype = _.merge({}, parent.prototype, proto);
   child.extend = _.curry(extend)(child);

   child.prototype.parent = parent.prototype;

   return child;
}

Response.extend = _.curry(extend)(Response);