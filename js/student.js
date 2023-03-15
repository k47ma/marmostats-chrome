/* Script for parsing student's test results */

const total_sub_ind = 2;
const latest_sub_ind = 3;
const latest_result_ind = 4;
const max_result_ind = 5;

const refresh_time = 5;

// create a new loading image tag
function make_loading_image() {
    var image_tag = document.createElement('img');
    image_tag.src = chrome.runtime.getURL('icons/loading.gif');
    image_tag.style.width = '18px';
    image_tag.style.height = '18px';
    return image_tag;
}

// parse the due date from page content
function parse_due_date(doc) {
    for (var tag of doc.getElementsByTagName('p')) {
        if (tag.textContent.startsWith('Deadline')) {
            var text_node = tag.childNodes[1];
            due_text = text_node.textContent.replace(/(\r\n|\n|\r)|at/gm, '');
            due_time = Date.parse(due_text);
            return due_time;
        }
    }
}

// sum up the results
function sum_results(results) {
    if (results.indexOf('/') == -1) {
        return 0;
    }

    const score_list = results.split('/');
    return score_list.reduce((a, b) => parseInt(a) + parseInt(b), 0);
}

// removes newline characters in string
function remove_newlines(s) {
    return s.replace(/(\r\n|\n|\r)|at/gm, '');
}

// check whether all test cases passed
function is_all_passed(row, test_ind) {
    for (var curr_test = test_ind; curr_test < row.children.length; ++curr_test) {
        if (!row.children[curr_test].classList.contains('passed')) {
            return false;
        }
    }
    return true;
}

// check whether all test cases failed
function is_all_failed(row, test_ind) {
    for (var curr_test = test_ind; curr_test < row.children.length; ++curr_test) {
        if (row.children[curr_test].classList.contains('passed')) {
            return false;
        }
    }
    return true;
}

// count down until 0 seconds, and then refresh the page
function refresh_countdown(refresh_tag, time_left, callback) {
    refresh_tag.innerText = 'not tested yet (' + time_left + ')';

    if (time_left == 0) {
        callback();
    } else {
        setTimeout(function() {
            refresh_countdown(refresh_tag, time_left - 1, callback);
        }, 1000);
    }
}

