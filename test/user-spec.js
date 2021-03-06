describe('User', function() {
   var users;
   var thomas;

   before(function() {
      return Seed().then(function() {
         return UserController.findAll(Seed.TEAM).then(function(u) {
            users = u;

            if (users[0].email === 'exyphnos@gmail.com') {
               thomas = users[0];
            }
            else {
               thomas = users[1];
            }
         });
      });
   });

   var FAKE_EMAIL = 'fake@test.com';
   afterEach(function() {
      return db.User.findOne({
         where: {
            email: FAKE_EMAIL
         },
         include: [{model: db.Alias}]
      }).then(function(user) {
         if (!user) return;

         expect(user.aliases).to.have.length(1);

         return user.aliases[0].destroy().then(function() {
            return user.destroy();
         });
      });
   });

   describe('UserController.create', function() {
      var testFailCreate = function(values, team_id) {
         try {
            return UserController.create(values, team_id).then(function() {
               // This should not work!
               expect(true).to.be.false;
            });
         }
         catch (e) {
            expect(e).to.exist;
         }
      } 

      it('should require an email to create a user', function() {
         return testFailCreate({}, Seed.TEAM);
      });

      it('should require a team ID to create a user', function() {
         return testFailCreate({ email: 'fail@fail.com', });
      });

      it('should allow creation with an email and team ID', function() {
         return UserController.create({ email: 'fake@test.com' }, Seed.TEAM).then(function(user) {
            expect(user).to.exist;
            expect(user.email).to.equal(FAKE_EMAIL);
            expect(user.level).to.equal(1);
            expect(user.experience).to.equal(0);
         });
      });

      it('should give a new user an alias, weapon, armor, and move', function() {
         return UserController.create({ email: 'fake@test.com' }, Seed.TEAM).then(function(user) {
            expect(user).to.have.property('alias');
            expect(user.alias.team_id).to.equal(Seed.TEAM);

            return user.getWeapon().then(function(weapon) {
               expect(weapon).to.exist;

               expect(weapon.name).to.equal('Fists');
            }).then(function() {
               return user.getArmor().then(function(armor) {
                  expect(armor).to.exist;
               
                  expect(armor.name).to.equal('Clothes');
               });
            }).then(function() {
               return ItemController.countItems(user, 'move').then(function(moves) {
                  expect(moves).to.equal(1);
               });
            });
         });
      });
   });

   describe('UserController.findById', function() {
      it('should locate each user by ID', function() {
         return UserController.findById(thomas._id, Seed.TEAM).then(function(user) {
            expect(user).to.exist;
            expect(user).to.have.property('alias');
            expect(user.alias.team_id).to.equal(Seed.TEAM);
            expect(user.tag).to.equal('<@UTSTEINKE>');
         });
      });

      it('should allow login on any team', function() {
         return UserController.findById(thomas._id, 'TESTTEAM1', 'UTHOMAS').then(function(user) {
            expect(user).to.exist;
            expect(user).to.have.property('alias');
            expect(user.alias.team_id).to.equal('TESTTEAM1');
            expect(user.tag).to.equal('<@UTHOMAS>');
         });
      });
   });

   // describe('UserController.findBySlackId', function() {
   //    it('should locate the user by their slack ID', function() {
   //       return UserController.findBySlackId('<@UTSTEINKE>', Seed.TEAM).then(function(user) {
   //          expect(user).to.exist;
   //       });
   //    });
   // });
});