describe('Seed', function() {
   beforeAll(function(done) {
      require('./seed')().then(function() {
         done();
      })
   });

   it('should work', function() {
      expect(1).toEqual(1);
   })
})