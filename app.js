const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config();
const bodyParser = require("body-parser");
const session = require("express-session");
const passport = require("passport");
const Auth = require("./middleware/auth")
const app = express();

//View engine ejs
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(express.static(path.join(__dirname, "public")));
// console.log(path.join(__dirname, "public"));

app.locals.categories = null; 

//bodyParser middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(
  session({
    secret: "keyboard cat",
    resave: true,
    saveUninitialized: true,
  })
);

app.use(require("connect-flash")());
app.use(function (req, res, next) {
  res.locals.messages = require("express-messages")(req, res);
  next();
});

//Connect database MongoDB
mongoose.connect(
  process.env.MONGODB_URI,
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  },
  (err) => {
  if (err) throw err;
  console.log("connected to MongoDB");
  }
);

//Passport
require("./config/passport")(passport);
app.use(passport.initialize());
app.use(passport.session());
app.get("*", function (req, res, next) {
  res.locals.user = req.user || null
  next()
})

//Routers
app.use("/login", require("./routes/userRouter"));
app.use("/",Auth.User, require("./routes/staffRouter"));
app.use("/adminPage",Auth.Admin, require("./routes/adminRouter"));
app.use("/qamPage",Auth.QAM, require("./routes/qamRouter"));
app.use("/campaigns",Auth.User, require("./routes/campaignRouter"));
app.use("/list_ideas",Auth.User, require("./routes/idealRouter"));

//Start server
const Port = process.env.PORT || 3000;
app.listen(Port, () => 
  console.log(`Listening to port ${Port}`)
);
