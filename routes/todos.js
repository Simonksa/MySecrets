var nodemailer = require('nodemailer');
var express = require('express');
var router = express.Router();
var authConfig = require('../auth/auth');
var emailSettings = require('../settings').emailSettings;
var User = require('../db/db').User;
var Todo = require('../db/db').Todo;

/* GET todos. */
router.get('/', authConfig.isAuthenticated, function(req, res, next) {
  pendingTodos = [];
  completeTodos = [];
  Todo.findAll({where: {isComplete: false}, order: [['createdAt','DESC']]}).then((todos) => {
        pendingTodos = todos;
        return Todo.findAll(
            {where: {isComplete: true}, order: [['createdAt', 'DESC']]});
  }).then((todos) => {
      completeTodos = todos;
    res.render('todo', {
      title: 'Todos',
      error: req.flash('error'),
      success: req.flash('success'),
      user: req.user,
      pendingTodos: pendingTodos,
      completeTodos: completeTodos
    });
  }).catch((err) => {
        next(err);
  });
});

/* POST todo. */
router.post('/', authConfig.isAuthenticated, function(req, res, next) {
  var data = req.body;
  Todo.create({
        // user_id: req.user.id,
        user_id: 1,
        description: data.description
      })
      .then(todo => {
        req.flash('success', 'Saved successfully.');
        res.redirect('/todos');
      })
      .catch(err => {
        next(err);
      });
});

/* PUT todo. */
router.put('/:id', authConfig.isAuthenticated, function(req, res, next) {
  var id = req.params.id;
  Todo.findById(id)
      .then((todo) => {
        return todo.update({description: req.body.description});
      })
    .then((todo) => {
      req.flash('success', 'Saved successfully.');
        res.redirect('/todos');
      })
      .catch((err) => {
        req.flash('error', err.message);
        res.redirect('/todos');
      });
});

/* PUT Complete todo. */
router.put(
    '/complete/:id', authConfig.isAuthenticated, function(req, res, next) {
      var id = req.params.id;
      Todo.findById(id)
          .then(todo => {
            return todo.update({isComplete: true});
          })
          .then(todo => {
            req.flash('success', 'Saved successfully.');
            // res.redirect('/todos');
            res.status(200).send('Saved successfully.');
          })
          .catch(err => {
            req.flash('error', err.message);
            // res.redirect('/todos');
            res.status(501).send(err.message);
          });
    });


/* DELETE todo. */
router.delete('/:id', authConfig.isAuthenticated, function(req, res, next) {
  var id = req.params.id;
  console.log('ID: ', id);
  Todo.findById(id)
      .then((todo) => {
        return todo.destroy();
      })
      .then((result) => {
        req.flash('error', 'Deleted successfully.');
        //res.redirect('/todos');
        res.status(200).send('Deleted successfully.');
      })
      .catch((err) => {
        req.flash('error', err.message);
        //res.redirect('/todos');
        res.status(501).send(err.message);
      });
});

router.post('/sendbyemail', authConfig.isAuthenticated, function(req, res) {
  let transporter = nodemailer.createTransport(
    {
      service: emailSettings.service,
      auth: {
        user: req.body.sender,
        pass: req.body.password
      }
    });

  let mailOptions = {
    from: req.body.sender,
    to: req.body.receiver,
    subject: emailSettings.subject,
    text: req.body.message
  };

  transporter.sendMail(mailOptions, function(err, info) {
    if (err) {
      console.log(err);
      req.flash('error', err.message);
      //res.redirect('/todos');
      res.status(501).send(err.message);
    } 
    let msg = 'Email was successfully delivered to ' + info.envelope.to[0];
    // console.log(info);
    console.log(msg);
    req.flash('success', msg);
    // res.redirect('/todos');
    res.status(200).send(msg);
  });
});

module.exports = router;
