function generateItems(){
  $.get("http://localhost:8080/data", function(data){
    var tbody = '';
     var theader = '<div><table width="100%">\n';
         for(i=0; i<data.length; i++){
            tbody += '<tr style="vertical-align:middle;" width="100%">';
              tbody += '<td>';
              tbody += data[i].Title.toLowerCase().substring(0,25) +".." ;
              tbody += '<input align="right" type="image" src="/cart-32.png" name="all"/>';
              tbody += '</td>'
              tbody += '</tr>\n';
              }
    var tfooter = '</table></div>';
    document.getElementById('products').innerHTML = theader + tbody + tfooter;
    });
console.log("fatta get");

}
