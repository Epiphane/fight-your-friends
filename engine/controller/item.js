'use strict';

var sqldb = require('../sqldb');

var User = sqldb.User;
var Item = sqldb.Item;

var ItemController = {};

ItemController.find = function(user, type) {
   return user.getItems({
      where: {
         type: type,
         deleted: false
      }
   }).then(function(items) {
      var result = [];

      items.forEach(function(item, i) {
         result.push({
            name: item.name,
            stats: item.stats,
            desc: item.desc
         });
      });

      return result;
   });
};

ItemController.countItems = function(user, type) {
   return Item.count({
      where: {
         type: type,
         deleted: false,
         user_id: user._id
      }
   });
};

ItemController.getItem = function(user, type, name) {
   return user.getItems({
      where: {
         name: name,
         type: type,
         deleted: false
      }
   }).then(function(items) {
      if (items.length) return items[0];
      else return null;
   });
};

module.exports = ItemController;
