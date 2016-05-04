function testAPI() {
console.log('Welcome!  Fetching your information.... ');
FB.api('/me', {fields: ['email', 'name']},function(response) {
  console.log('Stampo info facebook');
  console.log(response);
  $.ajax({
    type: "POST",
    url: "http://price-trackerservice.rhcloud.com/access_page",
    data: {email: response.email, psw1: response.name, fb: "Y"},
    success: function(data){
      console.log("sono in success");
     window.location.replace("http://price-trackerservice.rhcloud.com/index");
    }
  });
});
}

function messaggioErrore(){
  urlq = location.href.split('?');
  urlP = urlq[1];
  if(urlP=='error') alert("password errata! ");
  if(urlP=='fb') alert("sei gia registrato tramite facebook! \n devi accedere tramite il pulsante di facebook ");
}
