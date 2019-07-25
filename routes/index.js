var express = require('express');
var router = express.Router();
const axios = require("axios");
var qr = require('qr-image');
const fs = require('fs');

var Accounts = require('../models/accounts');

router.get('/', function(req, res, next) {
  if(req.session.username){
      return res.redirect('/viewAccounts');
   } else {
      res.render('login');
   }
});

router.post("/login", async (req, res, next) => {
  try {
    let payload = {};
    payload.method = "POST";
    payload.data = req.body;
    payload.url = "http://localhost:4000/login";
    let response = await axios(payload);
    let data = response.data;
    //res.send(data.token);
    req.session.username = req.body.username;
    req.session.token = data.token;
    res.redirect('/viewAccounts');
  } catch (e) {
    next();
  }
});

router.get("/viewAccounts", function(req, res, next) {
  Accounts.find().sort({createDate: -1}).exec(function(err, accounts){
    res.render('dashboard', {accounts});
    console.log(accounts[0])
  })
  //Accounts.remove({});
});

router.get("/addUser", function(req, res, next){
  Accounts.find().exec(function(err, data){
    var accountNo = "Nabil-" + data.length;
      res.render('addUser1', {username : accountNo});
  });
});

router.post("/addUser", async function(req, res, next) {
  const formData = {
    username : req.body.username,
    permissions : []
  }
  try {
    const token = req.session.token;
    let payload = {};
    payload.method = "POST";
    payload.data = formData;
    payload.url = "http://localhost:4000/register";
    payload.headers = {"Authorization" : `Bearer ${token}`}
    let response = await axios(payload);
    let data = response.data;

    var account = new Accounts({
      username : req.body.username,
      password : data.message
    });

    var promise = account.save();
    promise.then((account) => {
      //console.log("New account is ", account);
      res.render('accountRegister2', {account});
    });
  } catch (e) {
    next();
  }
});

router.post('/registerAccount', function(req, res, next) {
  var username = req.body.username;
  var firstname = req.body.firstname;
  var middlename = req.body.middlename;
  var lastname = req.body.lastname;
  var account_uuid = username.split("-");
  var account_details = {
    "args": {
        "accountUUID": account_uuid[1],
        "accountId": account_uuid[0] + "-" + firstname + "-" + account_uuid[1],
        "accountType":req.body.accType,
        "ownerDetails":{
        	"OwnerName":firstname + " " + middlename + " " + lastname,
        	"Contact":{
        		"PhoneNumber":req.body.phone,
        		"Email":req.body.emailAddress
        	},
        	"CitizenshipID": req.body.citizenship,
        	"PermanentAddress":req.body.address
        },
        "balance":{
        	"amount":1000.00
        }
    }
  }

  var account = {
    username : req.body.username,
    password : req.body.password,
    accountDetails : account_details
  }
  Accounts.update({ username : req.body.username },
    { $set : account }, (err, accountt) => {
        // if(!err){
        //   var qr_png = qr.imageSync(JSON.stringify(accountt),{ type: 'png'})
        //   let qr_code_file_name = req.body.username + '.png';
        //     fs.writeFileSync('/public/qr/' + qr_code_file_name, qr_png, (err) => {
        //         if(err){
        //             console.log(err);
        //         }
        //     });
        //   res.redirect('/viewAccounts')
        // }else{
        //   console.log("Error!!");
        // }
        res.redirect('/viewAccounts')
  });

});

router.get('/singleAccount/:id', function(req, res, next){
  Accounts.findOne({ _id : req.params.id}, function(err, account){
    //res.render('singleAccount', {account});
    var code = qr.image(JSON.stringify(account), { type: 'jpeg' });
    res.type('svg');
    code.pipe(res);
  })
});

router.post('/deposit/:id', function(req, res, next){
  Accounts.findOne({ _id: req.params.id}).exec(function(err, account){
    var newBalance = parseInt(account.accountDetails.args.balance.amount) + parseInt(req.body.amountToTransfer);
    Accounts.update({ _id: req.params.id },
        {$set : { "accountDetails.args.balance.amount" : newBalance}},
        function(err, account) {
          res.redirect('/singleAccount/'+req.params.id)
        });
  });

});


module.exports = router;
