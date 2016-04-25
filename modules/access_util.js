function testAPI() {
console.log('Welcome!  Fetching your information.... ');
FB.api('/me', {fields: ['email', 'name']},function(response) {
  console.log('Stampo info facebook');
  console.log(response);
  $.ajax({
    type: "POST",
    url: "http://localhost:8080/access_page",
    data: {email: response.email, psw1: response.name, fb: "Y"},
    success: function(data){
      console.log("sono in success");
     window.location.replace("http://localhost:8080/index");
    }
  });
});
}