// load project statistics
function update_project_stats(project_url, total_sub_tag, latest_sub_tag,
                              latest_result_tag, max_result_tag) {
    $.get(project_url, function(response) {
        var doc = document.createElement('html');
        doc.innerHTML = response;
        const submission_table = doc.getElementsByTagName('table')[0];
        const rows = submission_table.getElementsByTagName('tr');

        var sub_ind = -1;
        var result_ind = -1;
        var test_ind = -1;
        for (var i = 0; i < rows[0].children.length; ++i) {
            if (sub_ind == -1 && rows[0].children[i].innerText == 'date submitted') {
                sub_ind = i;
            } else if (result_ind == -1 && rows[0].children[i].innerText == 'Results') {
                result_ind = i;
            } else if (test_ind == -1 && rows[0].children[i].innerText == 'Public') {
                test_ind = i;
            }
        }

        var total_sub = 0;
        for (const row of rows) {
            if (!(row.classList.contains('r0') || row.classList.contains('r1'))) {
                continue;
            }
            ++total_sub;
        }

        total_sub_tag.innerHTML = total_sub;
        if (total_sub == 0) {
            latest_sub_tag.innerHTML = '-';
            latest_result_tag.innerHTML = '-';
            max_result_tag.innerHTML = '-';
        } else {
            const due_date = parse_due_date(doc);
            const test_completed = rows[2].children[result_ind].getElementsByTagName('a').length > 0;
            var latest_link = test_completed ? rows[2].children[result_ind].children[0].href : '';

            const latest_sub = rows[2].children[sub_ind].innerText;
            const latest_time = Date.parse(latest_sub);
            const latest_tag_type = test_completed ? 'a' : 'span';
            const latest_tag = document.createElement(latest_tag_type);
            latest_tag.innerText = latest_sub;
            if (test_completed) {
                latest_tag.href = latest_link;
            }
            latest_sub_tag.innerHTML = '';
            latest_sub_tag.appendChild(latest_tag);
            if (latest_time < due_date) {
                latest_sub_tag.style.backgroundColor = 'rgba(122, 235, 122, 0.25)';
            } else {
                latest_sub_tag.style.backgroundColor = 'rgba(255, 69, 0, 0.25)';
            }

            const latest_result = rows[2].children[result_ind].innerText;
            const latest_result_type = test_completed ? 'a' : 'span';
            const latest_result_link = document.createElement(latest_result_type);
            latest_result_link.innerText = remove_newlines(latest_result);
            if (test_completed) {
                latest_result_link.href = latest_link;
            }
            latest_result_tag.innerHTML = '';
            latest_result_tag.appendChild(latest_result_link);
            if (latest_result == 'not tested yet') {
                latest_result_tag.style.backgroundColor = 'rgba(30, 144, 255, 0.25)';
            } else if (latest_result == 'did not compile') {
                latest_result_tag.style.backgroundColor = 'rgba(255, 69, 0, 0.25)';
            } else if (is_all_passed(rows[2], test_ind)) {
                latest_result_tag.style.backgroundColor = 'rgba(122, 235, 122, 0.25)';
            } else if (is_all_failed(rows[2], test_ind)) {
                latest_result_tag.style.backgroundColor = 'rgba(255, 69, 0, 0.25)';
            } else {
                latest_result_tag.style.backgroundColor = 'rgba(255, 213, 0, 0.5)';
            }

            var max_result = latest_result;
            var max_score = sum_results(latest_result);
            var max_link = latest_link;
            var max_row = rows[2];
            for (var i = 2; i < rows.length; ++i) {
                const result = rows[i].children[result_ind].innerText;
                const score = sum_results(result);

                if (score > max_score) {
                    max_score = score;
                    max_result = result;
                    max_link = rows[i].children[result_ind].children[0].href;
                    max_row = rows[i];
                }
            }

            const max_result_link = document.createElement('a');
            max_result_link.innerText = remove_newlines(max_result);
            max_result_link.href = max_link;
            max_result_tag.innerHTML = '';
            max_result_tag.appendChild(max_result_link);

            if (max_result == 'not tested yet') {
                max_result_tag.style.backgroundColor = 'rgba(30, 144, 255, 0.25)';
            } else if (max_result == 'did not compile') {
                max_result_tag.style.backgroundColor = 'rgba(255, 69, 0, 0.25)';
            } else if (is_all_passed(max_row, test_ind)) {
                max_result_tag.style.backgroundColor = 'rgba(122, 235, 122, 0.25)';
            } else if (is_all_failed(max_row, test_ind)) {
                max_result_tag.style.backgroundColor = 'rgba(255, 69, 0, 0.25)';
            } else {
                max_result_tag.style.backgroundColor = 'rgba(255, 213, 0, 0.5)';
            }

            if (latest_result == 'not tested yet') {
                refresh_countdown(latest_result_tag, refresh_time, function() {
                    update_project_stats(project_url, total_sub_tag, latest_sub_tag,
                                         latest_result_tag, max_result_tag)
                });
            }
        }
    });
}

// add test results student table
function display_results() {
    var student_table = document.getElementsByTagName('table')[0];
    student_table.id = 'marmostats-student-table';
    var rows = student_table.getElementsByTagName('tr');

    var total_sub_title = document.createElement('th');
    total_sub_title.innerHTML = '#<br />subs';
    rows[0].insertBefore(total_sub_title, rows[0].children[total_sub_ind]);

    var latest_sub_title = document.createElement('th');
    latest_sub_title.innerHTML = 'latest<br />submission';
    rows[0].insertBefore(latest_sub_title, rows[0].children[latest_sub_ind]);

    var latest_result_title = document.createElement('th');
    latest_result_title.innerHTML = 'latest<br />result';
    rows[0].insertBefore(latest_result_title, rows[0].children[latest_result_ind]);

    var max_result_title = document.createElement('th');
    max_result_title.innerHTML = 'max<br />result';
    rows[0].insertBefore(max_result_title, rows[0].children[max_result_ind]);

    for (var row_ind = 1; row_ind < rows.length; ++row_ind) {
        const project_url = rows[row_ind].children[1].children[0].href;

        var total_sub_tag = document.createElement('td');
        total_sub_tag.appendChild(make_loading_image());
        rows[row_ind].insertBefore(total_sub_tag, rows[row_ind].children[total_sub_ind]);

        var latest_sub_tag = document.createElement('td');
        latest_sub_tag.appendChild(make_loading_image());
        rows[row_ind].insertBefore(latest_sub_tag, rows[row_ind].children[latest_sub_ind]);

        var latest_result_tag = document.createElement('td');
        latest_result_tag.appendChild(make_loading_image());
        rows[row_ind].insertBefore(latest_result_tag, rows[row_ind].children[latest_result_ind]);

        var max_result_tag = document.createElement('td');
        max_result_tag.appendChild(make_loading_image());
        rows[row_ind].insertBefore(max_result_tag, rows[row_ind].children[max_result_ind]);

        update_project_stats(project_url, total_sub_tag, latest_sub_tag,
                             latest_result_tag, max_result_tag);
    }
}

$(document).ready(function() {
    display_results();
});
