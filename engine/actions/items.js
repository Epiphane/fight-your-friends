'use strict';

var ItemController = require('../controller/item');
var Warning = require('../warning');

var drop = function(user, argv, type, action) {
   if (!argv[1]) throw 'Usage: `|drop| XXX`';
   return ItemController.getItem(user, type, argv.slice(1).join(' ')).then(function(item) {
      if (item) {
         if (type === 'item') {
            if (item._id === user.weapon_id) throw new Warning('`' + item.name + '` is your weapon. Equip something else first.');
            if (item._id === user.armor_id) throw new Warning('`' + item.name + '` is your armor. Equip something else first.');
         }

         return ItemController.countItems(user, type).then(function(count) {
            if (count === 1) {
               throw new Warning('You only have one ' + type + ' left!');
            }

            return item.update({ deleted: true }).then(function() {
               return {
                  type: 'good',
                  md_text: '`' + item.name + '` ' + action + '! Bye bye!'
               };
            });
         });
      }
      else {
         return {
            type: 'warning',
            md_text: 'You have no item named ' + argv[1]
         };
      }
   });
};

var Items = module.exports = {
   equip: function(user, channel_id, argv) {
      var type = argv[1];
      var itemName = argv.slice(2).join(' ');
      if (type !== 'weapon' && type !== 'armor') {
         throw 'Usage: `|equip weapon ' + itemName + '|` or `|equip armor ' + itemName + '|`';
      }

      return ItemController.getItem(user, 'item', itemName).then(function(item) {
         if (item) {
            if (type === 'weapon') {
               return user.setWeapon(item);
            }
            else {
               return user.setArmor(item);
            }
         }
         else {
            throw new Warning('You have no ' + argv[0] + ' named ' + argv[1]);
         }
      }).then(function() {
         return {
            type: 'good',
            md_text: 'You equipped ' + itemName + '!'
         }
      });
   },
   move: function(user, channel_id, argv) { return Items.item.apply(Items, arguments); },
   item: function(user, channel_id, argv) {
      if (!argv[1]) throw 'Usage: `|item| XXX` or `|item drop| XXX';
      else if (argv[1] === 'drop' || argv[1] === 'forget') {
         return Items[argv[1]](user, argv.slice(1));
      }

      return ItemController.getItem(user, argv[0], argv.slice(1).join(' ')).then(function(item) {
         if (item) {
            var md_text = [
               item.name,
               item.desc
            ];
            if (item.type === 'item') {
               md_text = md_text.concat(
                  'Type `|[equip weapon ' + item.name + ']|` or `|[equip armor ' + item.name + ']|` to equip this item',
                  'Type `|[item drop ' + item.name + ']|` to drop this item'
               );
               return { md_text: md_text };
            }
            else if (item.type === 'move') {
               md_text = md_text.concat(
                  'Type `|[move forget ' + item.name + ']|` to forget this move'
               );
               return { md_text: md_text };
            }
         }
         else {
            return {
               type: 'warning',
               md_text: 'You have no ' + argv[0] + ' named ' + argv[1]
            };
         }
      });
   },
   forget: function(user, channel_id, argv) { return drop(user, argv, 'move', 'forgotten'); },
   drop: function(user, channel_id, argv) { return drop(user, argv, 'item', 'dropped'); },
};