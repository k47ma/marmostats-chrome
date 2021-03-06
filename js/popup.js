/* JavaScript for toggle chart visibility */

// set the correct state for toggle button and add event listener
function setup_toggle(button, key, default_value) {
    chrome.storage.local.get([key], function(result) {
        if (!result.hasOwnProperty(key)) {
            var data = new Object();
            data[key] = default_value;
            chrome.storage.local.set(data);
            button.checked = default_value;
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
}

// setup title events
function setup_title(title_id, table_id) {
    var title = document.getElementById(title_id);
    var arrow = document.createElement('img');
    arrow.src = '../icons/arrow-down-32.png';
    arrow.classList.add('marmostats-icon-toggle');
    title.parentElement.insertBefore(arrow, title);

    chrome.storage.local.get([table_id], function(result) {
        if (!result.hasOwnProperty(table_id)) {
            var data = new Object();
            data[table_id] = true;
            chrome.storage.local.set(data);
        } else if (!result[table_id]) {
            document.getElementById(table_id).classList.add('hide');
            arrow.classList.add('marmostats-rotated');
        }
    });

    title.parentElement.addEventListener('click', function() {
        var table = document.getElementById(table_id);
        if (table.classList.contains('hide')) {
            table.classList.remove('hide');
        } else {
            table.classList.add('hide');
        }
        //$('#' + table_id).slideToggle(200);
        var data = new Object();
        if (arrow.classList.contains('marmostats-rotated')) {
            data[table_id] = true;
            arrow.classList.remove('marmostats-rotated');
        } else {
            data[table_id] = false;
            arrow.classList.add('marmostats-rotated');
        }
        chrome.storage.local.set(data);
    });
}

$(document).ready(function() {
    const manifest = chrome.runtime.getManifest();

    var homepage_button = document.getElementById('marmostats-homepage-toggle');
    var overview_button = document.getElementById('marmostats-overview-toggle');
    var testdetail_button = document.getElementById('marmostats-testdetail-toggle');
    var type_button = document.getElementById('marmostats-type-toggle');
    var header_button = document.getElementById('marmostats-tableheader-toggle');

    setup_toggle(homepage_button, 'chart_homepage', true);
    setup_toggle(overview_button, 'chart_overview', true);
    setup_toggle(testdetail_button, 'chart_testdetail', true);
    setup_toggle(type_button, 'chart_isbar', true);
    setup_toggle(header_button, 'table_header', true);

    setup_title('marmostats-chart-title', 'marmostats-chart-table');
    setup_title('marmostats-table-title', 'marmostats-table-table');

    var version_tag = document.getElementById('marmostats-version');
    version_tag.innerText = 'v' + manifest.version;
});