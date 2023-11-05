const express = require("express");
const morgan = require("morgan");
const cookieSession = require('cookie-session');
const bcrypt = require("bcryptjs");
const methodOverride  = require("method-override");

const { generateRandomString, storeUserData, checkEmail, urlsForUser } = require('./helpers');

const app = express();
const PORT = 8080; // default port 8080

// (Temporary) database containing string created by generateRandomString() as keys, and full URLs as values
const urlDatabase = {
  "b2xVn2": {
    longURL: "http://www.lighthouselabs.ca",
    userID: "userOne"
  },
  "9sm5xK": {
    longURL: "http://www.google.com",
    userID: "userTwo"
  }
};

// (Temporary) user database containing user ID as keys, and objects containing their login information as values
const users = {
  userOne: {
    id: "userOne",
    email: "one@one.com",
    password: "111",
  },
  userTwo: {
    id: "userTwo",
    email: "two@two.com",
    password: "222",
  },
};

// Setting up ejs's automatic use of the views directory
app.set("view engine", "ejs");

// Configuring middleware
app.use(express.urlencoded({ extended: false }));
app.use(morgan('dev'));
app.use(methodOverride('_method'));
app.use(cookieSession({
  name: 'session',
  keys: ['sT8@pR', '5Fy#9q', 'bG2*oL']
}));

// GET /urls -- user will be redirected here after logging in, logging out, and EDITING (NOT adding) or deleting a URL
app.get("/urls", (req, res) => {
  if (req.session.user_id) {
    const user = req.session.user_id;
    const templateVars = { user: users[user], urls: urlsForUser(user, urlDatabase) };
    res.render("urls_index", templateVars);
  } else {
    return res.status(401).render("error", { errMsg: "Please log in to view URLs", statusCode: 401, user: null });
  }
});

// POST /urls -- user has added a new URL to the list, will then be sent to that URL's specific page
app.post("/urls", (req, res) => {
  if (req.session.user_id) {
    const newID = generateRandomString();
    urlDatabase[newID] = { longURL: req.body.longURL, userID: req.session.user_id }
    res.redirect(`urls/${newID}`);
  } else {
    return res.status(401).render("error", { errMsg: "You must log in to shorten URLs", statusCode: 401, user: null });
  }
});

// GET /urls/new -- user has clicked on "Create New URL" in the header navbar
app.get("/urls/new", (req, res) => {
  if (req.session.user_id) {
    const user = req.session.user_id;
    const templateVars = { user: users[user] };
    res.render("urls_new", templateVars);
  } else {
    res.redirect("/login");
  }
});

// GET /urls/:id -- user has clicked the edit button in /urls
app.get("/urls/:id", (req, res) => {
  if (!req.session.user_id) {
    return res.status(401).render("error", { errMsg: "Please log in to view URLs", statusCode: 401, user: null });
  }

  if (!urlDatabase[req.params.id]) {
    return res.status(404).render("error", { errMsg: "The URL you entered does not exist", statusCode: 404, user: req.session.user_id });
  }

  const user = req.session.user_id;
  const templateVars = {
    id: req.params.id,
    longURL: urlDatabase[req.params.id].longURL,
    user: users[user]
  };

  if (user === urlDatabase[req.params.id].userID) {
    res.render("urls_show", templateVars);
  } else {
    return res.status(403).render("error", { errMsg: "You aren't authorized to edit this URL", statusCode: 403, user: user});
  }
});

// PUT /urls/:id -- user has entered a new URL into the editField and submitted it. Will be redirected to /urls
app.put("/urls/:id", (req, res) => {
  if (!urlDatabase[req.params.id]) {
    return res.status(404).render("error", { errMsg: "The URL you entered does not exist", statusCode: 404, user: req.session.user_id });
  }

  if (!req.session.user_id) {
    return res.status(401).render("error", { errMsg: "You must log in to edit URLs", statusCode: 401, user: null });
  }

  if (req.session.user_id === urlDatabase[req.params.id].userID) {
    urlDatabase[req.params.id].longURL = req.body.editField;
    res.redirect("/urls")
  } else {
    return res.status(403).render("error", { errMsg: "You aren't authorized to edit this URL", statusCode: 403, user: req.session.user_id });
  }
});

