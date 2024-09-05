const DOMAIN = 'localhost'
const PORT = 3000; // change to 8080

const express = require('express');
const timeout = require('connect-timeout')
const app = express();
const http = require('http');
const server = http.Server(app);

const io  = require('socket.io')(server, {
    maxHttpBufferSize: 1e8, pingTimeout: 60000
});
module.exports.io = io;

const cors = require('cors');

app.use(cors({
  origin: [`https://tf2deal.com/`],
  methods: ['GET','POST','DELETE','UPDATE','PUT','PATCH'],
  optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
}))

const path = require("path");
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const session = require('express-session');

const passport = require('passport');
const SteamStrategy = require('passport-steam').Strategy;

app.use(cookieParser());
app.use(session({
	key: 'session_id'
	, secret: 'id'
	, resave: false
	, saveUninitialized: false
	, cookie: {
		  maxAge: 12*60*60*1000
  }
}));

const delay = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

const fetch = require('node-fetch');

const mongoose = require('mongoose');

require('dotenv').config({ path: path.resolve(__dirname + '/config/', './.env') });

app.use( bodyParser.json({limit: '50mb'}) );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true,
  limit: '50mb'
})); 
app.use(express.json());       // to support JSON-encoded bodies
app.use(express.urlencoded({
  extended: true
})); // to support URL-encoded bodies

app.set('views', path.join(__dirname, '/view'));
app.use(bodyParser.urlencoded({ extended: true })); 
app.use('/public',express.static(path.join(__dirname,'static')));
app.use(express.static(__dirname + '/public'));
app.set('view engine','ejs');
app.set('trust proxy', false)

passport.serializeUser((user, done) => {
	done(null, user._json);
});

passport.deserializeUser((obj, done) => {
	done(null, obj);
});

passport.use(new SteamStrategy({ // change to tf2deal.com!
	returnURL: `http://localhost:3000/auth/steam/return`
	, realm: `http://localhost:3000`
	, apiKey: process.env.API_KEY_STEAM
}, (identifier, profile, done) => {
  return done(null, profile);
}));
app.use(cookieParser());
app.use(session({
	key: 'session_id'
	, secret: 'id'
	, resave: false
	, saveUninitialized: false
	, cookie: {
		  maxAge: 12*60*60*1000
  }
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(
  session({
    secret: 'thisisasecret',
    saveUninitialized: false,
    resave: false
  })
);

app.use(timeout('30s'));
// app.use() use global ratelimit (1 hour / xxxx req)

Date.prototype.toUnixTime = function() { return this.getTime()/1000|0 };
Date.time = function() { return new Date().toUnixTime(); }

process.db_status = { connected: false } ;

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.DB_CONNECTION, 
      {useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true},
      () => {
        console.log('connected to DB')
      }
    );
  } catch (err) {
    console.log('Failed to connected to DB')
  }

  function handleError(mongoError) {
    // check error reason, increment counters, check if errors limit reached
    console.log(mongoError)
  }
  mongoose.connection.on('error', handleError);

  mongoose.connection.on('disconnected', () => { process.db_status = { connected: false } ;});
  mongoose.connection.on('reconnected', () => { process.db_status = { connected: true } });
  mongoose.connection.on('connected', () => { process.db_status = { connected: true } });
}
connectDB()

io.on('connection', socket => {

}); 

const rateLimit = require('express-rate-limit')

const item_page_limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 125,
  message: "You have made too many requests! Try again in 15 minutes. ",
  handler: (req, res, next, options) =>
		res.status(options.statusCode).render('rate_limited', fn.res_data((req.user?.steamid == undefined) ? false:true, req.user, req.cookies[`td_${req.user?.steamid}`], 'Items', {view: 'rate_limited'}))
}); 

function ValidateEmail(input) {

  var validRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;

  if (input.value.match(validRegex)) {
    return true;

  } else {  
    return false;

  }
}

app.get(/^\/auth\/steam(\/return)?$/, passport.authenticate('steam', {
    failureRedirect: '/',
  }), (req, res) => {
    res.redirect('/');
  });
  
app.get('/logout', (req, res) => {
    req.logout(function(err) {
        if (err) { return next(err); }
        let login_error = (req.query['login_error'] == 'true') ? '?login_error=true':'' 
        res.redirect('/');
    });
});

app.post('/email', (req, res) => {
  if(!req.user){
    res.send({status: 'error'})
    return false;
  }

  const email = req.body?.email

  if(typeof email === "string"){
    if(ValidateEmail(email)){

    } else {
      res.send({status: 'error'})
      return false;
    }
  } else {
    res.send({status: 'error'})
    return false;
  }
})

app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).send({ status: "error", error: 'Something failed!' })
})

app.use((err, req, res, next) => {
  if (req.xhr) {
    res.status(500).send({ status: "error", error: 'Something failed!' })
  } else {
    next(err)
  }
})

app.get('*', (req, res) => {
    res.render('index.ejs', {user: req.user})
});

server.listen(process.env.PORT || PORT, () => console.log(`running on URL localhost:${PORT}`)); 
