const express = require("express");
const bcrypt = require("bcryptjs");
const cookieSession = require('cookie-session')
const { generateRandomString, getUserByEmail, urlsForUser } = require("./helpers")
const { urlDatabase, users } = require("./database")

const app = express();
const PORT = 8080;
app.set("view engine", "ejs");

app.use(express.urlencoded({ extended: true }));
app.use(cookieSession({
  name: 'session',
  keys: ["key1"],
  maxAge: 24 * 60 * 60 * 1000
}))

// landing page
app.get("/", (req, res) => {
  if (req.session.user_id) {
    res.redirect("/urls")
  } else {
    res.redirect("/login")
  }
});

// shows list of urls for a given user
app.get("/urls", (req, res) => {
  if (!req.session.user_id) {
    res.redirect("/login")
  }

  const user = users[req.session.user_id];
  const templateVars = { urls: urlsForUser(urlDatabase, req.session.user_id) , user: user };
  
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  if (!req.session.user_id) {
    return res.redirect('/login');
  }
  const user = users[req.session.user_id];
  const templateVars = { user: user };
  res.render("urls_new", templateVars);
});

app.get("/urls/:id", (req, res) => {
  if (!req.session.user_id) {
    return res.status(404).send("You are not logged in")
  }

  if (!urlDatabase[req.params.id]) {
    return res.status(400).send("shorturl does not exist")
  }

  if (urlDatabase[req.params.id].userID !== req.session.user_id) {
    return res.status(404).send("This url does not belong to you")
  }

  const user = users[req.session.user_id];
  const templateVars = { id: req.params.id, longURL: urlDatabase[req.params.id].longURL, user: user};
  res.render("urls_show", templateVars);
});

app.get("/u/:id", (req, res) => {
  if (!urlDatabase[req.params.id]) {
    res.status(404).send("This short URL does not exist.");
  } else {
    res.redirect(urlDatabase[req.params.id].longURL);
  }
});

app.post("/urls", (req, res) => {
  if (!req.session.user_id) {
    return res.status(403).send("You don't have permission to add a new URL");
  }
  const shortURL = generateRandomString() 
  urlDatabase[shortURL] = {
    longURL: req.body.longURL,
    userID: req.session.user_id
  }
  res.redirect(`/urls/${shortURL}`)
});

app.post("/urls/:id/edit",(req, res) => {
  if (!req.session.user_id) {
    return res.status(404).send("You are not logged in")
  }

  if (!urlDatabase[req.params.id]) {
    return res.status(400).send("shorturl does not exist")
  }

  if (urlDatabase[req.params.id].userID !== req.session.user_id) {
    return res.status(404).send("This url does not belong to you")
  }

  urlDatabase[req.params.id].longURL = req.body.longURL 
  res.redirect("/urls")
});

app.post("/urls/:id/delete", (req, res) => {
  if (!req.session.user_id) {
    return res.status(404).send("You are not logged in")
  }

  if (!urlDatabase[req.params.id]) {
    return res.status(400).send("shorturl does not exist")
  }

  if (urlDatabase[req.params.id].userID !== req.session.user_id) {
    return res.status(404).send("This url does not belong to you")
  }
  delete urlDatabase[req.params.id]
  res.redirect("/urls")
});

app.get('/login', (req, res) => { 
  if (req.session.user_id) {
    return res.redirect('/urls');
  }
  const templateVars = { user: null };
  res.render("login", templateVars);
});

// logging in - POST
// redirects to urls index page if credentials are valid
app.post('/login', (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  if (!email || !password) {
    return res.status(400).send("Email and password cannot be blank");
  }

  const user = getUserByEmail(email, users);

  if (!user) {
    return res.status(403).send("Email not found. Please register.");
  }

  if (!bcrypt.compareSync(password, user.password)) {
    return res.status(403).send("Incorrect password");
  }

  req.session.user_id = user.id
  res.redirect('/urls');
});

// logging out - POST
// clears cookies and redirects to urls index page
app.post('/logout', (req, res) => {
  req.session = null
  res.redirect('/login');
});

app.get("/register", (req, res) => {
  if (req.session.user_id) {
    return res.redirect('/urls');
  }
  const templateVars = { user: null };
  res.render("register", templateVars);
});

// defines an endpoint for handling user registration requests
app.post('/register', (req, res) => {
  const {email, password} = req.body;
  if (!email || !password) {
    res.status(400).send("Email and password cannot be empty.");
    return;
  }
  const user = getUserByEmail(email, users);

  if (user) {
    return res.status(403).send("Email already exists. Please login.");
  }
 
  const userId = generateRandomString();
  users[userId] = {
    id: userId,
    email: email,
    password: bcrypt.hashSync(password, 10)
  };

  req.session.user_id = userId
  res.redirect('/urls');
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});