function generateItems(){
  $.get("http://localhost:8080/data", function(data){
    var tbody = '';
     var theader = '<div><table width="100%" class="prods"><th class="prods" colspan="3">Prodotti</th>\n';
         for(i=0; i<data.length; i++){
              tbody += '<tr style="vertical-align:middle;" width="100%" class="prods">';
              tbody += '<td class="prods">';
              tbody += '<input align="center" type="image" src="/remove-32.png" width=26 height=26 name="remove"/>';
              tbody += '</td>'
              tbody += '<td class="prods">';
              tbody += data[i].Title.toLowerCase().substring(0,25) +".." ;
              tbody += '</td>';
              tbody += '<td class="prods">';
              tbody += '<input align="center" type="image" src="/cart-32.png" name="all"/>';
              tbody += '</td>'
              tbody += '</tr>\n';
         }
    var tfooter = '</table></div>';
    document.getElementById('products').innerHTML = theader + tbody + tfooter;
    });
}
