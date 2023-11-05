const { assert } = require('chai');

const { checkEmail } = require('../helpers.js');

const testUsers = {
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  }
};

describe('checkEmail', function() {
  it('should return a user object if given an existing email', function() {
    const user = checkEmail(testUsers, "user@example.com");
    const expectedUserID = "userRandomID";
    assert(user.id === expectedUserID);
  });
  it('should return undefined if given an email not in the database', function() {
    const user = checkEmail(testUsers, "testemail@fail.com");
    const expectedValue = undefined;
    assert(user === expectedValue);
  })
});