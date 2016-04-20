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
        "_id": item.Item.ItemID,
        "Title": item.Item.Title,
        "Price": item.Item.ConvertedCurrentPrice.amount
      },function(){
        console.log("Elemento inserito");
      });
    });
    db.close();
  });
}

function add_person_to_db(url_mongo,request){
  var id= request.body.email;
  var pwd= request.psw1;
  console.log(id);
  MongoClient.connect(url_mongo, function(err, db) {
    db.collection('Person',function(err,collection){
      if(err) throw err;
      collection.findOne({_id:id},function(err,document){
        if(err) console.log(err);
        console.log(document.pwd);
      });
    });
    db.close();
  });
}
//------------------AUX FUNCTIONS-----------------------------------

app.get('/', function(request,response){ //carica la pagina
	//response.writeHead(200, {"Content-type": "text/html"});
	console.log("main request get");
  response.redirect('/access_page');
  //fs.createReadStream("./access_page.html").pipe(response);
});

app.get('/index', function(request,response){ //carica la pagina
	response.writeHead(200, {"Content-type": "text/html"});
	console.log("index get");
  //response.redirect('/index');
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
    var email = request.body.email;
    var psw = request.body.psw1;
    var psw_check = request.body.psw2;
    if(psw!=psw_check){
      console.log("PASSWORD DIVERSE!!");

      //response.redirect("/register");
    }

    var findEmail = function(db, callback) {
                var cursor = db.collection('Users').find({"_id":email});
                  cursor.each(function(err, doc) {
                    assert.equal(err, null);
                    if (doc != null) {
                      //GIA' REGISTRATO -> REDIRECT AL LOGIN
                       console.log("GIA' REGISTRATO!");
                       response.redirect("/access_page");
                    } else {
                      //NON PRESENTe -> FACCIO LA QUERY DI INSERIMENTO
                       console.log("NON PRESENTE : REGISTRABILE");
                       console.log("%s, %s", email, psw);
                       var insertDoc = function(db, callback) {
                           db.collection('Users').insertOne({
                           "_id" : email,
                           "psw":psw,
                         }, function(err, result) {
                           assert.equal(err,null);
                           console.log("Inserted User in Users");
                           callback();
                         });
                       };

                       MongoClient.connect(url_mongo, function(err, db) {
                         assert.equal(null,err);
                         insertDoc(db, function(){
                           console.log("INSERITO UTENTE");
                           db.close();
                         });
                       });
                       console.log("REDIRECT INDEX");
                       response.redirect('/index');
                    }
                    console.log(doc);
                });
    };

            MongoClient.connect(url_mongo, function(err, db) {
              assert.equal(null, err);
              findEmail(db, function() {
                  console.log();
                  db.close();
              });
            });
});

app.post('/access_page',function(request,response){
  console.log("post access page");
  add_person_to_db(url_mongo,request);
  response.redirect('/index');
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
