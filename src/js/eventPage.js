var _x = function (xpath, value) {
    var xresult = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null),
        xres;
    xres = xresult.singleNodeValue;
    xres.value = value;
};

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    if (message.processQueue) {
        var site_id = message.processQueue;

        chrome.storage.local.get(null, function (items) {
            var sites = items.sites,
                mappings = items.mappings,
                settings = items.settings;



            chrome.tabs.update({ url: sites[site_id].url }, function (tab) {
                var jscode = '(function () {var _x='+_x.toString()+';';
                var intervalId = setInterval(function () {
                    chrome.tabs.get(tab.id, function (tab) {
                        if (tab.status == 'complete') {
                            clearInterval(intervalId);
                            if (mappings[site_id]) {
                                for (var xpath in mappings[site_id]) {
                                    if (mappings[site_id].hasOwnProperty(xpath)) { // filter
                                        var mapping = mappings[site_id][xpath],
                                            value = settings[mapping];

                                        value = value.replace(/'/g, "\\'");
                                        jscode += "_x('"+xpath+"', '"+value+"');";
                                    }
                                }
                                jscode += '}());';
                                console.log(jscode);
                                chrome.tabs.executeScript(tab.id, { code: jscode });
                            }
                        }
                    });
                }, 250);
            });
        });
    }
});
