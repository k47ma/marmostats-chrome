/* Script for homepage information */

const key = "97a591e399f591e64a5f4536d08d9574";

var projects = new Object();
var projects_displayed = new Array();

// update the number of total students and students who have submitted
function update_total_students(subject, catalog) {
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
                add_test_details(total_students);
            });
    });
}

// update the submission rate and correctness rate for each project
function update_project_stats(project_name, rate_tag, score_tag, total_students) {
    const project_id = projects[project_name]['id'];
    const project_url = "https://marmoset.student.cs.uwaterloo.ca/view/instructor/projectTestResults.jsp?projectPK="+project_id;

    $.get(project_url, function(response) {
        var doc = document.createElement('html');
        doc.innerHTML = response;
        const result_table = doc.getElementsByTagName('table')[0];
        const rows = result_table.getElementsByTagName('tr');
        const total_cols = result_table.getElementsByTagName('tr')[0].children.length;
        const titles = rows[0].getElementsByTagName('th');
        var score_index = -1;

        for (i = 0; i < total_cols; ++i) {
            const children_tags = titles[i].children;
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

        test_scores.sort((a, b) => a - b);
        const sum = test_scores.reduce((a, b) => a + b, 0);
        const mean = (sum / test_scores.length).toFixed(1);
        const max = test_scores[test_scores.length - 1];
        const total_submissions = test_scores.length;

        var submission_rate = (total_submissions / total_students * 100).toFixed(1);
        var avg_score = (mean / max * 100).toFixed(1);
        if (total_submissions == 0) {
            avg_score = '-';
        }
        rate_tag.innerHTML = '<b>' + submission_rate + '%</b>' + '/' + '<b>' + avg_score + '%</b>';
        if (max == undefined) {
            score_tag.innerText = '-';
        } else {
            score_tag.innerText = max;
        }

        projects[project_name]['submission'] = submission_rate;
        projects[project_name]['correctness'] = (avg_score == '-') ? 0 : avg_score;

        draw_chart();
    });
}

// try to draw a column chart about the test results under overview
function draw_chart() {
    const total_projects = Object.keys(projects).length;
    var finished_projects = 0;
    for (var project_name in projects) {
        if (projects[project_name]['submission'] != -1) {
            ++finished_projects;
        }
    }

    // draw progress bar if not all projects are done
    var progress_container = document.getElementById('marmostats-progress');
    var bar_tag = document.getElementById('marmostats-progress-bar');
    var perc_tag = document.getElementById('marmostats-progress-perc');
    const percent = (finished_projects / total_projects * 100).toFixed(1) + '%';

    bar_tag.style.width = percent;
    perc_tag.innerText = percent;

    if (finished_projects < total_projects) {
        progress_container.style.visibility = 'visible';
        return;
    }

    progress_container.style.visibility = 'hidden';
    progress_container.style.height = 0;
    progress_container.style.margin = 0;

    var submissions = new Array();
    var correctness = new Array();
    for (const project_name of projects_displayed.sort()) {
        submissions.push(projects[project_name]['submission']);
        correctness.push(projects[project_name]['correctness']);
    }

    var chart_canvas = document.createElement('canvas');
    document.querySelector('div[id="marmostats-chart"]').appendChild(chart_canvas);

    var ctx = chart_canvas.getContext('2d');
    var chart = new Chart(ctx, {
        type: 'line',

        data: {
            labels: projects_displayed,
            datasets: [{
                label: 'Submission Rate',
                data: submissions,
                backgroundColor: 'rgba(30, 144, 255, 0.8)',
                borderColor: 'rgba(30, 144, 255, 1.0)',
                borderWidth: 2,
                pointRadius: 3,
                pointHoverBorderWidth: 5,
                fill: false
            },
            {
                label: 'Avg. Score',
                data: correctness,
                backgroundColor: 'rgba(100, 231, 100, 0.8)',
                borderColor: 'rgba(100, 231, 100, 1.0)',
                borderWidth: 2,
                pointRadius: 3,
                pointHoverRadius: 5,
                fill: false
            }]
        },

        options: {
            scales: {
                xAxes: [{
                    scaleLabel: {
                        display: true,
                        labelString: 'Project'
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
            },
            responsive: true,
            responsiveAnimationDuration: 100,
            maintainAspectRatio: true
        }
    });

    const overview_table = document.getElementsByClassName('marmostats-table')[0];
    const table_width = overview_table.clientWidth;
    const new_width = Math.floor(table_width * 0.8);
    const new_height = Math.floor(table_width * 0.4);
    chart_canvas.parentNode.style.maxWidth = new_width;
    chart_canvas.parentNode.style.maxHeight = new_height;
    chart_canvas.parentElement.style.width = '90%';

    add_selectors(chart);
}

// update an existing chart
function update_chart(chart) {
    projects_displayed.sort();
    chart.data.labels = projects_displayed;

    var submissions = new Array();
    var correctness = new Array();
    for (const project_name of projects_displayed) {
        submissions.push(projects[project_name]['submission']);
        correctness.push(projects[project_name]['correctness']);
    }

    chart.data.datasets[0].data = submissions;
    chart.data.datasets[1].data = correctness;
    chart.update();
}

// add selectors for each assignment
function add_selectors(chart) {
    const assign_regex = /^\D+\d*/g;
    var assignments = new Array();
    for (const project_name of Object.keys(projects)) {
        const assign_match = project_name.match(assign_regex);
        if (assign_match) {
            const assign_name = assign_match[0];
            if (!assignments.includes(assign_name)) {
                assignments.push(assign_name);
            }
        }
    }

    const selector_table = document.getElementById('marmostats-selector-table');
    var table_title_row = document.createElement('th');
    var table_title = document.createElement('td');
    table_title.setAttribute('colspan', assignments.length);
    table_title.innerText = "Displayed Assignments";
    table_title_row.appendChild(table_title);
    selector_table.appendChild(table_title_row);

    var selector_container = document.createElement('tr');
    selector_table.appendChild(selector_container);
    for (const assign_name of assignments.sort()) {
        var selector = document.createElement('td');
        selector.id = 'marmostats-selector-' + assign_name;
        selector.classList.add('marmostats-selector', 'selected');
        selector.innerText = assign_name;
        selector.onmouseenter = function() {this.classList.add('mouseover')};
        selector.onmouseout = function() {this.classList.remove('mouseover')};
        selector.onclick = function() {
            if (this.classList.contains('selected')) {
                this.classList.remove('selected');
                for (var i = projects_displayed.length - 1; i >= 0; --i) {
                    if (projects_displayed[i].startsWith(assign_name)) {
                        projects_displayed.splice(i, 1);
                    }
                }
            } else {
                this.classList.add('selected');
                for (const project_name of Object.keys(projects)) {
                    if (project_name.startsWith(assign_name) &&
                        !projects_displayed.includes(projects_displayed)) {
                        projects_displayed.push(project_name);
                    }
                }
            }
            update_chart(chart);
        };
        selector_container.appendChild(selector);
    }
}

// display an overview above the overview table
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

// add test details for each project in the table
function add_test_details(total_students) {
    var project_table = document.getElementsByClassName('marmostats-table')[0];
    var rows = project_table.getElementsByTagName('tr');

    var title_rate_tag = document.createElement('th');
    title_rate_tag.innerHTML = "Submission<br />/Avg. Score";
    rows[0].insertBefore(title_rate_tag, rows[0].children[1]);

    var title_score_tag = document.createElement('th');
    title_score_tag.innerHTML = "Max<br />Score";
    rows[0].insertBefore(title_score_tag, rows[0].children[2]);

    for (var i = 1; i < rows.length; ++i) {
        if (rows[i].children[0].hasAttribute('colspan')) {
            const total_cols = rows[i].children[0].getAttribute('colspan');
            rows[i].children[0].setAttribute('colspan', total_cols + 2);
        } else {
            const project_link = rows[i].getElementsByTagName('a')[0];
            const split_list = project_link.getAttribute('href').split('=');
            const project_id = split_list[split_list.length - 1];
            const project_name = rows[i].children[0].innerText;

            var rate_tag = document.createElement('td');
            var score_tag = document.createElement('td');
            rows[i].insertBefore(rate_tag, rows[i].children[1]);
            rows[i].insertBefore(score_tag, rows[i].children[2]);

            var image_tag_1 = document.createElement('img');
            image_tag_1.src = chrome.extension.getURL('images/loading.gif');
            image_tag_1.style.height = '18px';
            var image_tag_2 = image_tag_1.cloneNode(true);
            rate_tag.appendChild(image_tag_1);
            score_tag.appendChild(image_tag_2);

            projects[project_name] = {id: project_id, submission: -1, correctness: -1};
            projects_displayed.push(project_name);
            update_project_stats(project_name, rate_tag, score_tag, total_students);
        }
    }
}

// display stats for overview page
function display_stats() {
    // setup html tags for showing results
    var project_table = document.getElementsByTagName('table')[0];
    project_table.classList.add('marmostats-table');

    var overview_tag = document.createElement('div');
    overview_tag.id = 'marmostats-overview';
    overview_tag.innerHTML = '<div id="marmostats-test-summary"> \
                                <p>Total Students: <b id="marmostats-total-students"></b></p> \
                              </div> \
                              <div id="marmostats-selector-container"> \
                                <table id="marmostats-selector-table"></table> \
                              </div> \
                              <div id="marmostats-progress"> \
                                <p id="marmostats-progress-text">Loading project results...</p>\
                                <div id="marmostats-progress-bar-background"><div id="marmostats-progress-bar"></div></div> \
                                <p id="marmostats-progress-perc"></p> \
                              </div> \
                              <div id="marmostats-chart"></div>';
    project_table.parentElement.prepend(overview_tag);

    display_overview();
}

$(document).ready(function() {
    display_stats();
})
