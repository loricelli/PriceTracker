//var bodyParser= require("body-parser");///usr/lib
var fs= require('fs');
var express= require('express');
var app=express();
var ebay = require('ebay-api/index.js');
var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');
var ObjectId = require('mongodb').ObjectID;
var url_mongo = 'mongodb://localhost:27017/test';
app.use(require('body-parser').json());
app.use(require('body-parser').urlencoded({extended: true}));
app.use(express.static(__dirname+'/images'));
app.use(express.static(__dirname+'/modules'));
const crypto=require('crypto');
const secret='lucascemo';


//------------------AUX FUNCTIONS-----------------------------------
function parseUrl(url){
  var parse_url= url.toString().split("/");
  var item_id= parse_url[5].toString().split("?")[0];
  return item_id;
}

function insertDB(url_mongo,item){
  MongoClient.connect(url_mongo, function(err, db) {
    db.collection('Items',function(err,collection){
      if(err) throw err;
      collection.insert({
        "email": "lorenzo",
        "itemId": item.Item.ItemID,
        "Title": item.Item.Title,
        "Price": item.Item.ConvertedCurrentPrice.amount
      },function(){
        console.log("Elemento inserito");
      });
    });
    db.close();
  });
}

var addElement = function(db,data,callback){
    const cipher=crypto.createCipher('aes192',secret);
  var pswEncrypted=cipher.update(data.body.psw1,'utf8','hex');
  pswEncrypted+=cipher.final('hex');
  console.log(pswEncrypted+" è la password criptata in aes192");
  console.log("la password in request è : "+data.body.psw1);
  data.body.psw1=pswEncrypted;
  db.collection('Users').insert({
    "email": data.body.email,
    "psw": data.body.psw1
  },function(){
    callback();
  });
}

var findElement = function(db,data, callback) {
  var presence=0;
 var cursor =db.collection('Users').find( { "email": data.body.email } );
 cursor.limit(1).each(function(err, doc) {
    assert.equal(err, null);
    if(doc!=null){
      presence=1;
      db.close();
      callback(presence);
    }
    else{
      if(presence==0) callback(presence);
    }
 });

};

function find_person_reg(data,callback){
  MongoClient.connect(url_mongo, function(err, db) {
    assert.equal(null, err);
    findElement(db,data, function(doc) {
      if(doc==0) addElement(db,data,function(){
        console.log("Elemento inserito");
        callback(1);
      });
      else callback(0);
    });
  });
}

function find_person_acc(data,callback){
  MongoClient.connect(url_mongo, function(err, db) {
    assert.equal(null, err);
    findElement(db,data, function(doc) {
      if(doc==0) callback(0);
      else {
        console.log("Elemento presente");
        callback(1);
      }
    });
  });
}

function find_password(data,callback){
  MongoClient.connect(url_mongo, function(err, db) {
    assert.equal(null, err);
    var presence=0;
    var cursor =db.collection('Users').find( { "email": data.body.email ,"psw": data.body.psw1} );
    cursor.limit(1).each(function(err, doc) {
       assert.equal(err, null);
       if(doc!=null){
         presence=1;
         db.close();
         callback(presence);
       }
       else{
         if(presence==0) callback(presence);
       }
    });
  });
}
//------------------AUX FUNCTIONS-----------------------------------

app.get('/', function(request,response){ //carica la pagina
	//response.writeHead(200, {"Content-type": "text/html"});
	console.log("main request get");
  response.redirect('/access_page');
  //fs.createReadStream("./access_page.html").pipe(response);
});
app.get('/data', function(req, res){

  var email="lorenzo";
  var elems= new Array();
  MongoClient.connect(url_mongo, function(err, db) {
    db.collection('Items',function(err,collection){
      if(err) throw err;
      var cursor =db.collection('Items').find( { "email": email} );
      cursor.each(function(err, doc) {
        if(doc!=null){
          elems.push(doc);
          console.log(elems);
        }
        else res.send(elems);
    });
    });
  });

});
app.get('/index', function(request,response){ //carica la pagina
	response.writeHead(200, {"Content-type": "text/html"});
	console.log("index get");
  //response.redirect('/index')
  fs.createReadStream("./index.html").pipe(response);
});

app.get('/register', function(request,response){ //carica la pagina
	response.writeHead(200, {"Content-type": "text/html"});
	console.log("register request get");
  //response.redirect('/register');
  fs.createReadStream("./register.html").pipe(response);
});

app.get('/access_page', function(request,response){ //carica la pagina
	response.writeHead(200, {"Content-type": "text/html"});
	console.log("access_page request get");
  //response.redirect('/access_page');
  fs.createReadStream("./access_page.html").pipe(response);
});


app.post('/index',function(request,response){

	console.log("post index");
  var item_id= parseUrl(request.body.url);

  ebay.xmlRequest({
  'serviceName': 'Shopping',
  'opType': 'GetSingleItem',
  'appId': 'LorenzoR-PriceTra-PRD-2e805b337-56dc7eec',      // FILL IN YOUR OWN APP KEY, GET ONE HERE: https://publisher.ebaypartnernetwork.com/PublisherToolsAPI
  params: {
    'ItemId': item_id    // FILL IN A REAL ItemID
    }
  },
  function(error, item) {
    console.log(item);
    insertDB(url_mongo,item);
    console.log("\n");
    console.log("Orario: " + item.Timestamp + "\nArticolo: " + item.Item.Title + "\nPrezzo: " + item.Item.ConvertedCurrentPrice.amount +" €");
  });
	response.redirect('/index');
});

app.post('/register', function(request, response) {
  //se è gia registrato reindirizza, altrimenti procedi con la registrazione
    find_person_reg(request,function(out){
        if(out==0) {
          console.log("Elemento già registrato");
          response.redirect('/access_page');
        }
        else response.redirect('/index');
      });
});

app.post('/access_page',function(request,response){
  console.log("post access page");
  const cipher=crypto.createCipher('aes192',secret);
  var pswEncrypted=cipher.update(request.body.psw1,'utf8','hex');
  pswEncrypted+=cipher.final('hex');
  //console.log(pswEncrypted+" è la password criptata in aes192");
  //console.log("la password in request è : "+request.body.psw1);
  request.body.psw1=pswEncrypted;
  find_person_acc(request,function(ret){
    if(ret==0) response.redirect('/register');
    else find_password(request,function(ret){
      if(ret==0) response.redirect('/access_page/?error');
      else response.redirect('/index');
    });
  });
});

app.post('/register',function(request,response){

    console.log("register post");
    response.redirect('/index');
});

app.listen(8080);
console.log("server is running.....");

//--------Modifiche ebay-api-----------------
//TODO: add eventually ti buildXmlInput   var xmlb=xmlBody.toString().split('ItemId').join("ItemID");//split the string and replace ItemId with ItemID
// and 101 in defaults
//--------Modifiche ebay-api-----------------
