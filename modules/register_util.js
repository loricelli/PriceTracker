function testAPI() {
console.log('Welcome!  Fetching your information.... ');
FB.api('/me',{fields: ['email', 'name']}, function(response) {
  console.log('Stampo info facebook');

  $.ajax({
    type: "POST",
    url: "http://price-trackerservice.rhcloud.com/register",
    data: {email: response.email, psw1: response.name, fb: "Y"},
    success: function(data){
      window.location.replace("http://price-trackerservice.rhcloud.com/index");
    }
  });
});
}

function check_form(documento){
	var psw1= documento.url_in.psw1.value;
	var psw2= documento.url_in.psw2.value;
  var mail= documento.url_in.email.value;
  var res=true;
  for(var i in DOMAINS){
    if(mail.search(DOMAINS[i])>=0){
      res= res && true;
    }
  }

	if(psw1==psw2){ //match
    res =res && true;
  }
  if(psw1.length<6 && psw2.length<6){
    res = res && false;
  }
  if(!res) alert("Campi errati, bitch!");
	return res;
}

var DOMAINS = [
  /* Default domains included */
  "aol.com", "att.net", "comcast.net", "facebook.com", "gmail.com", "gmx.com", "googlemail.com",
  "google.com", "hotmail.com", "hotmail.co.uk", "mac.com", "me.com", "mail.com", "msn.com",
  "live.com", "sbcglobal.net", "verizon.net", "yahoo.com", "yahoo.co.uk",

  /* Other global domains */
  "email.com", "games.com" /* AOL */, "gmx.net", "hush.com", "hushmail.com", "icloud.com", "inbox.com",
  "lavabit.com", "love.com" /* AOL */, "outlook.com", "pobox.com", "rocketmail.com" /* Yahoo */,
  "safe-mail.net", "wow.com" /* AOL */, "ygm.com" /* AOL */, "ymail.com" /* Yahoo */, "zoho.com", "fastmail.fm",
  "yandex.com",

  /* United States ISP domains */
  "bellsouth.net", "charter.net", "comcast.net", "cox.net", "earthlink.net", "juno.com",

  /* British ISP domains */
  "btinternet.com", "virginmedia.com", "blueyonder.co.uk", "freeserve.co.uk", "live.co.uk",
  "ntlworld.com", "o2.co.uk", "orange.net", "sky.com", "talktalk.co.uk", "tiscali.co.uk",
  "virgin.net", "wanadoo.co.uk", "bt.com",

  /* Domains used in Asia */
  "sina.com", "qq.com", "naver.com", "hanmail.net", "daum.net", "nate.com", "yahoo.co.jp", "yahoo.co.kr", "yahoo.co.id", "yahoo.co.in", "yahoo.com.sg", "yahoo.com.ph",

  /* French ISP domains */
  "hotmail.fr", "live.fr", "laposte.net", "yahoo.fr", "wanadoo.fr", "orange.fr", "gmx.fr", "sfr.fr", "neuf.fr", "free.fr",
  /* italian ISP domains */
  "hotmail.it", "live.it", "laposte.it", "yahoo.it", "wanadoo.it", "orange.it", "gmx.it", "sfr.it", "neuf.it", "free.it",

  /* German ISP domains */
  "gmx.de", "hotmail.de", "live.de", "online.de", "t-online.de" /* T-Mobile */, "web.de", "yahoo.de",

  /* Russian ISP domains */
  "mail.ru", "rambler.ru", "yandex.ru", "ya.ru", "list.ru",

  /* Belgian ISP domains */
  "hotmail.be", "live.be", "skynet.be", "voo.be", "tvcablenet.be", "telenet.be",

  /* Argentinian ISP domains */
  "hotmail.com.ar", "live.com.ar", "yahoo.com.ar", "fibertel.com.ar", "speedy.com.ar", "arnet.com.ar",

  /* Domains used in Mexico */
  "hotmail.com", "gmail.com", "yahoo.com.mx", "live.com.mx", "yahoo.com", "hotmail.es", "live.com", "hotmail.com.mx", "prodigy.net.mx", "msn.com"
];
