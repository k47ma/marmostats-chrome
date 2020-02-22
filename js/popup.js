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

// setup title events
function setup_title(title_id, table_id) {
    var title = document.getElementById(title_id);
    var arrow = document.createElement('img');
    arrow.src = '../icons/arrow-down-32.png';
    arrow.classList.add('marmostats-icon-small');
    title.parentElement.insertBefore(arrow, title);

    title.parentElement.addEventListener('click', function() {
        $('#' + table_id).slideToggle(400);
        if (arrow.classList.contains('marmostats-rotated')) {
            arrow.classList.remove('marmostats-rotated');
        } else {
            arrow.classList.add('marmostats-rotated');
        }
    });
}

document.addEventListener('DOMContentLoaded', function() {
    var homepage_button = document.getElementById('marmostats-homepage-toggle');
    var overview_button = document.getElementById('marmostats-overview-toggle');
    var testdetail_button = document.getElementById('marmostats-testdetail-toggle');

    setup_toggle(homepage_button, 'chart_homepage');
    setup_toggle(overview_button, 'chart_overview');
    setup_toggle(testdetail_button, 'chart_testdetail');

    setup_title('marmostats-chart-title', 'marmostats-chart-table');
});