const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
// const nodemon = require("nodemon");
const morgan = require("morgan");

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(morgan('tiny'));

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

function generateRandomString() {
  let result = '';
  const possibleChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (let count = 0; count < 6; count++) {
    result += possibleChars.charAt(Math.floor(Math.random() * possibleChars.length));
  }

  return result;
};

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  const templateVars = { greeting: "Hello World!" };
  res.render("hello_world", templateVars)
});

app.get("/urls", (req, res) => {
  const templateVars = { urls: urlDatabase };
  res.render("urls_index", templateVars);
});

app.post("/urls", (req, res) => {
  const newID = generateRandomString();
  urlDatabase[newID] = req.body.longURL;
  res.redirect(`urls/${newID}`);
});

app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

app.post("/urls/:id", (req, res) => {
  urlDatabase[req.params.id] = req.body.editField;
  res.redirect("/urls")
});

app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect("/urls");
});

app.get("/urls/:id", (req, res) => {
  const templateVars = { id: req.params.id, longURL: urlDatabase[req.params.id] };
  res.render("urls_show", templateVars);
});

app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id];
  res.redirect(longURL);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});