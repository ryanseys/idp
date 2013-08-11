const logger = require('winston'),
    jwcrypto = require('jwcrypto'),
        cert = jwcrypto.cert,
     winston = require('winston'),
          fs = require('fs'),
        path = require('path'),
      config = require('./config.js');

require("jwcrypto/lib/algs/rs");
require("jwcrypto/lib/algs/ds");

const PUB_KEY_PATH = config.get('pub_key_path');
const PRIV_KEY_PATH = config.get('priv_key_path');
const VAR = path.join(__dirname, '../var');

var kp;

function readKeys(cb) {
  if (kp) return process.nextTick(function() { cb(null, kp); });
  fs.readFile(path.join(__dirname, config.get('pub_key_path')), function(err, content) {
    try {
      if (err) throw err;
      var pk = jwcrypto.loadPublicKey(content);
      kp = { publicKey: pk };
      fs.readFile(path.join(__dirname, config.get('priv_key_path')), function(err, content) {
        try {
          if (err) throw err;
          kp.secretKey = jwcrypto.loadSecretKey(content.toString());
          cb(null, kp);
        } catch(e) {
          winston.error('can\'t read pub key: ' + e);
          process.exit(1);
        }
      });
    } catch(e) {
      winston.error('can\'t read pub key: ' + e);
      process.exit(1);
    }
  });
}

module.exports.pubkey = function(cb) {
  readKeys(function(err, kp) {
    cb(err, kp ? kp.publicKey : null);
  });
};

module.exports.privkey = function(cb) {
  readKeys(function(err, kp) {
    cb(err, kp ? kp.secretKey : null);
  });
};

function ephemeralWellKnown(pubKey) {
  var wellKnown = {
    'public-key': JSON.parse(pubKey),
    'authentication': '/signin',
    'provisioning': '/provision'
  };

  if (!fs.existsSync(VAR)) {
    fs.mkdirSync(VAR);
  }

  const WELL_KNOWN_PATH = path.join(VAR, 'well-known.json');
  fs.writeFileSync(WELL_KNOWN_PATH, JSON.stringify(wellKnown));
  logger.debug('*** Ephemeral well-known written to var.***');
  process.on('exit', function onExit() {
    fs.unlinkSync(WELL_KNOWN_PATH);
  });
}

var pubKey;
var privKey;

module.exports.getKeys = function(callback) {
  if (!callback) {
    callback = function() {};
  }

  if (pubKey && privKey) {
    callback(pubKey, privKey);
  } else if (fs.existsSync(PUB_KEY_PATH) && fs.existsSync(PRIV_KEY_PATH)) {
    pubKey = fs.readFileSync(PUB_KEY_PATH).toString();
    privKey = fs.readFileSync(PRIV_KEY_PATH).toString();

    callback(pubKey, privKey);
  } else {
    logger.warn('*** Using ephemeral keys ***');
    jwcrypto.generateKeypair({
      algorithm: 'RS',
      keysize: 64
    }, function(err, keypair) {
      pubKey = keypair.publicKey.serialize();
      privKey = keypair.secretKey.serialize();

      ephemeralWellKnown(pubKey);
      callback(pubKey, privKey);
    });
  }
};
