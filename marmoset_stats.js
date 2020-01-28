/* Script for parsing test details. */

const key = "97a591e399f591e64a5f4536d08d9574"

// update the number of total students and students who have submitted
function update_total_students(subject, catalog, result_table) {
    const termlist_url = "https://api.uwaterloo.ca/v2/terms/list.json?key="+key;
    var total_students = 0;
    var total_submissions = 0;

    $.get(termlist_url, function(termlist) {
            const term = termlist.data.current_term.toString();
            const enroll_url = "https://api.uwaterloo.ca/v2/terms/"+term+"/"+subject+"/"+catalog+"/schedule.json?key="+key;
            $.get(enroll_url, function(enrollment) {
                for (const section_info of enrollment.data) {
                    if (section_info.section.startsWith('LEC')) {
                        total_students += section_info.enrollment_total;
                    }
                }
                $("#marmoset_stats_total_students").html(total_students);
                update_submission_rate(total_students, total_submissions);
            });
    });

    for (row of result_table.getElementsByTagName('tr')) {
        if ((row.getAttribute('class') == 'r0' || row.getAttribute('class') == 'r1')
            && !row.children[1].innerText.startsWith('*')) {
                ++total_submissions;
        }
    }
    $("#marmoset_stats_total_submissions").html(total_submissions);
    update_submission_rate(total_students, total_submissions);
}

// try to update submission rate field
function update_submission_rate(total_students, total_submissions) {
    if (total_students > 0 && total_submissions > 0) {
        const submission_rate = (total_submissions / total_students * 100).toFixed(2);
        $("#marmoset_stats_submission_rate").html(submission_rate + '%');
    }
}

// Parse the result for a single test case and add the result to title
// test_ind starts from 0 for public tests, followed by secret tests
function parse_test_result(table, test_ind, col_ind) {
    var test_rows = table.getElementsByTagName('tr');
    var title_tag = test_rows[1].getElementsByTagName('th')[test_ind];
    var total_passed = 0;
    const total_submissions = test_rows.length - 2;

    for (row_ind = 2; row_ind < test_rows.length; ++row_ind) {
        const test_result = test_rows[row_ind].children[col_ind];
        if (test_result != undefined && test_result.getAttribute('class') == 'passed') {
            ++total_passed;
        }
    }

    var summary_tag = document.createElement('p');
    summary_tag.innerText = (total_passed / total_submissions * 100).toFixed(2) + '%';
    summary_tag.style.fontWeight = 'normal';
    summary_tag.style.fontSize = '13px';
    summary_tag.style.marginBlockStart = '0px';
    summary_tag.style.marginBlockEnd = '0px';
    title_tag.appendChild(summary_tag);
}

// parse the test result table and add stats
function parse_result_table(result_table) {
    const total_cols = result_table.getElementsByTagName('tr')[0].children.length;
    const rows = result_table.getElementsByTagName('tr');

    var titles = rows[0].getElementsByTagName('th');
    var public_index = -1;
    var secret_index = -1;
    var total_public_tests = 0;
    var total_secret_tests = 0;

    for (i = 0; i < total_cols; ++i) {
        if (public_index == -1 && titles[i].textContent == "Public") {
            public_index = i;
            total_public_tests = Number(titles[i].getAttribute('colspan'));
        }
        
        if (secret_index == -1 && titles[i].textContent == "Secret") {
            secret_index = i;
            total_secret_tests = Number(titles[i].getAttribute('colspan'));
        }
    }

    for (i = 0; i < total_public_tests; ++i) {
        parse_test_result(result_table, i, public_index + i);
    }

    for (i = 0; i < total_secret_tests; ++i) {
        parse_test_result(result_table, i + total_public_tests,
                          public_index + total_public_tests + i);
    }
}

// display an overview above the result table
function display_overview() {
    const overview_tag = document.getElementsByClassName('breadcrumb')[0];
    const regex = /[A-Z]+[0-9]+/g;
    var subject = "";
    var catalog = "";
    for (link_tag of overview_tag.getElementsByTagName('a')) {
        const match_result = link_tag.innerText.match(regex);
        if (match_result) {
            subject = link_tag.innerText.match(/[A-Z]+/g)[0];
            catalog = link_tag.innerText.match(/[0-9]+/g)[0];
        }
    }

    if (subject && catalog) {
        var students_tag = document.createElement('div');
        students_tag.innerHTML = '<ul>\
        <li>Total Students: <b id="marmoset_stats_total_students"></b></li>\
        <li>Total Submitted: <b id="marmoset_stats_total_submissions"></b></li>\
        <li>Submission Rate: <b id="marmoset_stats_submission_rate"></b></li>\
        </ul>'

        const result_table = document.querySelector('[title="projectTestResults"]');
        result_table.parentElement.prepend(students_tag);

        update_total_students(subject, catalog, result_table);
    }
}

// display stats for all test cases
function display_stats() {
    var result_table = document.querySelector('[title="projectTestResults"]');

    if (result_table != undefined) {
        parse_result_table(result_table);
    }

    display_overview();
}

$(document).ready(function() {
    display_stats();
})
