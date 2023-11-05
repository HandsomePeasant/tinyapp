// Function to generate a random six-digit string which will be our shortened URL
function generateRandomString() {
  const result = Math.random().toString(36).substr(2, 6);
  return result;
};

// Function takes in a randomly-generated string & user-entered email and password, and returns an object that can be inserted into the users database
function storeUserData(id, email, password) {
  const data = {
    id,
    email,
    password
  };
  return data;
};

// Small helper function that takes in an object (our user database) and an email address, checks if the email exists already,
// and returns the associated user data if it does, or null if it does not
function checkEmail(obj, email) {
  for (const userId in obj) {
    const user = obj[userId];
    if (user.email === email) {
      return user;
    }
  }
  return null;
};

/** 
 * DEPRECATED
 * 
 * Modular addition to checkEmail() for the /login path, using the returned user object to quickly compare passwords rather than having to iterate through the database again
 * 
 * No longer needed since updating express_server to use bcrypt
 * 
function checkPassword(user, password) {
  return user.password === password;
};
*/

// Function takes in a userID and returns an object containing all the short IDs and longURLs with a matching userID value
function urlsForUser(id, urlDatabase) {
  const userURLs = {};
  for (let url in urlDatabase) {
    if (urlDatabase[url].userID === id) {
      userURLs[url] = urlDatabase[url].longURL;
    }
  }
  return userURLs;
};

module.exports = {
  generateRandomString,
  storeUserData,
  checkEmail,
  urlsForUser
};