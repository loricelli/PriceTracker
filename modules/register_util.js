function testAPI() {
console.log('Welcome!  Fetching your information.... ');
FB.api('/me',{fields: ['email', 'name']}, function(response) {
  console.log('Stampo info facebook');

  $.ajax({
    type: "POST",
    url: "http://localhost:8080/register",
    data: {email: response.email, psw1: response.name},
    success: function(data){
      window.location.replace("http://localhost:8080/index");
    }
  });
});
}
