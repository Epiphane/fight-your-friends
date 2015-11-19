'use strict';

var FightController = require('../controller/fight');
var ItemController = require('../controller/item');

module.exports = function(A, assert) {
   var Status = {
      status: function(user, channel_id, argv) {
         if (argv[1] === 'help') {
            return new A.Info([
               '`|[status]|` : your level, experience, etc',
               '`|[status help]|` : this dialog',
               '`|[status moves]|` : your moves',
               '`|[status items]|` : your items',
            ]);
         }
         else if (argv[1] === 'items' || argv[1] === 'moves') {
            return Status.items(user, channel_id, argv.slice(1));
         }

         return FightController.findFight(user, channel_id, true).then(function(fight) {
            if (fight) {
               var fighting = fight.fighting;
               var opponents = fight.opponents;

               return new A.Good([
                  'Status update for user ' + user.tag + ' (' + fighting.health + ' health)',
                  'Currently fighting ' + opponents[0].tag + ' (' + opponents[0].fighting.health + ' health)',
                  'Type `|[status help]|` for more options'
               ]);
            }
            else {
               return new A.Good([
                  'Status update for user ' + user.tag + ':',
                  'Level: ' + user.level,
                  'Experience: ' + user.experience,
                  'Type `|[status help]|` for more options'
               ]);
            }
         })
      },
      name: function(user, channel_id, argv) {
         assert.usage(argv[1], '`|name| XXX`');

         return user.alias.update({
            slack_name: argv[1]
         }).then(function() {
            return new A.Good('Name changed! Hi, `' + user.tag + '`!');
            //    updateUser: true
            // }
         });
      },
      moves: function() { return Status.items.apply(Status, arguments); },
      items: function(user, channel_id, argv) {
         if (argv[0] !== 'moves' && argv[0] !== 'items') throw argv[0] + ' is not a valid item type';

         var type = argv[0].substr(0, 4);
         return ItemController.find(user, type).then(function(items) {
            var md_text = [];

            items.forEach(function(item, i) {
               md_text.push((i + 1) + '. |[' + type + ']`' + item.name + '`| - ' + item.desc);
            });

            return new A.Good(md_text);
         });
      }
   };

   return Status;
};
