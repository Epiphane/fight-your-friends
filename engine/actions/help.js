module.exports = function(A, assert) {
   return {
      help: function() {
         return new A.Info([
            '`|name |NAME` : Change your name',
            '`|[craft]|` : Craft something!',
            '`|fight |@XXX` : Pick a fight with @XXX',
            '`|forefeit|` : forefeit your current fight',
            '`|[status]|` : Get your health, your opponent\'s health, and other info',
            '`|equip |(weapon or armor) XXX` : Equip an item in your inventory',
            '`|use |XXX` : Use a move on an opponent'
         ]);
      }
   };
};