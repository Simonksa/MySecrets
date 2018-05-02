var bcrypt = require('bcrypt');
var User = require('../db/db').User;
// load all the things we need
var LocalStrategy = require('passport-local').Strategy;

module.exports.authConfig = function(passport) {
  passport.use(
      'login',
      new LocalStrategy(
          {passReqToCallback: true}, (req, username, password, done) => {
            User.findOne({where: {username: username}})
                .then((user) => {
                  // console.log(user);
                  if (!user || !validPassword(password, user.password)) {
                    return done(null, false);
                  }
                  return done(null, user);
                })
                .catch((err) => {
                  console.error(err);
                  return done(err);
                });
          }));

  passport.serializeUser(function(user, next) {
    next(null, user);
  });

  passport.deserializeUser(function(user, next) {
    next(null, user);
  });
};

function validPassword(password, hash) {
  return bcrypt.compareSync(password, hash);
}

// route middleware to make sure a user is logged in
module.exports.isAuthenticated = function(req, res, next) {
  // if user is authenticated in the session, carry on
  if (req.isAuthenticated()) {
    return next()
  }
  // if they aren't redirect them to the home page
  req.flash('error', 'Unathorized access! Please login to continue.');
  res.redirect('/login');
};

module.exports.generateHash = function(password) {
  return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
}