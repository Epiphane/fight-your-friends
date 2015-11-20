describe('Seed', function() {
   before(function() {
      return Seed();
   });

   describe('Initial seed', function() {
      it('should create two users', function(done) {
         db.User.count().then(function(result) {
            expect(result).to.equal(2);

            done();
         })
      });

      it('should break here', function() {
         expect(1).to.equal(1);
      })
   });
});