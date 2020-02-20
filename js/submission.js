/* Script for submission detail */

var interval = null;
var refresh_time = 5;

const current_url = window.location.href;

// removes newline characters in string
function remove_newlines(s) {
    return s.replace(/(\r\n|\n|\r)|at/gm, '');
}

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
            refresh_countdown(refresh_tags, time_left - 1);
        }, 1000);
    }
}

// add tooltip to the given element
function add_tooltip(target, content) {
    var tooltip = document.createElement('span');
    tooltip.innerHTML = content;
    tooltip.classList.add('marmostats-tooltip');

    target.appendChild(tooltip);
    target.addEventListener('mouseenter', function(e) {
        tooltip.style.visibility = 'visible';
    });
    target.addEventListener('mouseleave', function(e) {
        tooltip.style.visibility = 'hidden';
    });

    tooltip.style.marginLeft = -tooltip.clientWidth / 2 + 'px';
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

    for (var test_tag of rows[1].getElementsByTagName('th')) {
        test_tag.classList.add('marmostats-tooltip-container');
        const test_fullname = test_tag.children[0].getAttribute('title');
        add_tooltip(test_tag, test_fullname);
        test_tag.children[0].removeAttribute('title');
    }

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
            var passed_any = false;
            for (var curr_test = test_ind; curr_test < rows[i].children.length; ++curr_test) {
                if (!rows[i].children[curr_test].classList.contains('passed')) {
                    passed_all = false;
                } else {
                    passed_any = true;
                }
            }

            if (result_tag.textContent == 'did not compile') {
                result_tag.style.backgroundColor = 'rgba(255, 69, 0, 0.25)';
            } else if (passed_all) {
                result_tag.style.backgroundColor = 'rgba(122, 235, 122, 0.25)';
            } else if (passed_any) {
                result_tag.style.backgroundColor = 'rgba(255, 213, 0, 0.5)';
            } else {
                result_tag.style.backgroundColor = 'rgba(255, 69, 0, 0.25)';
            }
        }
    }

    if (refresh) {
        refresh_countdown(refresh_tags, refresh_time);
    }

    set_page_styles();
}

// change styles for page elements
function set_page_styles() {
    var due_text = '';
    var due_time = null;

    // set background color for deadline text
    for (var tag of document.getElementsByTagName('p')) {
        if (tag.textContent.startsWith('Deadline')) {
            var text_node = tag.childNodes[1];
            due_text = text_node.textContent.replace(/(\r\n|\n|\r)|at/gm, '');
            due_time = Date.parse(due_text);
            const current_time = Date.now();
            var text_tag = document.createElement('span');
            text_tag.innerText = remove_newlines(text_node.textContent);
            text_node.replaceWith(text_tag);
            if (!due_time) {
                text_tag.style.backgroundColor = 'rgba(255, 213, 0, 0.5)';
            } else if (due_time < current_time) {
                text_tag.style.backgroundColor = 'rgba(255, 69, 0, 0.5)';
            } else {
                text_tag.style.backgroundColor = 'rgba(122, 235, 122, 0.5)';
            }
            break;
        }
    }

    if (!due_text) return;

    // set background color for table contents
    var result_table = document.getElementById('marmostats-submission-table');
    var submission_ind = -1;
    var rows = result_table.getElementsByTagName('tr');
    const titles = rows[0].getElementsByTagName('th');

    for (var i = 0; i < titles.length; ++i) {
        if (submission_ind == -1 && titles[i].textContent === 'date submitted') {
            submission_ind = i;
            break;
        }
    }

    for (var i = 2; i < rows.length; ++i) {
        if (!(rows[i].classList.contains('r0') || rows[i].classList.contains('r1'))) {
            continue;
        }

        if (submission_ind != -1 && submission_ind < rows[i].children.length) {
            var submission_cell = rows[i].children[submission_ind];
            const year = new Date().getFullYear();
            const submission_text = remove_newlines(submission_cell.textContent) + ' ' + year;
            const submission_time = Date.parse(submission_text);
            if (!submission_time || !due_time) {
                submission_cell.style.backgroundColor = 'rgba(255, 213, 0, 0.25)';
            } else if (due_time < submission_time) {
                submission_cell.style.backgroundColor = 'rgba(255, 69, 0, 0.25)';
            } else {
                submission_cell.style.backgroundColor = 'rgba(122, 235, 122, 0.25)';
            }
        }
    }
}

$(document).ready(function() {
    var submission_table = document.getElementsByTagName('table')[0];
    submission_table.id = 'marmostats-submission-table';

    check_not_tested();
})
