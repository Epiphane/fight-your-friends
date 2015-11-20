'use strict';

var ItemController = require('../controller/item');

module.exports = function(A, assert) {
   var drop = function(user, argv, type, action) {
      assert.usage(argv[1], '|drop| XXX');

      return ItemController.getItem(user, type, argv.slice(1).join(' ')).then(function(item) {
         assert(item, 'You have no item named ' + argv.slice(1).join(' ') + '!');

         if (type === 'item') {
            assert(item._id !== user.weapon_id, '`' + item.name + '` is your weapon. Equip something else first.');
            assert(item._id !== user.armor_id, '`' + item.name + '` is your armor. Equip something else first.');
         }

         return ItemController.countItems(user, type).then(function(count) {
            assert(count > 1, 'You only have one ' + type + ' left!');

            return item.update({ deleted: true });
         }).then(function() {
            return new A.Good('`' + item.name + '` ' + action + '! Bye bye!');
         });
      });
   };

   var Items = {
      equip: function(user, channel_id, argv) {
         var type = argv[1];
         var itemName = argv.slice(2).join(' ');

         assert.usage(type === 'weapon' || type === 'armor', '|equip weapon ' + itemName + '|` or `|equip armor ' + itemName + '|');

         return ItemController.getItem(user, 'item', itemName).then(function(item) {
            assert(item, 'You have no item named ' + argv.slice(1).join(' ') + '!');

            if (type === 'weapon') {
               return user.setWeapon(item);
            }
            else {
               return user.setArmor(item);
            }
         }).then(function() {
            return new A.Good('You equipped ' + itemName + '!');
         });
      },
      move: function(user, channel_id, argv) { return Items.item.apply(Items, arguments); },
      item: function(user, channel_id, argv) {
         assert(argv[1], '|item| XXX` or `|item drop| XXX');

         if (argv[1] === 'drop' || argv[1] === 'forget') {
            return Items[argv[1]](user, argv.slice(1));
         }

         return ItemController.getItem(user, argv[0], argv.slice(1).join(' ')).then(function(item) {
            assert(item, 'You have no ' + argv[0] + ' named ' + argv.slice(1).join(' ') + '!');

            var text = [
               item.name,
               item.desc
            ];
            if (item.type === 'item') {
               text.push('Type `|[equip weapon ' + item.name + ']|` or `|[equip armor ' + item.name + ']|` to equip this item');
               text.push('Type `|[item drop ' + item.name + ']|` to drop this item');
            }
            else if (item.type === 'move') {
               text.push('Type `|[move forget ' + item.name + ']|` to forget this move');
            }

            return new A.Good(text);
         });
      },
      forget: function(user, channel_id, argv) { return drop(user, argv, 'move', 'forgotten'); },
      drop: function(user, channel_id, argv) { return drop(user, argv, 'item', 'dropped'); },
   };

   return Items;
};