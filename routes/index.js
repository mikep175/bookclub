var express = require('express');
var mongodb = require('mongodb');
var MongoClient = mongodb.MongoClient;
var jwt = require('jsonwebtoken');

var router = express.Router();

/* GET home page. */
router.get('/', function (req, res) {
    res.render('index');
});

var querystring = require("querystring");

var base64ToString = function (str) {
    return (new Buffer(str || "", "base64")).toString("ascii");
};

var base64UrlToString = function (str) {
    return base64ToString(base64UrlToBase64(str));
};

var base64UrlToBase64 = function (str) {
    var paddingNeeded = (4 - (str.length % 4));
    for (var i = 0; i < paddingNeeded; i++) {
        str = str + '=';
    }
    return str.replace(/\-/g, '+').replace(/_/g, '/')
};

var mongodb = require('mongodb');
var MongoClient = mongodb.MongoClient;


var mongodb_connection_string = 'mongodb://127.0.0.1:27017/';
//take advantage of openshift env vars when available:
if (process.env.OPENSHIFT_MONGODB_DB_PASSWORD) {
    mongodb_connection_string = 'mongodb://' + process.env.OPENSHIFT_MONGODB_DB_USERNAME + ":" +
  process.env.OPENSHIFT_MONGODB_DB_PASSWORD + "@" +
  process.env.OPENSHIFT_MONGODB_DB_HOST + ':' +
  process.env.OPENSHIFT_MONGODB_DB_PORT + '/';
}

mongodb_connection_string += 'bookclub';

var app_id = '676974645741975 ';
var secret = '777318cd6aaab99c8aa96fd3a90ad8fb';

var jwtSecret = 'F)(ES(Fsef9VMZX(V((#24#@($MV(ZZ(VMZESv(MR32424';

var getAuthorizeUrl = function () {
    var oauth_url = 'https://www.facebook.com/dialog/oauth/?'
    var options = {
        client_id: app_id,
        redirect_uri: 'https://apps.facebook.com/mybookclub/',
        scope: 'public_profile'
    };
    // for scope see https://developers.facebook.com/docs/authentication/permissions/
    // eg. it could be "publish_stream,email"
    return oauth_url + querystring.stringify(options);
};

router.get('/fb', function (req, res) {
    res.send("<script>window.top.location='" + getAuthorizeUrl() + "'</script>");
});



router.post('/', function (req, res) {
    
    try {
        var signed_request = req.param('signed_request');
        
        if (signed_request.indexOf('.') >= 0) {
            
            var parts = signed_request.split('.');
            var sig = base64UrlToBase64(parts[0]);
            var payload = parts[1];
            var data = JSON.parse(base64UrlToString(payload));
            if (!data.user_id) {
                // send over to authorize url
                res.render('index');
            }
            else {
                // lets verify        
                if (data.algorithm.toUpperCase() !== 'HMAC-SHA256') {
                    res.send('Unknown algorithm. Expected HMAC-SHA256');
                    return;
                }
                
                var hmac = require('crypto').createHmac('sha256', secret);
                hmac.update(payload);
                var expected_sig = hmac.digest('base64');
                if (sig != expected_sig) {
                    console.log('expected [' + expected_sig + '] got [' + sig + ']');
                    res.render('index');
                }
                else {
                    //res.send('Hello, this is my app! you passed verification and are ' + data.user_id);
                    if (data.oauth_token) {
                        var connString = mongodb_connection_string;
                        
                        MongoClient.connect(connString, function (err, db) {
                            if (err) {
                                res.writeHead(500, { "Content-Type": 'text/plain' });
                                res.write("500 Internal Server Error\n");
                                res.end();
                                return console.dir(err);
                            }
                             
                            var collection = db.collection('usertokens');
                            
                            collection.insert({ 'oauth_token': data.oauth_token, 'user_id': data.user_id  }, { w: 1 }, function (err, result) {
                                
                                if (err) {
                                    res.writeHead(500, { "Content-Type": 'text/plain' });
                                    res.write("500 Internal Server Error\n");
                                    res.end();
                                    return console.dir(err);
                                }
                               
                                var token = jwt.sign({ bid: result._id }, jwtSecret);
                                //response.write(JSON.stringify(result));
                                db.close();

                                res.render('home');

                            });

                        });

                    } else {
                        res.render('index');

                    }
                
                }
            }
        } else {
            res.render('index');

        }
    } catch (err) {
        res.render('index');

    }
});

router.get('/genres', function (req, res) {
    
    MongoClient.connect(mongodb_connection_string, function (err, db) {
        if (err) {
            res.writeHead(500, { "Content-Type": 'text/plain' });
            res.write("500 Internal Server Error\n");
            res.end();
            return console.dir(err);
        }
        
        var collection = db.collection('genres');
        
        var stream = collection.find(payload).stream();
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        
        res.write('[');
        
        var first = true;
        
        stream.on("data", function (item) {
            
            if (first == true) {
                first = false;
            } else {
                response.write(',');
            }
            
            res.write(JSON.stringify(item));

        });
        stream.on("end", function () {
            
            res.write(']');
            
            db.close();
            res.end();

        });

    });
});

module.exports = router;