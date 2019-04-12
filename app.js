var express = require('express');
var nforce = require('nforce');
var hbs = require('hbs');

var app = express();

app.set('view engine', 'hbs');
app.enable('trust proxy');

//hardcoded key and secret
process.env['CONSUMER_KEY'] = "3MVG9ZF4bs_.MKuht6utTb9K3jHsVAS.7uRPWNUJTQK7v324lBG10qgrFif0V_vH7.smSFzpRENbwqxkBqtvu" 
process.env['CONSUMER_SECRET'] = "10037C4741B9F4619E34B71655BFA02D218BE158AC8EC053E6F6B740183C9E48"

function isSetup() {
  return (process.env.CONSUMER_KEY != null) && (process.env.CONSUMER_SECRET != null);
}

function oauthCallbackUrl(req) {
  return req.protocol + '://' + req.get('host');
}

hbs.registerHelper('get', function(field) {
  return this.get(field);
});

app.get('/', function(req, res) {
  if (isSetup()) {
    var org = nforce.createConnection({
      clientId: process.env.CONSUMER_KEY,
      clientSecret: process.env.CONSUMER_SECRET,
      redirectUri: oauthCallbackUrl(req),
      mode: 'single'
    });

    if (req.query.code !== undefined) {
      org.authenticate(req.query, function(err) {
        if (!err) {
          // nforce SOQL query 
          org.query({ query: 'SELECT Name, Genre__c, Game_Studio__r.Name , Release_Date__c,TextPicture__c FROM Game__c ORDER BY Release_Date__c ASC' }, function(err, results) {
            if (!err) {
              // Render the json objects by having the handlebar tags recieve them
              res.render('index', {records: results.records});
            }
            else {
              res.send(err.message);
            }
          });
        }
        else {
          if (err.message.indexOf('invalid_grant') >= 0) {
            res.redirect('/');
          }
          else {
            res.send(err.message);
          }
        }
      });
    }
    else {
      res.redirect(org.getAuthUri());
    }
  }
  else {
    res.redirect('/setup');
  }
});

app.get('/setup', function(req, res) {
  if (isSetup()) {
    res.redirect('/');
  }
  else {
    var isLocal = (req.hostname.indexOf('localhost') == 0);
    var herokuApp = null;
    if (req.hostname.indexOf('.herokuapp.com') > 0) {
      herokuApp = req.hostname.replace(".herokuapp.com", "");
    }
    res.render('setup', { isLocal: isLocal, oauthCallbackUrl: oauthCallbackUrl(req), herokuApp: herokuApp});
  }
});

app.listen(process.env.PORT || 5000);
