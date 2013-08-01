
/*
 * GET home page.
 */

exports.index = function(req, res){
  res.render('index', { title: 'IDP' });
};

exports.signin = function(req, res) {
  if(req.body.access_token) {
    console.log('access_token: ' + req.body.access_token);
  }
  res.render('signin', { title: "sign in", signinpage: "https://ryanseys.com/browserid/signin" });
};

exports.provision = function(req, res) {
  res.render('provision', { title: "provision" });
};
