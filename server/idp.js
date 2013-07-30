#!/usr/bin/env node

const express = require('express');
const path = require('path');

// The IP Address to listen on.
const IP_ADDRESS = process.env.IP_ADDRESS || '127.0.0.1';

// The port to listen to.
const PORT = process.env.PORT || 3000;

var app = express();
app.use(express.logger({ format: 'dev' }));
app.use(express.bodyParser());
app.use(express.static(path.join(path.dirname(__dirname), "static")));

app.listen(PORT, IP_ADDRESS, function () {
  console.log("listening on " + IP_ADDRESS + ":" + PORT);
});