// DELETE /urls/:id/delete -- user has clicked the big red delete button in /urls. Will be redirected to /urls
app.delete("/urls/:id/delete", (req, res) => {
  if (!urlDatabase[req.params.id]) {
    return res.status(404).render("error", { errMsg: "The URL you entered does not exist", statusCode: 404, user: req.session.user_id });
  }

  if (!req.session.user_id) {
    return res.status(401).render("error", { errMsg: "You must log in to edit URLs", statusCode: 401, user: null });
  }

  if (req.session.user_id === urlDatabase[req.params.id].userID) {
    delete urlDatabase[req.params.id];
    res.redirect("/urls");
  } else {
    return res.status(403).render("error", { errMsg: "You aren't authorized to edit this URL", statusCode: 403, user: req.session.user_id });
  }
});

// GET /u/:id -- user has clicked a "Short URL ID" link, will be redirected to the corresponding longURL
app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id].longURL;
  if (longURL) {
    res.redirect(longURL);
  } else {
    return res.status(404).render("error", { errMsg: "URL not found", statusCode: 404, user: req.session.user_id });
  }
});

// GET /login -- user has clicked on the Log in button in the header, or the hypertext link in /register
app.get('/login', (req, res) => {
  // If a user_id cookie exists, user is already logged in and is redirected to /urls instead
  if (req.session.user_id) {
    res.redirect("/urls");
  } else {
    res.render("login");
  }
});

// GET /register -- user directly navigates to /register or clicks the link in /login
app.get("/register", (req, res) => {
  // If a user_id cookie exists, user is already logged in and is redirected to /urls instead
  if (req.session.user_id) {
    res.redirect("/urls");
  } else {
    res.render("register");
  }
});

// POST /login -- user enters their email address & password and clicks the form button, a cookie is created to store their user_id
app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  // if user did not fill out one or both fields, returns a 400 error
  if (!email || !password) {
    return res.status(400).render("error", { errMsg: "Please provide an email AND password", statusCode: 400, user: null });
  }

  // If the entered email is not in the database, returns a 403 error
  const user = checkEmail(users, email);
  if (!user) {
    return res.status(403).render("error", { errMsg: "Email not found", statusCode: 403, user: null });
  };

  // If the email is found but password is incorrect, returns a 403 error (with a nonspecific error message to avoid revealing whether an email exists in the database)
  if (bcrypt.compareSync(password, user.password)) {
    req.session.user_id = user.id;
    res.redirect("/urls");
  } else {
    return res.status(403).render("error", { errMsg: "Invalid credentials", statusCode: 403, user: null });
  }
});

// POST /register -- performs similar checks to POST /login (but in this case checks if checkEmail() returns a value), generates a new user_id, creates a cookie and redirects to /urls
app.post("/register", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const hashedPassword = bcrypt.hashSync(password, 10);

  // if user did not fill out one or both fields, returns a 400 error
  if (!email || !password) {
    return res.status(400).render("error", { errMsg: "Please provide an email AND password", statusCode: 400, user: null });
  }

  // If the entered email is already in the database, returns a 403 error
  if (checkEmail(users, email)) {
    return res.status(400).render("error", { errMsg: "Email has already been registered", statusCode: 400, user: null });
  }

  const newID = generateRandomString();
  users[newID] = storeUserData(newID, req.body.email, hashedPassword);
  req.session.user_id = newID;
  res.redirect("/urls");
});

// POST /logout -- user clicks the logout button, the cookie is cleared and they are redirected to /login
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/login");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});