'use strict';

var FightController = require('../controller/fight');
var ItemController = require('../controller/item');

var Status = module.exports = {
   status: function(user, channel_id, argv) {
      if (argv[1] === 'help') {
         return {
            type: 'info',
            md_text: [
               '`|[status]|` : your level, experience, etc',
               '`|[status help]|` : this dialog',
               '`|[status moves]|` : your moves',
               '`|[status items]|` : your items',
            ]
         };
      }
      else if (argv[1] === 'items' || argv[1] === 'moves') {
         return Status.items(user, channel_id, argv.slice(1));
      }

      return FightController.findFight(user, channel_id, true).then(function(fight) {
         if (fight) {
            var fighting = fight.fighting;
            var opponents = fight.opponents;

            return {
               level: user.level,
               fight: {
                  length: fight.length,
                  health: fighting.health,
                  opponents: opponents
               },
               md_text: [
                  'Status update for user ' + user.tag + ' (' + fighting.health + ' health)',
                  'Currently fighting ' + opponents[0].tag + ' (' + opponents[0].fighting.health + ' health)',
                  'Type `|[status help]|` for more options'
               ]
            }
         }
         else {
            return {
               level: user.level,
               experience: user.experience,
               md_text: [
                  'Status update for user ' + user.tag + ':',
                  'Level: ' + user.level,
                  'Experience: ' + user.experience,
                  'Type `|[status help]|` for more options'
               ]
            }
         }
      })
   },
   name: function(user, channel_id, argv) {
      if (!argv[1]) throw 'Usage: `|name| XXX`';

      return user.alias.update({
         slack_name: argv[1]
      }).then(function() {
         return {
            md_text: 'Name changed! Hi, `' + user.tag + '`!',
            updateUser: true
         }
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

         return {
            data: items,
            md_text: md_text
         };
      });
   }
};

module.exports = function() { return Status; };