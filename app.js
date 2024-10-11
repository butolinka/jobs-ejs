const express = require("express");
require("express-async-errors");
require("dotenv").config(); // to load the .env file into the process.env object
const session = require("express-session");
const MongoDBStore = require("connect-mongodb-session")(session);
const uri = process.env.MONGODB_URI;
const csrf = require('host-csrf');
const cookieParser = require('cookie-parser');
const app = express();
const helmet = require('helmet');
const xss = require('xss-clean');
const rateLimit = require('express-rate-limit');

app.set("view engine", "ejs");
app.use(require("body-parser").urlencoded({ extended: true }));

app.use(helmet()); 
app.use(xss()); 
app.use(rateLimit({
  windowMs: 10 * 60 * 1000, 
  max: 100,
}));

const store = new MongoDBStore({
  // may throw an error, which won't be caught
  uri: uri,
  collection: "mySessions",
});
store.on("error", function (error) {
  console.log(error);
});

const sessionParms = {
  secret: process.env.SESSION_SECRET || 'defaultsecret',
  resave: true,
  saveUninitialized: true,
  store: store,
  cookie: { secure: false, sameSite: "strict" },
};

if (app.get("env") === "production") {
  app.set("trust proxy", 1); // trust first proxy
  sessionParms.cookie.secure = true; // serve secure cookies
}

app.use(session(sessionParms));
app.use(cookieParser(process.env.SESSION_SECRET));

app.use(require("connect-flash")());
// secret word handling
//let secretWord = "syzygy";
let csrf_development_mode = true;
if (app.get('env')==='production'){
  csrf_development_mode=false;
}

const csrf_options = {
  protected_operations:["POST","PUT","PATCH","DELETE"],
  protected_content_types:["application/x-www-form-urlencoded","application/json"],
  development_mode:csrf_development_mode,
};
const csrf_middleware = csrf(csrf_options);

app.use(csrf_middleware);

app.use(require("./middleware/storeLocals"));
app.get("/", (req, res) => {
  res.render("index", {_csrf:csrf.token(req,res)});
});



app.use("/sessions", require("./routs/sessionRoutes"));

const passport = require("passport");
const passportInit = require("./passport/passportInit");

passportInit();
app.use(passport.initialize());
app.use(passport.session());


const jobsRouter = require('./routs/jobs');
const auth = require("./middleware/auth");
app.use('/jobs', auth,  jobsRouter);

const secretWordRouter = require("./routs/secretWord");
// app.use("/secretWord", secretWordRouter);


app.use("/secretWord", auth, secretWordRouter);

app.use((req, res) => {
  res.status(404).send(`That page (${req.url}) was not found.`);
});

app.use((err, req, res, next) => {
  res.status(500).send(err.message);
  console.log(err);
});

const port = process.env.PORT || 3000;

const start = async () => {
  try {
    await require("./db/connect")(process.env.MONGODB_URI);
    app.listen(port, () =>
      console.log(`Server is listening on port ${port}...`)
    );
  } catch (error) {
    console.log(error);
  }
};

start();