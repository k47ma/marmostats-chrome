/* Script for parsing test details */

const key = "97a591e399f591e64a5f4536d08d9574";

// update the number of total students and students who have submitted
function update_total_students(subject, catalog) {
    var result_table = document.getElementById('marmostats-result-table');
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

    const mean_perc = (mean / max * 100).toFixed(1);
    const median_perc = (median / max * 100).toFixed(1);
    const min_perc = (min / max * 100).toFixed(1);

    $("#marmostats-score-mean").html(mean + ' (' + mean_perc + '%)');
    $("#marmostats-score-median").html(median + ' (' + median_perc + '%)');
    $("#marmostats-score-min").html(min + ' (' + min_perc + '%)');
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
                backgroundColor: 'rgba(122, 235, 122, 0.5)',
                borderColor: 'rgba(100, 231, 100, 0.8)',
                hoverBackgroundColor: 'rgba(100, 231, 100, 0.65)',
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

    chart_canvas.parentNode.style.maxHeight = '350px';
    chart_canvas.parentNode.style.maxWidth = '700px';
    chart_canvas.parentElement.style.width = '80%';
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
    var score_index = -1;
    var total_public_tests = 0;
    var total_secret_tests = 0;

    for (var i = 0; i < total_cols; ++i) {
        const children_tags = titles[i].children;
        if (public_index == -1 && titles[i].textContent == "Public") {
            public_index = i;
            total_public_tests = Number(titles[i].getAttribute('colspan'));
        }

        if (total_secret_tests == 0 && titles[i].textContent == "Secret") {
            total_secret_tests = Number(titles[i].getAttribute('colspan'));
        }

        if (score_index == -1 && children_tags && children_tags[0].textContent == "Score") {
            score_index = i;
        }
    }

    // parse scores
    var test_scores = new Array();
    if (score_index != -1) {
        for (var i = 2; i < rows.length; ++i) {
            test_scores.push(parseInt(rows[i].children[score_index].innerText));
        }
    }
    if (test_scores) {
        update_student_scores(test_scores);
    }

    // parse test results
    var test_names = new Array();
    var test_fullnames = new Array();
    var test_results = new Array();

    for (i = 0; i < total_public_tests + total_secret_tests; ++i) {
        var testname;
        if (i < total_public_tests) {
            testname = 'P' + i.toString();
        } else {
            testname = 'S' + (i - total_public_tests).toString();
        }
        var test_title_container = rows[1].children[i];
        test_title_container.classList.add('marmostats-tooltip-container');
        const passed_ratio = parse_test_result(result_table, i, public_index + i);
        const test_title_tag = test_title_container.getElementsByTagName('a')[0];
        const test_fullname = test_title_tag.getAttribute('title');

        test_names.push(testname);
        test_fullnames.push(test_fullname);
        test_title_tag.removeAttribute('title');
        test_results.push(passed_ratio);

        add_tooltip(test_title_container, test_fullname);
    }

    draw_chart(test_names, test_results);
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
            text_tag.innerText = text_node.textContent.replace(/(\r\n|\n|\r)/gm, '');;
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
    var result_table = document.getElementById('marmostats-result-table');
    var submission_ind = -1;
    var rows = result_table.getElementsByTagName('tr');
    const titles = rows[0].getElementsByTagName('th');

    for (var i = 0; i < titles.length; ++i) {
        if (submission_ind == -1 && titles[i].textContent === 'submitted at') {
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
            const submission_text = submission_cell.textContent.replace(/(\r\n|\n|\r)|\bat\b/gm, '');
            const submission_time = Date.parse(submission_text + ' ' + year);
            
            if (submission_cell.getElementsByTagName('a')) {
                submission_cell.children[0].innerText = submission_text;
            }

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

// add links for previous and next project
function add_neighbor_links() {
    var overview_container = document.getElementById('marmostats-overview');
    var links_container = document.createElement('div');
    const table_width = document.getElementById('marmostats-result-table').clientWidth;
    links_container.style.width = table_width - 15;
    links_container.id = 'marmostats-neighbour-link-container';
    overview_container.appendChild(links_container);

    const overview_tag = document.getElementsByClassName('breadcrumb')[0];
    const regex = /[A-Z]+[0-9]+/g;
    var homepage_link = '';
    for (var link_tag of overview_tag.getElementsByTagName('a')) {
        const match_result = link_tag.innerText.match(regex);
        if (match_result) {
            homepage_link = link_tag.href;
        }
    }

    if (!homepage_link) return;

    $.get(homepage_link, function(response) {
        var doc = document.createElement('html');
        doc.innerHTML = response;
        const result_table = doc.getElementsByTagName('table')[0];
        const rows = result_table.getElementsByTagName('tr');

        var project_info = new Array();
        var project_ind = -1;
        for (var i = 1; i < rows.length; ++i) {
            if (rows[i].children[0].getAttribute('colspan')) {
                continue;
            }

            const project_name = rows[i].children[0].innerText;
            const overview_link = rows[i].children[1].getElementsByTagName('a')[0].href;
            const project_id = overview_link.split('=')[1];
            const test_detail_link = 'https://marmoset.student.cs.uwaterloo.ca/view/instructor/projectTestResults.jsp?projectPK='+project_id;
            project_info.push({name: project_name, test_detail: test_detail_link, overview: overview_link});
        }

        project_info.sort(function(a, b) { 
            if (a.name < b.name) {
                return -1;
            } else if (a.name > b.name) {
                return 1;
            } else {
                return 0;
            }
        });

        for (var i = 0; i < project_info.length; ++i) {
            if (window.location.href == project_info[i].test_detail ||
                window.location.href == project_info[i].overview) {
                project_ind = i;
            }
        }

        if (project_ind == -1) return;

        // add prev project link
        if (project_ind != 0) {
            var prev_project_tag = document.createElement('a');
            const prev_project_link = project_info[project_ind-1].test_detail;
            prev_project_tag.id = 'marmostats-prev-project';
            prev_project_tag.classList.add('marmostats-neighbor-link');
            prev_project_tag.innerText = '<< ' + project_info[project_ind-1].name;
            prev_project_tag.href = prev_project_link;
            links_container.appendChild(prev_project_tag);
        } else {
            var prev_project_tag = document.createElement('p');
            prev_project_tag.id = 'marmostats-prev-project';
            prev_project_tag.classList.add('marmostats-neighbor-link');
            prev_project_tag.innerText = "No previous project";
            links_container.appendChild(prev_project_tag);
        }

        // add next project link
        if (project_ind != project_info.length - 1) {
            var next_project_tag = document.createElement('a');
            const next_project_link = project_info[project_ind+1].test_detail;
            next_project_tag.id = 'marmostats-next-project';
            next_project_tag.classList.add('marmostats-neighbor-link');
            next_project_tag.innerText = project_info[project_ind+1].name + ' >>';
            next_project_tag.href = next_project_link;
            links_container.appendChild(next_project_tag);
        } else {
            var next_project_tag = document.createElement('p');
            next_project_tag.id = 'marmostats-next-project';
            next_project_tag.classList.add('marmostats-neighbor-link');
            next_project_tag.innerText = "No next project";
            links_container.appendChild(next_project_tag);
        }
    });
}

// display stats for all test cases
function display_stats() {
    // setup html tags for showing results
    var result_table = document.getElementsByTagName('table')[0];
    result_table.id = 'marmostats-result-table'
    result_table.removeAttribute('title');
    var overview_tag = document.createElement('div');
    overview_tag.id = 'marmostats-overview';
    overview_tag.innerHTML = '<div id="marmostats-test-summary"></div><div id="marmostats-chart"></div>';
    result_table.parentElement.prepend(overview_tag);

    var list_tag = document.createElement('ul');
    list_tag.className = "marmostats-list";
    list_tag.innerHTML = '<li>Total Students: <b id="marmostats-total-students"></b></li>\
                          <li>Total Submitted: <b id="marmostats-total-submissions"></b></li>\
                          <li>Submission Rate: <b id="marmostats-submission-rate"></b></li>\
                          <li>Score Summary: &nbsp;&nbsp; \
                                             Mean: <b class="marmostats-score" id="marmostats-score-mean"></b> \
                                             Median: <b class="marmostats-score" id="marmostats-score-median"></b> \
                                             Max: <b class="marmostats-score" id="marmostats-score-max"></b> \
                                             Min: <b class="marmostats-score" id="marmostats-score-min"></b></li>';
    document.querySelector('div[id="marmostats-test-summary"]').appendChild(list_tag);

    if (result_table != undefined) {
        parse_result_table(result_table);
    }

    display_overview();
    set_page_styles();
    add_neighbor_links();
}

$(document).ready(function() {
    display_stats();
})
