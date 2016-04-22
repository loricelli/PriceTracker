function testAPI() {
console.log('Welcome!  Fetching your information.... ');
FB.api('/me', function(response) {
  console.log('Stampo info facebook');
  console.log(response);
  $.ajax({
    type: "POST",
    url: "http://localhost:8080/access_page",
    data: {mail: response.email, psw1: response.name},
    success: function(data){
      window.location.replace("http://localhost:8080/index");
    }
  });
});
}
