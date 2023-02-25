const express = require("express");
const bcrypt = require("bcryptjs");
const app = express();
const PORT = 8080;
const cookieParser = require('cookie-parser')
app.set("view engine", "ejs");
app.use(cookieParser());

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur",
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk",
  },
};

function generateRandomString() {
const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function getUserByEmail(email){
  console.log(email)
  for(let user in users){
    if(users[user].email===email){
      return users[user];
    }
  }
return null;
}

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/", (req, res) => {
  res.send("Page does not exist!");
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls", (req, res) => {
  const user = users[req.cookies["user_id"]];
  const templateVars = { urls: urlDatabase, user: user };
  console.log(templateVars)
  console.log(req.cookies["user_id"])
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  if (!req.cookies.user_id) {
    return res.redirect('/urls');
  }
  const user = users[req.cookies["user_id"]];
  const templateVars = { user: user };
  res.render("urls_new", templateVars);
});

app.get("/urls/:id", (req, res) => {
  const user = users[req.cookies["user_id"]];
  const templateVars = { id: req.params.id, longURL: urlDatabase[req.params.id], user: user};
  res.render("urls_show", templateVars);
});

app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.params.id]
  res.redirect("/urls")
});

app.post("/urls", (req, res) => {
  if (!req.cookies.user_id) {
    return res.status(403).send("You don't have permission to add a new URL");
  }
  console.log(req.body); 
  res.send("Ok"); 
});

app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id]
  if (!longURL) {
    const templateVars = { message: "This short URL does not exist." };
    res.status(404).render("error", templateVars);
  } else {
    res.redirect(longURL);
  }
});

app.post("/urls/:id",(req, res) => {
  console.log("req.body in URL-id",req.body); 
  const newUrl = req.body.longURL 
  console.log(urlDatabase["b2xVn2"])
  urlDatabase[req.params.id] = newUrl
  res.redirect("/urls")
  res.send("Ok"); 
});

app.post('/login', (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  const user = getUserByEmail(email);

  if (!user) {
    return res.status(403).send("Email not found");
  }

  if (!bcrypt.compareSync(password, user.password)) {
    return res.status(403).send("Incorrect password");
  }

  res.cookie('user_id', user.id);
  res.redirect('/urls');
});


app.post('/logout', (req, res) => {
  res.clearCookie('user_id');
  res.redirect('/login');
});

app.get("/register", (req, res) => {
  if (req.cookies.user_id) {
    return res.redirect('/urls');
  }
  const templateVars = { user:null };
  res.render("register", templateVars);
});

app.post('/register', (req, res) => {
  const {email, password} = req.body;
  if (!email || !password) {
    res.status(400).send("Email and password cannot be empty.");
    return;
  }
  for (const user in users) {
    if (users[user].email === email) {
      res.status(400).send("Email already exists.");
      return;
    }
  }
  const userId = generateRandomString();
  users[userId] = {
    id: userId,
    email: email,
    password: bcrypt.hashSync(password, 10)
  };
  res.cookie("user_id", userId);
  res.redirect('/urls');
});

app.get('/login', (req, res) => { 
  if (req.cookies.user_id) {
    return res.redirect('/urls');
  }
  const templateVars = { user:null };
  res.render("login", templateVars);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});