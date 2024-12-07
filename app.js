//Requiring
const path = require('path');
const express = require('express');
const hbs = require('hbs');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const index = require('./routes/index.js');
const user = require('./routes/user.js');
const session = require('express-session');
const expressValidator = require('express-validator');
require('dotenv').config()



const port = process.env.PORT || 5000;
var app = express();

app.set('views', path.join(__dirname + '/views'));
app.set('view engine', 'hbs');

//Mounting
app.use(express.urlencoded({
  extended: false
}));
app.use(express.json());
app.use(expressValidator());
app.use('/assets', express.static(__dirname + '/assets'))

app.use(session({
  secret: 'secret',
  resave: true,
  saveUninitialized: true
}));

//app.use(bodyParser.urlencoded({extended: false}))
//app.use(bodyParser.json())
app.use('/', index);
app.use('/user', user);
//app.use('/', pool);




//hbs

hbs.registerPartials(__dirname + '/views/partials');

//Database




//Initialize server

app.listen(port, () => {
  console.log(`Server is listening to port ${port}`);
});
