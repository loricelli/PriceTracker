var fs= require('fs');
var express= require('express');
var app=express();
var ebay = require('ebay-api/index.js');
var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');
var ObjectId = require('mongodb').ObjectID;
var url_mongo = 'mongodb://localhost:27017/test';
var session = require('express-session');
var cookieParser= require('cookie-parser');
var events=require('events');
var nodemailer= require('nodemailer');

//per la sessione
app.use(session({secret: 'francescocoatto'}));
app.use(cookieParser());
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

var transporter= nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'pricetrackerservicemail@gmail.com',
        pass: 'pricetracke'
    }
});
//var transporter = nodemailer.createTransport('smtps://pricetrackerservicemail%40gmail.com:pricetracke@smtp.gmail.com');

var sec=1000;
var min=60*sec;
var hour=60*min;

var eventEmitter=new events.EventEmitter();


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


function is_present(req,url_mongo,item,db,callback){
  ses=req.session;
  var cursor=db.collection('Users').find({
    email:ses.email,
    products:{
      "$elemMatch":{
        "itemId": item.Item.ItemID
      }
    }
  });
  cursor.limit(1).each(function(err,doc){
    assert.equal(null,err);
    if(doc!=null){
      callback(1);
    }
    else {
      callback(0);
    }
  });
}


