module.exports = function (passport) {
  var formidable = require('formidable');
  var fs = require('fs');
  var express = require('express');
  var router = express.Router();
  var authConfig = require('../auth/auth');
  var User = require('../db/db').User;
  var Todo = require('../db/db').Todo;

  /* GET home page. */
  router.get('/', function (req, res) {
    return res.redirect('/login');
  });

  // show the login form
  router.get('/login', function (req, res) {
    if (req.isAuthenticated()) {
      return res.redirect('/todos');
    }
    var vm = {
      title: 'Login',
      error: req.flash('error'),
      success: req.flash('success')
    };
    // render the login page and pass in any flash data if it exists
    res.render('login', vm);
  });

  // process the login form
  router.post('/login', passport.authenticate('login', {
    successRedirect: '/todos',
    failureRedirect: '/login',
    failureFlash: 'Invalid Credentials!'
  }));

  router.get('/register', function (req, res) {
    if (req.isAuthenticated()) {
      res.redirect('/todos');
    }
    var vm = { title: 'Registration', error: req.flash('error') };
    res.render('register', vm);
  });

  router.post('/register', function (req, res) {
    var data = req.body;
    console.log(data);
    // find a user whose email and/or username is the same as the forms values
    // we are checking to see if the user trying to register already exists
    User.findOne({ where: { email: data.email } })
      .then((user) => {
        console.log('User: ', user);
        if (user) {
          req.flash('error', 'Email address is already taken.');
          res.redirect('/register');
        }
        return User.findOne({ where: { username: data.username } });
      })
      .then((user) => {
        console.log('User: ', user);
        if (user) {
          req.flash('error', 'Username is already taken.');
          res.redirect('/register');
        }
        return User.create({
          username: data.username,
          email: data.email,
          password: authConfig.generateHash(data.password)
        });
      })
      .then((user) => {
        console.log('User: ', user);
        req.flash('success', 'Registration Successful. Please login to continue.');
        res.redirect('/login');
      })
      .catch((err) => {
        console.error(err.message);
        req.flash('error', err.message);
        res.redirect('/register');
      });
  });

  router.get('/logout', function (req, res) {
    req.logout();
    return res.redirect('/login');
  });

  router.get('/profile', authConfig.isAuthenticated, function (req, res, next) {
    let id = req.user.id;
    let numPendingTodos = 0;
    let numCompleteTodos = 0;
    let user = null;
    User.findById(id)
        .then((dbUser) => {
          user = dbUser;
          return Todo.findAndCount({where: {user_id: id, isComplete: false}});
        })
        .then((result) => {
          numPendingTodos = result.count;
          return Todo.findAndCount({where: {user_id: id, isComplete: true}});
        })
        .then((result) => {
          numCompleteTodos = result.count;
          res.render('profile', {
            error: req.flash('error'),
            passwordError: req.flash('passwordError'),
            passwordSuccess: req.flash('passwordSuccess'),
            success: req.flash('success'),
            user: user,
            numCompleteTodos: numCompleteTodos,
            numPendingTodos: numPendingTodos,
            title: 'User Profile'
          });
        })
        .catch((err) => {
          req.flash('error', err.message);
          res.redirect('/');
        });
  });
  
  router.post('/profile', authConfig.isAuthenticated, function (req, res) {
    let password1 = req.body.password1;
    let password2 = req.body.password2;
    if (password1 !== password2) {
      req.flash('passwordError', 'The passwords do not match!');
      res.redirect('/profile');
    }

    let password = authConfig.generateHash(password1);
    let id = req.user.id;
    User.findById(id)
        .then((user) => {
          return user.update({password: password});
        })
        .then((user) => {
          req.flash('passwordSuccess', 'Your Password was changed!');
          res.redirect('/profile');
        })
        .catch((err) => {
          req.flash('passwordError', 'Failed to update your Password!');
          res.redirect('/profile');
        });
  });

  router.post('/upload', authConfig.isAuthenticated, function (req, res) {
    // let data = req.body;
    let form = new formidable.IncomingForm();
    form.parse(req, function(err, fields, files) {
      let oldpath = files.filetoupload.path;
      let newpath = 'public/images/' + files.filetoupload.name;
      fs.readFile(oldpath, (err, data) => {
        if (err) {throw err;}
        console.log('File read!');
        // Write the file
        fs.writeFile(newpath, data, (err) => {
          if (err) { throw err; }
          console.log('File written!');
        });
        // Delete the file
        fs.unlink(oldpath, (err) => {
          if (err) {
            throw err;
          }
          console.log('File deleted!');
        });

        User.findById(req.user.id)
            .then((user) => {
              return user.update({avatar: files.filetoupload.name});
            })
          .then((user) => {
              req.user.avatar = files.filetoupload.name;
              req.flash('success', 'File uploaded successfully!');
              res.redirect('/profile');
            })
            .catch((err) => {
              // throw err;
              req.flash('error', err.message);
              res.redirect('/profile');
            });
      });
    });
  });

  return router;
}
