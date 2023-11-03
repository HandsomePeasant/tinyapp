const express = require("express");
const morgan = require("morgan");
const cookieParser = require('cookie-parser')

const app = express();
const PORT = 8080; // default port 8080

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

// (Temporary) database containing string created by generateRandomString() as keys, and full URLs as values
const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
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
  const templateVars = { greeting: "Hello World!", username: req.cookies["username"] };
  res.render("hello_world", templateVars)
});

// GET /urls -- user will be redirected here after logging in, logging out, and EDITING (NOT adding) or deleting a URL
app.get("/urls", (req, res) => {
  const templateVars = { urls: urlDatabase, username: req.cookies["username"] };
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
  const templateVars = { username: req.cookies["username"] };
  res.render("urls_new", templateVars);
});

// GET /urls/:id -- user has clicked the edit button in /urls
app.get("/urls/:id", (req, res) => {
  const templateVars = {
    id: req.params.id,
    longURL: urlDatabase[req.params.id],
    username: req.cookies["username"]
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

// GET /register -- user directly navigates to /register or is sent there
app.get("/register", (req, res) => {
  res.render("register");
});

// POST /login -- user enters a username and clicks the form button, a cookie is created to store their username
app.post("/login", (req, res) => {
  res.cookie('username', req.body.username);
  res.redirect("/urls");
});

// POST /logout -- user clicks the logout button, the cookie is cleared
app.post("/logout", (req, res) => {
  res.clearCookie('username');
  res.redirect("/urls");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});