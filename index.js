#!/usr/bin/env node

require('dotenv').config()

const {LuckyMouseSocket} = require('./LuckyMouse/server')

const express = require('express')
const bodyParser = require('body-parser')
const app = express()
const port = process.env.PORT || 3000
const portHttps = process.env.PORT_HTTPS || 443

var cors = require('cors');
app.use(cors());
app.use(bodyParser.json())
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
)

var http = require('http');
var https = require('https');
const fs = require('fs');

var server = http.createServer(function(request, response) {
    console.log((new Date()) + ' Received request for ' + request.url);
    response.writeHead(404);
    response.end();
});

// let path_key = 'private.key';
// let path_cert = 'server.crt';
let path_cert = '/etc/letsencrypt/live/rlgl2-api.brandgames.vn/fullchain.pem';
let path_key = '/etc/letsencrypt/live/rlgl2-api.brandgames.vn/privkey.pem';

const options = {
  key: fs.readFileSync(path_key),
  cert: fs.readFileSync(path_cert)
};

const serverSSL = https.createServer(options, function(request, response) {
  // ... handle HTTPS requests ...
  console.log((new Date()) + ' Received request for ' + request.url);
  response.writeHead(404);
  response.end();
});


// server.listen(port, function() {
//     console.log((new Date()) + ' Server is listening on port ' + port);
// });
serverSSL.listen(port, function() {
  console.log((new Date()) + ' Server is listening on port ' + port);
});

LuckyMouseSocket(serverSSL);
