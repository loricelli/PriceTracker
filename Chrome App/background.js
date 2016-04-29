
	chrome.contextMenus.create({
		title: "Tracker",
		contexts: ["page", "selection", "image", "link"],
		//icon: "calculator-16.png"
		"onclick": contextClicked
		//"icon": "calculator-16.png"
	});


function contextClicked(e){
	console.log("SONO QUI");
	chrome.cookies.get({url: "http://localhost:8080",name: 'email'},function(cookie) {
		console.log(cookie.value);
		var target_price = prompt("Inserire prezzo target", "");
    $.ajax({
        url: "http://localhost:8080/index",
        type: "POST",
        data: {url: e.pageUrl, email: cookie.value,target:target_price},
        success: function(data, textStatus) {
            console.log("success");
            console.log(data);
            console.log(textStatus);
        },
        error: function(XMLHttpRequest, textStatus, errorThrown) {
            console.log("error");
            console.log(XMLHttpRequest);
            console.log(textStatus);
            console.log(errorThrown);
        },
        complete: function(XMLHttpRequest, textStatus) {
            console.log("complete");
        }
				});
    });
}
