

function generateItems(){
  $.get("http://localhost:8080/data", function(data){
    var tbody = '';
    var singleItem;
    var theader = '<div><table width="100%" class="prods"><th class="prods" colspan="3">Prodotti</th>\n';
       for(i=0; i<data.length-1; i++){
            tbody += '<tr style="vertical-align:middle;" width="100%" class="prods">';
            tbody += '<td class="prods">';
            tbody += '<input id="remove_'+i+'" align="center" type="image" src="/remove-32.png" width=26 height=26 name="remove" onclick="deleteElem(id)"/>';
            tbody += '</td>'
            tbody += '<td class="prods">';
            tbody += data[i].name.toLowerCase().substring(0,25) +".." ;
            tbody += '</td>';
            tbody += '<td class="prods">';
            singleItem = JSON.stringify(data[i].itemId);
            tbody += '<input align="center" type="image" src="/cart-32.png" name="all" onclick="getItemData('+singleItem.replace(/\"/g, "")+');"/>';
            tbody += '</td>';
            tbody += '</tr>\n';

       }
    var tfooter = '</table></div>';
    document.getElementById('products').innerHTML = theader + tbody + tfooter;
    document.getElementById('objid').innerHTML = "IdUtente: "+data[data.length-1];
    });
}

function deleteElem(id){
  var result = confirm("Want to delete?");
  if(result){
    $.ajax({
      type: "POST",
      url: "http://localhost:8080/delete_elem",
      data: {elem: id},
      success: function(data){
        console.log("eliminato");
       window.location.replace("http://localhost:8080/index");
      }
    });
  }
}

function getItemData(item){
  $.get("http://localhost:8080/data/"+item,function(data){
     var htmlProd = '<table id="dett">';
     for(var el in data){
       var lookup = el.toString();
       if(el=="img") htmlProd+='<tr><td id="imma"><img src="'+data[el]+' width="150" height="150"></img></td><td>Grafico?</td></tr>';
       else if(el=="link") htmlProd += "<tr><td colspan='2'>"+el+":<a href='"+data[el]+"' onclick='window.open(this.href);return false'> link al prodotto</a></td></tr>";
       else if(el=="price") htmlProd += "<tr><td colspan='2'>"+el+": "+data[el][data[el].length-1]['value'] +"€ e è stato controllato il "+data[el][data[el].length-1]['timestamp']+"</td></tr>";
       else htmlProd += "<tr><td colspan='2'>"+el+": "+data[el]+"</td></tr>";
     }
     //htmlProd += JSON.stringify(data);
     htmlProd += '</table>';
      document.getElementById("specs").innerHTML = htmlProd;
  });
}
