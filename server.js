//var bodyParser= require("body-parser");///usr/lib
var fs= require('fs');
var express= require('express');
var app=express();
var ebay = require('ebay-api/index.js');
var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');
var ObjectId = require('mongodb').ObjectID;
var url_mongo = 'mongodb://localhost:27017/test';
var session = require('express-session');

//per la sessione
app.use(session({secret: 'francescocoatto'}));
//app.engine('html', require('ejs').renderFile);
app.use(require('body-parser').json());
app.use(require('body-parser').urlencoded({extended: true}));
app.use(express.static(__dirname+'/images'));
app.use(express.static(__dirname+'/modules'));
app.set('views', __dirname);
const crypto=require('crypto');
const secret='lucascemo';



//------------------AUX FUNCTIONS-----------------------------------

function parseUrl(url){
  console.log("RE check :"+url+"...");
  var pattern = new RegExp('([0-9]{12}){1}');
  var id = url.match(pattern);
  if(id==null || id.length==0){
    return null;
  }
  console.log("id: "+id[0]);
  if(id.length>1) return id[0];
  return id;
}


//TODO: update su array degli elementi dell'utente
function insertDB(url_mongo, item, req){
  ses = req.session;
  MongoClient.connect(url_mongo, function(err, db) {
    db.collection('Items',function(err,collection){
      if(err) throw err;
      collection.insert({
          "email": ses.email,
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
//TODO: aggiungere flag facebook
var addElement = function(db,data,callback){
  db.collection('Users').insert({
    "email": data.body.email,
    "psw": data.body.psw1
  },function(){
    callback();
  });
}

//TODO: ristruttare con nuovo database
var findUser = function(db,data, callback) { //user
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

function findUserInsert(data,callback){
  MongoClient.connect(url_mongo, function(err, db) {
    assert.equal(null, err);
    findUser(db,data, function(doc) {
      if(doc==0){
        addElement(db,data,function(){
          console.log("Elemento inserito");
          callback(1); //se non c'era e inserito
        });
      }
      else{
        callback(0); //c'è non va inserito
      }
    });
  });
}

function find_password(data,callback){
  MongoClient.connect(url_mongo, function(err, db) {
    assert.equal(null, err);
    var presence=0;
    var cursor =db.collection('Users').find( { "email": data.body.email ,"psw": data.body.psw1} );
    console.log("email"+ data.body.email +" psw "+ data.body.psw1);
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
app.get('/logout',function(req,res){
  req.session.destroy(function(err) {
    if(err) {
      console.log(err);
    }
    else {
      console.log("Logged out");
      res.redirect('/access_page');
    }
  });
});

app.get('/', function(request,response){ //carica la pagina
	//response.writeHead(200, {"Content-type": "text/html"});
	console.log("main request get");
  response.redirect('/access_page');
  //fs.createReadStream("./access_page.html").pipe(response);
});

app.get('/errorNotLogged', function(request,response){ //carica la pagina
	response.writeHead(500, {"Content-type": "text/html"});
	console.log("error not logged user");
  fs.createReadStream("./errorNotLogged.html").pipe(response);
});

//TODO: ristruttare con nuovo database

app.get('/data', function(req, res){
  ses = req.session;
  if(ses.logged){
      var email=ses.email;
      var elems= new Array();
      MongoClient.connect(url_mongo, function(err, db) {
        db.collection('Items',function(err,collection){
          if(err) throw err;
          var cursor =db.collection('Items').find( { "email": email} );
          cursor.each(function(err, doc) {
            if(doc!=null){
              elems.push(doc);
              //console.log(elems);
            }
            else{
              res.send(elems);
            }
        });
        });
      });
  }
  else{
    res.redirect('/errorNotLogged');
  }
});

//TODO: ristruttare con nuovo database
app.get('/data/:item', function(req, res){
  ses = req.session;
  console.log("item id get");
  if(ses.logged){
    var id = req.params.item;
    console.log("In data/item");
      var email=ses.email;
      MongoClient.connect(url_mongo, function(err, db) {
        db.collection('Items',function(err,collection){
          if(err) throw err;
          var cursor = db.collection('Items').find( { "email": email, "itemId" : id} );
          cursor.limit(1).each(function(err, doc) {
            if(doc!=null){
              res.send(doc);
              console.log("In data/ite -- doc: "+doc);
            }
          });
        });
      });
  }
  else{
    res.redirect('/errorNotLogged');
  }
});

app.get('/index', function(request,response){ //carica la pagina
  ses = request.session;
  if(ses.logged){
      response.writeHead(200, {"Content-type": "text/html"});
    	console.log("index get");
      //response.redirect('/index')
      fs.createReadStream("./index.html").pipe(response);
  }
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
    //console.log(item);
      insertDB(url_mongo,item,request);
      console.log("Orario: " + item.Timestamp + "\nArticolo: " + item.Item.Title + "\nPrezzo: " + item.Item.ConvertedCurrentPrice.amount +" €");
      response.redirect('back');
    });

});

app.post('/register', function(request, response) {
  ses = request.session;
  //se è gia registrato reindirizza, altrimenti procedi con la registrazione
    const cipher=crypto.createCipher('aes192',secret);
    var pswEncrypted=cipher.update(request.body.psw1,'utf8','hex');
    pswEncrypted+=cipher.final('hex');
    console.log(pswEncrypted+" è la password criptata in aes192");
    console.log("la password in request è : "+request.body.psw1);
    request.body.psw1=pswEncrypted;

    findUserInsert(request,function(out){
        if(out==0) { //0 se è gia presente
          console.log("Elemento già registrato");
          response.redirect('/access_page');
        }
        else{ //1 se
          ses.email = request.body.email;
          ses.logged=true;
          response.redirect('/index');
        }
      });
});

//TODO: ristruttare con nuovo database

app.post('/access_page',function(request,response){
  console.log("post access page");

  const cipher=crypto.createCipher('aes192',secret);
  var pswEncrypted=cipher.update(request.body.psw1,'utf8','hex');
  pswEncrypted+=cipher.final('hex');
  //console.log(pswEncrypted+" è la password criptata in aes192");
  //console.log("la password in request è : "+request.body.psw1);
  request.body.psw1=pswEncrypted;
  ses = request.session;

  findUserInsert(request,function(ret){
    if(ret==1){
      if(request.body.fb=='Y'){
        MongoClient.connect(url_mongo, function(err, db) {
          assert.equal(null, err);
          addElement(db,request,function(){
            ses.email=request.body.email;
            ses.logged = true;
            response.redirect('/index');
          });
        });
      }
      else {
        response.redirect('/register');
      }
    }
    else{
      console.log("Verifico password");
      find_password(request,function(ret){
        if(ret==0){
          console.log("Password errata");
          response.redirect('/access_page/?error');
        }
        else{
          //variabili di sessione inizializzate
          console.log("Password giusta");
            ses.email=request.body.email;
            ses.logged = true;
            response.redirect('/index');
        }
      });
    }
  });
});


app.post('/register',function(request,response){
    console.log("register post");
    response.redirect('/index');
});
//TODO: DA FARE DELETE ELEMENT
app.post('/delete_elem',function(req,res){
  var elem_tbd= req.body.elem.split('_')[1];
  console.log(elem_tbd);
  MongoClient.connect(url_mongo, function(err, db) {
    assert.equal(null, err);
    var cursor = db.collection('us').find( { "_id": "email"} );
    cursor.limit(1).each(function(err, doc) {
      if(doc!=null)console.log(doc.products[0].price[0].value);
    });
  });

});
app.listen(8080);
console.log("server is running.....");

//--------Modifiche ebay-api-----------------
//TODO: add eventually ti buildXmlInput   var xmlb=xmlBody.toString().split('ItemId').join("ItemID");//split the string and replace ItemId with ItemID
// and 101 in defaults
//--------Modifiche ebay-api-----------------
