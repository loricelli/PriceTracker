var express= require('express');
var app=express();
var ebay = require('ebay-api/index.js');
var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');
var ObjectId = require('mongodb').ObjectID;
var url_mongo = 'mongodb://localhost:27017/test';
var events=require('events');

var sec=1000;
var min=60*sec;
var hour=60*min;

app.use(require('body-parser').json());
app.use(require('body-parser').urlencoded({extended: true}));


var eventEmitter=new events.EventEmitter();


var update_element_ebay=function(id,db,user){
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
    }
  );
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
          update_element_ebay(id_product,db,user)
        }
      }
    });
  });
};

eventEmitter.addListener("check_prices",listener);

var emetti_evento=function(){
  eventEmitter.emit("check_prices");
  console.log("check prices emesso");
}

/*var fake_event=function(){
  console.log("YOLO");
}*/

setInterval(emetti_evento, hour);
//setInterval(fake_event, 1000);

app.listen(8081);
