var express = require('express');
var mongodb = require('mongodb');
var MongoClient = mongodb.MongoClient;
var jwt = require('jsonwebtoken');

var router = express.Router();

/* GET home page. */
router.get('/', jwt({secret: 'shhhhhhared-secret'}), function (req, res) {
    
    
});


module.exports = router;