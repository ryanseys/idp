const request = require('request'),
      config = require('../lib/config.js'),
      certify = require('../lib/cert-compute.js'),
      keys = require('../lib/keys');

exports.index = function(req, res){
  res.render('index', { title: 'IDP' });
};

exports.signin_post = function(req, res) {
  var token = req.body.token;
  if(token) {
    console.log('trying token: ' + token)
    request(
      'https://graph.facebook.com/me?access_token=' + token,
      function (error, response, body) {
        if (!error && response.statusCode == 200) {
          var body = JSON.parse(body);
          // set session here
          req.session.email = body.email; // set session
          res.send({ email : body.email });
        }
        else {
          res.send({ error : "login failed: bad token" });
        }
      }
    );
  }
  else {
    res.send({ error : "login failed: no token"});
  }
}

exports.signin = function(req, res) {
  res.render('signin', { title: "sign in", signinpage: "https://ryanseys.com/signin?" });
};

exports.provision = function(req, res) {
  res.render('provision', { title: "provision" });
};

exports.checksession = function(req, res) {
  var email = req.body.email;
  if(req.session.email == email) {
    // logged in
    res.send({ email : req.session.email });
  }
  else {
    res.send({ error: "not logged in" });
  }
};

exports.certify = function(req, res) {
  // validate optional 'duration' parameter
  if (!req.body.duration) {
    req.body.duration = config.get('certificate_validity_ms');
  } else if (typeof req.body.duration !== 'number') {
    return res.json({
      success: false,
      reason: 'duration argument must be a number when present'
    }, 400);
  }

  // validate required 'pubkey' parameter
  if (typeof req.body.pubkey != 'string') {
    return res.json({
      success: false,
      reason: 'pubkey argument is required and must be a string'
    }, 400);
  }

  // validate required 'email' parameter
  if (typeof req.body.email != 'string') {
    return res.json({
      success: false,
      reason: 'email argument is required and must be a string'
    }, 400);
  }

  certify({
    email: req.body.email,
    pubkey: req.body.pubkey,
    duration: req.body.duration,
    hostname: config.get('issuer_hostname')
  }, function(err, certificate) {
    var ro = { };
    if (err) {
      ro.success = false;
      ro.reason = err.toString();
    } else {
      ro.success = true;
      ro.certificate = certificate;
    }

    res.json(ro, ro.success ? 200 : 400);
  });
};
