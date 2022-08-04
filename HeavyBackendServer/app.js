var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var cors = require('cors');

var calcRouter = require('./routes/calculations');

var app = express();

app.use(cors({origin: ['http://localhost:3000'],}));
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/calcRequest', calcRouter);

app.listen(8080, () => {
  console.log("Application running")
})

module.exports = app;
