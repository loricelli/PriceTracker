var express= require('express');
var app=express();
var ebay = require('ebay-api/index.js');
var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');
var ObjectId = require('mongodb').ObjectID;
var url_mongo = 'mongodb://localhost:27017/test';
var events=require('events');
var nodemailer= require('nodemailer');
//var transporter = nodemailer.createTransport('smtps://pricetrackerservicemail%40gmail.com:pricetracke@smtp.gmail.com');

var transporter= nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'pricetrackerservicemail@gmail.com',
        pass: 'pricetracke'
    }
});
var mailOptions = {
    from: '"PriceTracker" <lorenzo.ricelli@gmail.com>', // sender address
    to: 'lorenzo.ricelli@gmail.com', // list of receivers
    subject: 'Hello ✔', // Subject line
    text: 'Hello world 🐴', // plaintext body
    html: '<b>Hello world 🐴</b>' // html body
};
var sec=1000;
var min=60*sec;
var hour=60*min;

app.use(require('body-parser').json());
app.use(require('body-parser').urlencoded({extended: true}));


var eventEmitter=new events.EventEmitter();


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
    var range= (target)*1.05;
    if(item.Item.ConvertedCurrentPrice<=target){
      transporter.sendMail({
          from: '"PriceTracker" <pricetrackerservicemail@gmail.com>', // sender address
          to: user.email, // list of receivers
          subject: 'Raggiungimento soglia prodotto', // Subject line
          text: "Il prodotto "+ item.Item.Title+" ha raggiunto la soglia che volevi" // plaintext body
      },
      function(error, info){
         if(error){
             return console.log(error);
         }
         console.log('Message sent: ' + info.response);
     });
    }
    else if(item.Item.ConvertedCurrentPrice < range){
      transporter.sendMail({
          from: '"PriceTracker" <pricetrackerservicemail@gmail.com>', // sender address
          to: user.email, // list of receivers
          subject: 'Raggiungimento soglia prodotto', // Subject line
          text: "Il prodotto "+ item.Item.Title+" è molto vicino alla soglia da te te inserita." // plaintext body
      },
      function(error, info){
         if(error){
             return console.log(error);
         }
         console.log('Message sent: ' + info.response);
     });
    }
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

setInterval(emetti_evento, 30*sec);

app.listen(8081);
console.log("Server running..");
