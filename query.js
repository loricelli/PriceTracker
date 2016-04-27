
function get(res){
  print(tojson(res));
}

db.Users.find({"products.link":"www.a.it"},{target:1}).pretty()

/*db.products.findAndModify({
   query:{_id:2,product_available:{$gt:0}},
   update:{
      $inc:{product_available:-1},
      $push:{product_bought_by:{customer:"rob",date:"9-Jan-2014"}}
   }



   To create an index on tags array, use the following code:

   >db.users.ensureIndex({"tags":1})


   
})*/
