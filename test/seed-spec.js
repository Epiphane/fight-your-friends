describe('Seed', function() {
   var users;

   before(function() {
      return Seed().then(function() {
         return UserController.findAll(Seed.TEAM).then(function(u) {
            users = u;
         });
      });
   });

   describe('Initial seed', function() {
      it('should create two users', function() {
         expect(users).to.have.length(2);
      });

      it('should have an alias for each user', function() {
         _.forEach(users, function(user) {
            expect(user).to.have.property('alias');
            expect(user.alias.slack_name).to.be.a('string');
            expect(user.alias.team_id).to.equal(Seed.TEAM);
            expect(user.tag).to.match(/^<@[A-Z]+>$/);
         });
      });

      it('should not make thomas an AI', function() {
         _.forEach(users, function(user) {
            if (user.alias.slack_name === 'thomas') {
               expect(user.AI).to.be.false;
            }
         });
      });

      it('should make slackbot an AI', function() {
         _.forEach(users, function(user) {
            if (user.alias.slack_name === 'slackbot') {
               expect(user.AI).to.be.true;
            }
         });
      });

      it('should make each user level 1', function() {
         _.forEach(users, function(user) {
            expect(user.level).to.equal(1);
            expect(user.experience).to.equal(0);
            expect(user.gold).to.equal(0);
         });
      });

      it('should give each user starting items and a move', function() {
         return users[0].getWeapon().then(function(weapon) {
            expect(weapon).to.exist;

            expect(weapon.name).to.equal('Fists');
         }).then(function() {
            return users[0].getArmor().then(function(armor) {
               expect(armor).to.exist;
            
               expect(armor.name).to.equal('Clothes');
            });
         }).then(function() {
            return ItemController.countItems(users[0], 'move').then(function(moves) {
               expect(moves).to.equal(1);
            });
         }).then(function() {
            return users[1].getWeapon().then(function(weapon) {
               expect(weapon).to.exist;

               expect(weapon.name).to.equal('Fists');
            });
         }).then(function() {
            return users[1].getArmor().then(function(armor) {
               expect(armor).to.exist;
            
               expect(armor.name).to.equal('Clothes');
            });
         }).then(function() {
            return ItemController.countItems(users[1], 'move').then(function(moves) {
               expect(moves).to.equal(1);
            });
         });
      });

      it('should create an even fight between the two users', function() {
         return FightController.findFight(users[0], Seed.CHANNEL, true).then(function(fight1) {
            expect(fight1).to.exist;
            expect(fight1).to.have.property('opponents');
            expect(fight1.opponents).to.have.length(1);
            expect(fight1.opponents[0]._id).to.equal(users[1]._id);

            expect(fight1).to.have.property('fighting');
            expect(fight1.fighting.health).to.equal(100);

            return fight1;
         }).then(function(fight1) {
            return FightController.findFight(users[1], Seed.CHANNEL, true).then(function(fight2) {
               expect(fight2._id).to.equal(fight1._id);

               expect(fight2).to.exist;
               expect(fight2).to.have.property('opponents');
               expect(fight2.opponents).to.have.length(1);
               expect(fight2.opponents[0]._id).to.equal(users[0]._id);

               expect(fight2).to.have.property('fighting');
               expect(fight2.fighting.health).to.equal(100);
            });
         });
      });

      it('should log one action in the fight', function() {
         return FightController.findFight(users[0], Seed.CHANNEL, true).then(function(fight) {
            expect(fight.length).to.equal(1);

            return fight.getActions().then(function(actions) {
               expect(actions).to.have.length(1);

               expect(_.map(users, function(u) { return u._id; })).to.contain(actions[0].user_id);
            });
         });
      });
   });
});