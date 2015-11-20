process.env.PORT = 6060;
process.env.NODE_ENV = 'test';

var LOG = function(data) {
   if (Array.isArray(data)) data = data.join('\n');

   console.log(data);
};

var spawn = require('child_process').spawn, child;

LOG([
   '---------------------------------------------',
   '----- SEEDING FIGHT YOUR FRIENDS DATA -------',
   '---------------------------------------------'
]);
require('./engine/config/seed').then(function() {
   LOG([
      '---------------------------------------------',
      '------ BEGIN FIGHT YOUR FRIENDS TEST --------',
      '---------------------------------------------'
   ]);

   child = spawn('jasmine-node', ['spec']);

   child.stdout.on('data', function (data) {
      process.stdout.write(data);
   });

   child.stderr.on('data', function (data) {
      process.stderr.write(data);
   });

   child.on('close', function (code) {
      process.exit();
   })
});