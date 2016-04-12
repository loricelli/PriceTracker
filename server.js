var bodyParser= require("/usr/lib/node_modules/body-parser");
var fs= require('fs');
var express= require('/usr/lib/node_modules/express');
var app=express();
app.use(bodyParser());
var ebay = require('/home/lorenzo/node_modules/ebay-api/index.js');
var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');
var ObjectId = require('mongodb').ObjectID;
var url_mongo = 'mongodb://localhost:27017/test';

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
//------------------AUX FUNCTIONS-----------------------------------

app.get('/', function(request,response){ //carica la pagina
	response.writeHead(200, {"Content-type": "text/html"});
	console.log("main request get");
	fs.createReadStream("./index.html").pipe(response);
});


app.post('/',function(request,response){

	console.log("main request post");
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
	response.redirect('/');
});

app.listen(8080);
console.log("server is running.....");

//--------Modifiche ebay-api-----------------
//TODO: add eventually ti buildXmlInput   var xmlb=xmlBody.toString().split('ItemId').join("ItemID");//split the string and replace ItemId with ItemID
// and 101 in defaults
//--------Modifiche ebay-api-----------------