function insert_element(url_mongo, item, req){
  ses = req.session;
  MongoClient.connect(url_mongo, function(err, db) {
    console.log(req.body.email);
    var present;
    is_present(req,url_mongo,item,db,function(present){
      if(present==0){
        db.collection('Users',function(err,collection){
          if(err) throw err;
          var user;
          if(req.body.email==null) user= ses.email;
          else user=req.body.email.replace(/%[0-9]{2}/g,'@');
          //console.log("user: " + user);
          collection.update({"email": user },{$push: {
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
      }
      else {
        db.close();
      }
    });
  });
}

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
    //console.log("email"+ data.body.email +" psw "+ data.body.psw1);
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
      console.log("user "+req.body.email+"Logged out");
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

app.get('/apisdoc', function(request,response){ //carica la pagina
	response.writeHead(500, {"Content-type": "text/html"});
	console.log("error not logged user");
  fs.createReadStream("./apisdoc.html").pipe(response);
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
              elems.push(doc._id.toString());
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
    //console.log("In data/item");
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
                //console.log("Id è "+id+" e el è "+elems[el].itemId);
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

app.get('/chisiamo',function(request,response){
  response.writeHead(200, {"Content-type": "text/html"});
	console.log("chisiamo request get");
  //response.redirect('/access_page');
  fs.createReadStream("./chisiamo.html").pipe(response);
});


app.post('/index',function(request,response){
	console.log("post index");
  var item_id= parseUrl(request.body.url);
  if(item_id!=null){
  ebay.xmlRequest({
      'serviceName': 'Shopping',
      'opType': 'GetSingleItem',
      'appId': 'LorenzoR-PriceTra-PRD-2e805b337-56dc7eec',      // FILL IN YOUR OWN APP KEY, GET ONE HERE: https://publisher.ebaypartnernetwork.com/PublisherToolsAPI
      params: {
        'ItemId': item_id    // FILL IN A REAL ItemID
        }
  },
  function(error, item) {
      if( item.Item!=null){
        console.log("Entro in insert element");
        insert_element(url_mongo,item,request);
        console.log("inserito elemento Orario: " + item.Timestamp + "\nArticolo: " + item.Item.Title + "\nPrezzo: " + item.Item.ConvertedCurrentPrice.amount +" €");
      }
      response.redirect('back');
    });
  }
});

app.post('/register', function(request, response) {

  response.cookie('email', request.body.email, { maxAge: 900000, httpOnly: true });

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
  response.cookie('email', request.body.email, { maxAge: 900000, httpOnly: true });

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
            console.log("utente registrato gia con questa mail ma non tramite fb");
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
        console.log("Verifico password.....");
        find_password(request,function(ret){
          if(ret==0){
            console.log("oh no! Password errata");
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

app.post('/delete_elem',function(req,res){
  ses = req.session;
  var elem_tbd= req.body.elem.split('_')[1];
  MongoClient.connect(url_mongo, function(err, db) {
    assert.equal(null, err);
    var utente;
    if(req.body.email==null) utente= ses.email;
    else utente=req.body.email;
    var cursor = db.collection('Users').find( { "email": utente} );
    cursor.limit(1).each(function(err, user) {
      if(user!=null){
        var elems= user.products;
        var item= elems[elem_tbd].itemId;
        console.log("utente "+utente+" want to delete elem con id "+item);
        db.collection('Users').update({email:utente},{$pull: {products:{itemId: item}}});
        res.redirect('back');
      }
    });
  });

});
app.get('/deleteAccount',function(req,res){
  ses = req.session;

  MongoClient.connect(url_mongo, function(err, db) {
    assert.equal(null, err);
    var utente;
    if(req.body.email==null) utente= ses.email;
    else utente=req.body.email;
    var cursor = db.collection('Users').findOneAndDelete( { "email": utente} );
    db.close();
  });
  res.redirect('/logout');
});
app.listen(8080);
console.log("server is running.....");

//-----------API-------------------
app.get('/info/listaProdotti/:user_id',function(request,response){
  console.log("GET API DATA USER ID");
  var elems;
  MongoClient.connect(url_mongo, function(err, db) {
    db.collection('Users',function(err,collection){
      if(err) throw err;
      var cursor =db.collection('Users').find( { "_id": ObjectId(request.params.user_id)} );
      cursor.each(function(err, doc) {
        if(doc!=null){
          elems=doc.products;
        }
        else{
          db.close();
          response.send(elems);
        }
    });
    });
  });
});

app.get('/info/dettagliProdotto/:user_id/:item_id',function(request,response){
  console.log("GET API DATA USER ID ITEM");
  var elems;
  var item_id = request.params.item_id;
  MongoClient.connect(url_mongo, function(err, db) {
      db.collection('Users',function(err,collection){
        if(err) throw err;
        var cursor =db.collection('Users').find( { "_id": ObjectId(request.params.user_id)} );
        cursor.each(function(err, doc) {
          var target;
          if(doc!=null){
            elems=doc.products;
            for(var el in elems){
              if(elems[el].itemId==item_id){
                target = elems[el];
                db.close();
                response.send(target);}
            }
          }
          else{
            db.close();
          }
      });
      });
    });
});

app.get('/info/prezzi/:user_id/:item_id',function(request,response){
  console.log("GET API DATA USER ID ITEM");
  var elems;
  var item_id = request.params.item_id;
  MongoClient.connect(url_mongo, function(err, db) {
      db.collection('Users',function(err,collection){
        if(err) throw err;
        var cursor =db.collection('Users').find( { "_id": ObjectId(request.params.user_id)} );
        cursor.each(function(err, doc) {
          var target;
          if(doc!=null){
            elems=doc.products;
            for(var el in elems){
              if(elems[el].itemId==item_id){
                target = elems[el];
                db.close();
                response.send(target.price);}
            }
          }
          else{
            db.close();
          }
      });
      });
    });
});

app.get('/info/profilo/:user_id',function(request,response){
  console.log("GET API DATA USER ID PROFILO");
  var elem;
  MongoClient.connect(url_mongo,function(err,db){
    var cursor=db.collection('Users').find({"_id":ObjectId(request.params.user_id)});
    cursor.each(function(err,doc){
      if(doc!=null){
        elem={
          "email": doc.email,
          "fb":doc.fb,
          "num_elem":doc.products.length
        }

      }
      else{
        db.close();
        response.send(elem);
      }
    });
  });
});
//-----------API-------------------


//-----------------------------PARTE DEL SERVER MAIL----------------------------------------------

    /*
    🙌😎👻👌⌚🎓👓👘💵💴💶💷💸💣🎈📲💭🎮📉🐣🐓🐷🐘🐨🐼🐧🐗🐊🍺🍬🍦🍯🍭🍌🍙🍉🍄🌵🍏🍅🌽⚡🌐⚽🚽🏆🏄🛂🔥🔑🔐🔍🔎
    */


var update_element_ebay=function(target,id,db,user){
  ebay.xmlRequest({
      'serviceName': 'Shopping',
      'opType': 'GetSingleItem',
      'appId': 'LorenzoR-PriceTra-PRD-2e805b337-56dc7eec',      // FILL IN YOUR OWN APP KEY, GET ONE HERE: https://publisher.ebaypartnernetwork.com/PublisherToolsAPI
      params: {
        'ItemId':id    // FILL IN A REAL ItemID
        }
    },
  function(error, item) {
    db.collection("Users").update({"email": user.email, "products.name": item.Item.Title},
    {"$push": {'products.$.price' : {"timestamp": item.Timestamp, "value": item.Item.ConvertedCurrentPrice.amount }}});

    var cursor=db.collection("Users").find({"email": user.email, "products.name": item.Item.Title});
    cursor.each(function(err,doc){
      var prodotti;
      if(doc!=null){
        prodotti=doc.products;
        for(var i in prodotti ){
          if(prodotti[i].name==item.Item.Title && prodotti[i].price.length>10){
            db.collection("Users").update( { "email": user.email,"products.name": item.Item.Title}, { $pop: { 'products.$.price': -1 } });
          }
        }
      }
    });

    var range= (target)*1.05;
    var cursor=db.collection("Users").find({"email": user.email, "products.name": item.Item.Title});
    cursor.each(function(err,doc){
      var prodotti;
      if(doc!=null){
      prodotti=doc.products;
      for(var i in prodotti ){
        if(prodotti[i].name==item.Item.Title){
          if(item.Item.ConvertedCurrentPrice.amount<=target && !prodotti[i].email_sent){
            transporter.sendMail({
                from: '"PriceTracker" <pricetrackerservicemail@gmail.com>', // sender address
                to: user.email, // list of receivers
                subject: 'Raggiungimento soglia prodotto', // Subject line
                text: "Il prodotto "+ item.Item.Title+" ha raggiunto la soglia che volevi 🔍 😎 🐧. Compralo a "+prodotti[i].link // plaintext body
            },
            function(error, info){
               if(error){
                   return console.log(error);
               }
               console.log('Message sent: ' + info.response + " e email_sent è stata cambiata");
               db.collection("Users").update( { "email": user.email,"products.name": item.Item.Title}, { $set: { 'products.$.email_sent':true} });

           });
          }
          else if(item.Item.ConvertedCurrentPrice.amount < range && !prodotti[i].email_sent){
            transporter.sendMail({
                from: '"PriceTracker" <pricetrackerservicemail@gmail.com>', // sender address
                to: user.email, // list of receivers
                subject: 'Raggiungimento soglia prodotto', // Subject line
                text: "Il prodotto "+ item.Item.Title+" è molto vicino alla soglia da te te inserita.⚡ 🎈 🌵" // plaintext body
            },
            function(error, info){
               if(error){
                   return console.log(error);
               }
               console.log('Message sent: ' + info.response + " e email_sent è stata cambiata" );
           });
          }
        }
      }
      }
    });
  });
};


var listener=function(){
  MongoClient.connect(url_mongo,function(err,db){
    assert.equal(err,null);
    var cursor=db.collection('Users').find();
    cursor.each(function(err,user){
      if(user!=null){
        var elem_list=user.products;
        for(var elem in elem_list){
          var id_product=elem_list[elem].itemId;
          var target_product= elem_list[elem].target_price;
          update_element_ebay(target_product,id_product,db,user)
        }
      }
    });
  });
};

eventEmitter.addListener("check_prices",listener);

var emetti_evento=function(){
  console.log("check prices emesso");
  eventEmitter.emit("check_prices");
}

setInterval(emetti_evento, 12*hour);

//-----------------------------FINE PARTE DEL SERVER MAIL-----------------------------------------

//--------Modifiche ebay-api-----------------
//TODO: add eventually ti buildXmlInput   var xmlb=xmlBody.toString().split('ItemId').join("ItemID");//split the string and replace ItemId with ItemID
// and 101 in defaults
//--------Modifiche ebay-api-----------------
