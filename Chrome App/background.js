
	chrome.contextMenus.create({
		title: "Tracker",
		contexts: ["page", "selection", "image", "link"],
		//icon: "calculator-16.png"
		"onclick": contextClicked
		//"icon": "calculator-16.png"
	});


function contextClicked(e){
    $.ajax({
        url: "http://localhost:8080/",
        type: "POST",
        data: {url: e.pageUrl},
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
}
