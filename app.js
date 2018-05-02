var express = require('express');
var http = require('http');
var path = require('path');
// var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var debug = require('debug')('mysecrets:server');
var passport = require('passport');
var expressSession = require('express-session');
var SessionStore = require('express-session-sequelize')(expressSession.Store)
var flash = require('connect-flash');
var hbs = require('hbs');

var index = require('./routes/index')(passport);
var todos = require('./routes/todos');

var db = require('./db/db').db;

const sequelizeSessionStore = new SessionStore({
  // Valid Sequelize instance **required
  db: db,
  // How long until inactive sessions expire in milliseconds.
  // (Default: 24 hours) *optional
  expiration: 30 * 60 * 1000,
  // How often expired sessions are purged in milliseconds.
  // (Default: 15 minutes) *optional
  checkExpirationInterval: 15 * 60 * 1000
});


var app = express();
/**
 * Create HTTP server.
 */
var server = http.createServer(app);

/**
 * Connect to database and synchronise all tables.
 */
db.sync().then(() => {
  require('./auth/auth').authConfig(passport);
}).catch((err) => {
  console.error(err);
});




/**
 * Get port from environment and store in Express.
 */

var port = normalizePort(process.env.PORT || 3000);
app.set('port', port);


// view engine setup
hbs.registerHelper('dateFormat', require('handlebars-dateformat'));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// required for passport
app.use(expressSession({
  secret: 'mysecrets',  // session secret
  store: sequelizeSessionStore,
  resave: true,
  saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());  // persistent login sessions
app.use(flash());  // use connect-flash for flash messages stored in session

app.use('/', index);
app.use('/todos', todos);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

/**
 * Listen on provided port, on all network interfaces.
 */

server.listen(port);
server.on('error', onError);
server.on('listening', onListening);


/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val) {
  var port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }
  var bind = typeof port === 'string' ? 'Pipe ' + port : 'Port ' + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}

  /**
   * Event listener for HTTP server "listening" event.
   */

  function onListening() {
    var addr = server.address();
    var bind = typeof addr === 'string' ? 'pipe ' + addr : 'port ' + addr.port;
    debug('Listening on ' + bind);
  }
