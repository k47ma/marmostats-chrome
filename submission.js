/* Script for submission detail */

var interval = null;
var refresh_time = 5;

const current_url = window.location.href;

// refresh the submission table and check not tested again
function refresh_table() { 
    $.get(current_url, function(response) {
        var doc = document.createElement('html');
        doc.innerHTML = response;
        const new_table = doc.getElementsByTagName('table')[0];

        var submission_table = document.getElementById('marmostats-submission-table');
        submission_table.innerHTML = new_table.innerHTML;

        check_not_tested();
    });
} 

// count down until 0 seconds, and then refresh the page
function refresh_countdown(refresh_tags, time_left) {
    for (var tag of refresh_tags) {
        tag.innerText = 'not tested yet (' + time_left + ')';
    }

    if (time_left == 0) {
        refresh_table();
    } else {
        setTimeout(function() {
            refresh_countdown(refresh_tags, time_left - 1)
        }, 1000);
    }
}

// check test cases that are not tested and refresh every 5 seconds
function check_not_tested() {
    var submission_table = document.getElementById('marmostats-submission-table');
    var rows = submission_table.getElementsByTagName('tr');
    const titles = rows[0].getElementsByTagName('th');

    var results_ind = -1;
    var test_ind = -1;
    for (var i = 0; i < titles.length; ++i) {
        if (results_ind == -1 && titles[i].innerText == 'Results') {
            results_ind = i;
        } else if (test_ind == -1 && titles[i].innerText == 'Public') {
            test_ind = i;
        }
    }

    if (results_ind == -1 || test_ind == -1) return;

    var refresh = false;
    var refresh_tags = new Array();
    for (var i = 2; i < rows.length; ++i) {
        var result_tag = rows[i].children[results_ind]
        if (result_tag.innerText == 'not tested yet') {
            result_tag.style.backgroundColor = 'rgba(30, 144, 255, 0.25)';
            refresh_tags.push(result_tag);
            refresh = true;
        } else if (result_tag.innerText) {
            var passed_all = true;
            for (var curr_test = test_ind; curr_test < rows[i].children.length; ++curr_test) {
                if (!rows[i].children[curr_test].classList.contains('passed')) {
                    passed_all = false;
                    break;
                }
            }

            if (passed_all) {
                result_tag.style.backgroundColor = 'rgba(122, 235, 122, 0.25)';
            } else {
                result_tag.style.backgroundColor = 'rgba(255, 213, 0, 0.5)';
            }
        }
    }

    if (refresh) {
        refresh_countdown(refresh_tags, refresh_time);
    }
}

$(document).ready(function() {
    var submission_table = document.getElementsByTagName('table')[0];
    submission_table.id = 'marmostats-submission-table';

    check_not_tested();
})
