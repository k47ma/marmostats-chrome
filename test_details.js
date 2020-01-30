/* Script for parsing test details. */

const key = "97a591e399f591e64a5f4536d08d9574";

// update the number of total students and students who have submitted
function update_total_students(subject, catalog) {
    var result_table = document.querySelector('[title="projectTestResults"]');
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
                $("#marmostats-total-students").html(total_students);
                update_submission_rate(total_students, total_submissions);
            });
    });

    for (row of result_table.getElementsByTagName('tr')) {
        if ((row.getAttribute('class') == 'r0' || row.getAttribute('class') == 'r1')) {
                ++total_submissions;
        }
    }
    $("#marmostats-total-submissions").html(total_submissions);
    update_submission_rate(total_students, total_submissions);
}

// try to update submission rate field
function update_submission_rate(total_students, total_submissions) {
    if (total_students > 0 && total_submissions > 0) {
        const submission_rate = (total_submissions / total_students * 100).toFixed(2);
        $("#marmostats-submission-rate").html(submission_rate + '%');
    }
}

// update the summary of student scores
function update_student_scores(test_scores) {
    test_scores.sort((a, b) => a - b);
    const sum = test_scores.reduce((a, b) => a + b, 0);
    const mean = (sum / test_scores.length).toFixed(1);
    const max = test_scores[test_scores.length - 1];
    const min = test_scores[0];

    var median = 0;
    if (test_scores.length % 2 == 0) {
        median = (test_scores[Math.floor(test_scores.length / 2)] +
                  test_scores[Math.floor(test_scores.length / 2) + 1]) / 2;
    } else {
        median = test_scores[Math.floor(test_scores.length / 2)];
    }

    $("#marmostats-score-mean").html(mean);
    $("#marmostats-score-median").html(median);
    $("#marmostats-score-min").html(min);
    $("#marmostats-score-max").html(max);
}

// draw a column chart about the test results under overview
function draw_chart(test_names, test_results) {
    var chart_canvas = document.createElement('canvas');
    document.querySelector('div[id="marmostats-chart"]').appendChild(chart_canvas);

    var ctx = chart_canvas.getContext('2d');
    var chart = new Chart(ctx, {
        type: 'bar',

        data: {
            labels: test_names,
            datasets: [{
                label: 'Pass Rate',
                data: test_results,
                backgroundColor: 'rgba(122, 235, 122, 0.85)',
                borderColor: 'rgba(100, 231, 100, 1.0)',
                hoverBackgroundColor: 'rgba(100, 231, 100, 1.0)',
                hoverBorderColor: 'rgba(100, 231, 100, 1.0)',
                borderWidth: 1,
                hoverBorderWidth: 2,
                barPercentage: 0.8
            }]
        },

        options: {
            scales: {
                xAxes: [{
                    scaleLabel: {
                        display: true,
                        labelString: 'Test Case'
                    }
                }],
                yAxes: [{
                    scaleLabel: {
                        display: true,
                        labelString: '%'
                    },
                    ticks: {
                        suggestedMin: 0,
                        suggestedMax: 100
                    }
                }]
            }
        }
    });

    chart_canvas.parentNode.style.height = '350px';
    chart_canvas.parentNode.style.width = '700px';
}

// parse the result for a single test case and add the result to title
//   test_ind starts from 0 for public tests, followed by secret tests
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

    const passed_ratio = total_passed / total_submissions;
    var summary_tag = document.createElement('p');
    summary_tag.className = 'marmostats-inline'
    summary_tag.innerText = (passed_ratio * 100).toFixed(1) + '%';
    title_tag.appendChild(summary_tag);

    return (passed_ratio * 100).toFixed(1);
}

// parse the test result table and add stats
function parse_result_table(result_table) {
    const total_cols = result_table.getElementsByTagName('tr')[0].children.length;
    const rows = result_table.getElementsByTagName('tr');
    const titles = rows[0].getElementsByTagName('th');

    var public_index = -1;
    var secret_index = -1;
    var score_index = -1;
    var total_public_tests = 0;
    var total_secret_tests = 0;

    for (i = 0; i < total_cols; ++i) {
        const children_tags = titles[i].children;
        if (public_index == -1 && titles[i].textContent == "Public") {
            public_index = i;
            total_public_tests = Number(titles[i].getAttribute('colspan'));
        }

        if (secret_index == -1 && titles[i].textContent == "Secret") {
            secret_index = i;
            total_secret_tests = Number(titles[i].getAttribute('colspan'));
        }

        if (score_index == -1 && children_tags && children_tags[0].textContent == "Score") {
            score_index = i;
        }
    }

    // parse scores
    var test_scores = new Array();
    if (score_index != -1) {
        for (i = 2; i < rows.length; ++i) {
            test_scores.push(parseInt(rows[i].children[score_index].innerText));
        }
    }
    if (test_scores) {
        update_student_scores(test_scores);
    }

    // parse test results
    var test_names = new Array();
    var test_results = new Array();

    for (i = 0; i < total_public_tests; ++i) {
        const passed_ratio = parse_test_result(result_table, i, public_index + i);
        test_names.push('P' + i.toString());
        test_results.push(passed_ratio);
    }

    for (i = 0; i < total_secret_tests; ++i) {
        const passed_ratio = parse_test_result(result_table, i + total_public_tests,
                                               public_index + total_public_tests + i);
        test_names.push('S' + i.toString());
        test_results.push(passed_ratio);
    }

    draw_chart(test_names, test_results);
}

// display an overview above the result table
function display_overview() {
    const overview_tag = document.getElementsByClassName('breadcrumb')[0];
    const regex = /[A-Z]+[0-9]+/g;
    var subject = "";
    var catalog = "";
    for (var link_tag of overview_tag.getElementsByTagName('a')) {
        const match_result = link_tag.innerText.match(regex);
        if (match_result) {
            subject = link_tag.innerText.match(/[A-Z]+/g)[0];
            catalog = link_tag.innerText.match(/[0-9]+/g)[0];
        }
    }

    if (subject && catalog) {
        update_total_students(subject, catalog);
    }
}

// display stats for all test cases
function display_stats() {
    // setup html tags for showing results
    var result_table = document.querySelector('[title="projectTestResults"]');
    var overview_tag = document.createElement('div');
    overview_tag.id = 'marmostats-overview';
    overview_tag.innerHTML = '<div id="marmostats-test-summary"></div><div id="marmostats-chart"></div>';
    result_table.parentElement.prepend(overview_tag);

    var list_tag = document.createElement('ul');
    list_tag.className = "marmostats-list";
    list_tag.innerHTML = '<li>Total Students: <b id="marmostats-total-students"></b></li>\
                          <li>Total Submitted: <b id="marmostats-total-submissions"></b></li>\
                          <li>Submission Rate: <b id="marmostats-submission-rate"></b></li>\
                          <li>Score Summary: Mean: <b class="marmostats-score" id="marmostats-score-mean"></b> \
                                             Median: <b class="marmostats-score" id="marmostats-score-median"></b> \
                                             Max: <b class="marmostats-score" id="marmostats-score-max"></b> \
                                             Min: <b class="marmostats-score" id="marmostats-score-min"></b></li>';
    document.querySelector('div[id="marmostats-test-summary"]').appendChild(list_tag);

    if (result_table != undefined) {
        parse_result_table(result_table);
    }

    display_overview();
}

$(document).ready(function() {
    display_stats();
})
