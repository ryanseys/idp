
/**
 * Module dependencies.
 */

var express = require('express'),
    routes = require('./routes'),
    http = require('http'),
    https = require('https'),
    crypto = require('crypto'),
    fs = require('fs'),
    path = require('path');

const keys = require('./lib/keys');
const SECRET_PATH = path.join(__dirname, './secrets');

var app = express();

// all environments
app.set('port', process.env.PORT || 80);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express.cookieParser('your secret here'));
app.use(express.session());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

// start loading, or make ephmeral keys if none exist
keys.getKeys(function(pubKey, privKey) {
  console.log('*** Keys loaded. ***');

  if (!fs.existsSync(SECRET_PATH)) {
    fs.mkdirSync(SECRET_PATH);
  }

  fs.writeFileSync(path.join(SECRET_PATH, 'public.key'), pubKey);
  fs.writeFileSync(path.join(SECRET_PATH, 'private.key'), privKey);
  console.log('*** wrote keys to secret folder ***');
});

app.get('/', routes.index);
app.get('/signin', routes.signin);
app.post('/signin', routes.signin_post);
app.get('/provision', routes.provision);
app.post('/checksession', routes.checksession);
app.post('/certify', routes.certify);
app.get('/.well-known/browserid', routes.well_known);

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

var options = {
  key: fs.readFileSync('./server.key'),
  cert: fs.readFileSync('./server.crt')
};

https.createServer(options, app).listen(443);
