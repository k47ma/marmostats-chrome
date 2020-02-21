/* JavaScript for toggle chart visibility */

// set the correct state for toggle button and add event listener
function setup_toggle(button, key) {
    chrome.storage.local.get([key], function(result) {
        if (!result.hasOwnProperty(key)) {
            var data = new Object();
            data[key] = true;
            chrome.storage.local.set(data, function() {});
            button.checked = true;
        } else if (result[key]) {
            button.checked = true;
        } else {
            button.checked = false;
        }
    });

    button.addEventListener('click', function() {
        var data = new Object();
        if (!button.checked) {
            data[key] = false;
        } else {
            data[key] = true;
        }
        chrome.storage.local.set(data, function() {});
    });
};

document.addEventListener('DOMContentLoaded', function() {
    var homepage_toggle = document.getElementById('marmostats-homepage-toggle');
    var overview_toggle = document.getElementById('marmostats-overview-toggle');
    var testdetail_toggle = document.getElementById('marmostats-testdetail-toggle');

    setup_toggle(homepage_toggle, 'chart_homepage');
    setup_toggle(overview_toggle, 'chart_overview');
    setup_toggle(testdetail_toggle, 'chart_testdetail');
});