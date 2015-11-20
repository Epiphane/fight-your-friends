var A = require('./response');

var assert = module.exports = function(statement, message, type) {
   if (!statement) {
      if (message) throw new A.Warning(message);
      else {
         console.error('Assertion failed!');
         console.trace();
         throw new A.Error('Assertion failed.');
      }
   }
};

assert.usage = function(statement, correct) {
   return assert(statement, 'Usage: `' + correct + '`', 'info');
}