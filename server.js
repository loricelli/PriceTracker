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
const supersecret='lollofesso';
const crypto_type='aes192';
const password_super_segreta='partytoni'


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
function insert_element(url_mongo, item, req){
  ses = req.session;
  MongoClient.connect(url_mongo, function(err, db) {
    console.log(ses.email);
    db.collection('Users',function(err,collection){
      if(err) throw err;
      collection.update({"email": ses.email},{$push: {
        products: {
          "name": item.Item.Title,
          "itemId": item.Item.ItemID,
          "img": item.Item.PictureURL,
          "link": req.body.url,
          "target_price": req.body.target,
          "price":[
            {
              "timestamp":item.Timestamp,
              "value":item.Item.ConvertedCurrentPrice.amount
            }
          ]
        }
      }
    });
  });
  });
    /*db.collection('Users',function(err,collection){
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
    db.close();*/
  }//TODO: aggiungere flag facebook
  var addUser = function(db,data,callback){
    db.collection('Users').insert({
      "email": data.body.email,
      "psw": data.body.psw1,
      "fb": data.body.fb,
      "products":[]
    },function(){
      callback();
    });
  }

//TODO: ristruttare con nuovo database
var findUser = function(data, callback) { //user torna 1 se trova l'utente 0 altrimenti
  var presence=0;
  MongoClient.connect(url_mongo, function(err, db) {
    assert.equal(null, err);
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
  });
};


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

app.get('/data', function(req, res){
  ses = req.session;
  if(ses.logged){
      var email=ses.email;
      var elems;
      MongoClient.connect(url_mongo, function(err, db) {
        db.collection('Users',function(err,collection){
          if(err) throw err;
          var cursor =db.collection('Users').find( { "email": email} );
          cursor.each(function(err, doc) {
            if(doc!=null){
              elems=doc.products;
              //console.log(elems);
            }
            else{
              db.close();
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

app.get('/data/:item', function(req, res){
  ses = req.session;
  console.log("item id get");
  if(ses.logged){
    var id = req.params.item;
    console.log("In data/item");
      var email=ses.email;
      MongoClient.connect(url_mongo, function(err, db) {
        db.collection('Users',function(err,collection){
          if(err) throw err;
          var cursor =db.collection('Users').find( { "email": email} );
          cursor.each(function(err, doc) {
            var target;
            if(doc!=null){
              elems=doc.products;
              for(var el in elems){
                console.log("Id è "+id+" e el è "+elems[el].itemId);
                if(elems[el].itemId==id){
                  target = elems[el];
                  db.close();
                  res.send(target);}
              }
            }
            else{
              db.close();
              //res.send(target);
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
      insert_element(url_mongo,item,request);
      console.log("Orario: " + item.Timestamp + "\nArticolo: " + item.Item.Title + "\nPrezzo: " + item.Item.ConvertedCurrentPrice.amount +" €");
      response.redirect('back');
    });

});

app.post('/register', function(request, response) {
  console.log("post su register");
  if(request.body.fb==null){  //imposto la pssword diversa se accede tramite facebook o tramite form di registrazione
    const cipher=crypto.createCipher(crypto_type,secret);
    var pswEncrypted=cipher.update(request.body.psw1,'utf8','hex');
    pswEncrypted+=cipher.final('hex');
    request.body.psw1=pswEncrypted;
  }
  else{
    const cipher_fb=crypto.createCipher(crypto_type,supersecret);
    var facebook_secret=cipher_fb.update(password_super_segreta,'utf8','hex');
    facebook_secret+=cipher_fb.final('hex');
    request.body.psw1=facebook_secret;
  }
  ses = request.session;
  findUser(request,function(ret){
      if(ret==1) { //1 se è gia presente
        console.log("Elemento già registrato");
        response.redirect('/access_page');
      }
      else{
        MongoClient.connect(url_mongo, function(err, db) {
          assert.equal(null, err);
          addUser(db,request,function(){
            ses.email = request.body.email;
            ses.logged=true;
            response.redirect('/index');
          });
        });
      }
    });
});

app.post('/access_page',function(request,response){
  console.log("post access page");
  if(request.body.fb==null){
    const cipher=crypto.createCipher(crypto_type,secret);
    var pswEncrypted=cipher.update(request.body.psw1,'utf8','hex');
    pswEncrypted+=cipher.final('hex');
    request.body.psw1=pswEncrypted;
  }
  else{
    const cipher_fb=crypto.createCipher(crypto_type,supersecret);
    var facebook_secret=cipher_fb.update(password_super_segreta,'utf8','hex');
    facebook_secret+=cipher_fb.final('hex');
    request.body.psw1=facebook_secret;
  }
  ses = request.session;

  findUser(request,function(ret){
    if(ret==0){ //se non lo trova ret=0 allora lo aggiungo direttamente con la stessa politica di register
      if(request.body.fb=='Y'){
        MongoClient.connect(url_mongo, function(err, db) {
          assert.equal(null, err);
          addUser(db,request,function(){
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
    else{//qui l'utente è gia presente nel db allora si passa al verificare la psw inserita oppure se accede tramite facebook bisogna verificare che
        //non abbia fatto l'accesso tramite il form ma direttamente dal pulsantino
      if(request.body.fb=='Y'){
        find_password(request,function(ret){
          if(ret==0){
            console.log("ti sei registrato gia con questa mail ma non tramite fb");
            response.redirect('/access_page/?fb');
          }
          else{
            console.log("psw giusta accesso tramite fb");
            ses.email=request.body.email;
            ses.logged=true;
            response.redirect('/index');
          }
        });
      }
      else{//accesso tramite form di access_page
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
    }
  });
});



//TODO: DA FARE DELETE ELEMENT
app.post('/delete_elem',function(req,res){
  ses = req.session;
  var elem_tbd= req.body.elem.split('_')[1];
  console.log(elem_tbd);
  MongoClient.connect(url_mongo, function(err, db) {
    assert.equal(null, err);
    var cursor = db.collection('Users').find( { "email": ses.email} );
    cursor.limit(1).each(function(err, user) {
      if(user!=null){
        var elems= user.products;
        var item= elems[elem_tbd].itemId;
        db.collection('Users').update({},{$pull: {products:{itemId: item}}});
        res.redirect('back');
      }
      //console.log(doc.products[0].price[0].value);
    });
  });

});
app.listen(8080);
console.log("server is running.....");

//--------Modifiche ebay-api-----------------
//TODO: add eventually ti buildXmlInput   var xmlb=xmlBody.toString().split('ItemId').join("ItemID");//split the string and replace ItemId with ItemID
// and 101 in defaults
//--------Modifiche ebay-api-----------------
