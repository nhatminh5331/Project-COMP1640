const LocalStrategy = require("passport-local").Strategy;
const User = require("../models/userModel");
const bcrypt = require("bcrypt");

module.exports = (passport) => {
  passport.use(
    new LocalStrategy(
      {usernameField: "email",
        passwordField: "password"
      },
        function (email, password, done) {
          User.findOne({ email }, 
            function (err, user) {
            if (err) 
            console.log(err);

            if (!user) {
              return done(null, false, { message: "User does not exist" });
            }
            bcrypt.compare(password, user.password, function (err, isMatch) {
              if (err) 
              console.log(err);
              if (isMatch) {
                return done(null, user);
              } else {
                return done(null, false, { message: "Wrong password !" });
              }
            });
          });
        }
    )
  );
  passport.serializeUser(function (user, done) {
    done(null, user.id);
  });
  passport.deserializeUser(function (id, done) {
    User.findById(id, function (err, user) {
      done(err, user);
    });
  });
};
