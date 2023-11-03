const express = require("express");
const morgan = require("morgan");
const cookieParser = require('cookie-parser')

const app = express();
const PORT = 8080; // default port 8080

// (Temporary) database containing string created by generateRandomString() as keys, and full URLs as values
const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
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
app.use(cookieParser());

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

// Modular addition to checkEmail() for the login path, using the returned user object to quickly compare passwords rather than having to iterate through the database again
function checkPassword(user, password) {
  return user.password === password;
};

// Likely remove later
app.get("/", (req, res) => {
  res.send("Hello!");
});

// Likely remove later
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

// Likely remove later
app.get("/hello", (req, res) => {
  const templateVars = { greeting: "Hello World!", id: req.cookies["user_id"] };
  res.render("hello_world", templateVars)
});

// GET /urls -- user will be redirected here after logging in, logging out, and EDITING (NOT adding) or deleting a URL
app.get("/urls", (req, res) => {
  const user = req.cookies["user_id"];
  const templateVars = { urls: urlDatabase, user: users[user] };
  res.render("urls_index", templateVars);
});

// POST /urls -- user has added a new URL to the list, will then be sent to that URL's specific page
app.post("/urls", (req, res) => {
  const newID = generateRandomString();
  urlDatabase[newID] = req.body.longURL;
  res.redirect(`urls/${newID}`);
});

// GET /urls/new -- user has clicked on "Create New URL" in the header navbar
app.get("/urls/new", (req, res) => {
  const user = req.cookies["user_id"];
  const templateVars = { user: users[user] };
  res.render("urls_new", templateVars);
});

// GET /urls/:id -- user has clicked the edit button in /urls
app.get("/urls/:id", (req, res) => {
  const user = req.cookies["user_id"];
  const templateVars = {
    id: req.params.id,
    longURL: urlDatabase[req.params.id],
    user: users[user]
  };
  res.render("urls_show", templateVars);
});

// POST /urls/:id -- user has entered a new URL into the editField and submitted it. Will be redirected to /urls
app.post("/urls/:id", (req, res) => {
  urlDatabase[req.params.id] = req.body.editField;
  res.redirect("/urls")
});

// POST /urls/:id/delete -- user has clicked the big red delete button in /urls. Will be redirected to /urls
app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect("/urls");
});

// GET /u/:id -- (CURRENTLY LIMITED IMPLEMENTATION) user has clicked the "Short URL ID" link in urls/show, will be redirected to the corresponding longURL
app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id];
  res.redirect(longURL);
});

// GET /login -- user has clicked on the Log in button in the header, or the hypertext link in /register
app.get('/login', (req, res) => {
  res.render('login');
});

// GET /register -- user directly navigates to /register or is sent there
app.get("/register", (req, res) => {
  res.render("register");
});

// POST /login -- user enters their email address & password and clicks the form button, a cookie is created to store their username
app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  if (!email || !password) {
    return res.status(400).send("Please provide an email AND password");
  }

  const user = checkEmail(users, email);
  if (!user) {
    return res.status(403).send("Email not found");
  };

  if (!checkPassword(user, password)) {
    return res.status(403).send("Invalid credentials");
  }
  res.cookie("user_id", user.id);
  res.redirect("/urls");
});

// POST /register
app.post("/register", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  if (!email || !password) {
    return res.status(400).send("Please provide an email AND password");
  }

  if (checkEmail(users, email)) {
    return res.status(400).send("This email has already been registered!");
  }

  const newID = generateRandomString();
  users[newID] = storeUserData(newID, req.body.email, req.body.password);
  res.cookie("user_id", newID);
  console.log(users); // Making sure new user has properly been added to the database
  res.redirect("/urls");
});

// POST /logout -- user clicks the logout button, the cookie is cleared
app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/urls");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});