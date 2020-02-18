/* Script for homepage information */

const key = "97a591e399f591e64a5f4536d08d9574";
const current_url = window.location.href;

var assign_chart = null;
var chart_config = null;
var load_finished = false;
var interval = null;
var timer_bar_timeout = null;

var projects = new Object();
var projects_displayed = new Array();
var display_all = true;


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

        if (!load_finished) {
            draw_chart();
        } else {
            update_chart();
        }
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

    progress_container.style.visibility = 'collapse';
    progress_container.style.height = 0;
    progress_container.style.margin = 0;

    var submissions = new Array();
    var correctness = new Array();
    for (const project_name of projects_displayed.sort()) {
        submissions.push(projects[project_name]['submission']);
        correctness.push(projects[project_name]['correctness']);
    }

    var chart_canvas = document.createElement('canvas');
    chart_canvas.id = 'marmostats-chart-canvas';
    document.getElementById('marmostats-chart').appendChild(chart_canvas);

    var ctx = chart_canvas.getContext('2d');
    chart_config = {
        type: 'bar',
        data: {
            labels: projects_displayed,
            datasets: [{
                label: 'Submission Rate',
                data: submissions,
                backgroundColor: 'rgba(30, 144, 255, 0.4)',
                borderColor: 'rgba(30, 144, 255, 0.8)',
                hoverBackgroundColor: 'rgba(30, 144, 255, 0.5)',
                hoverBorderColor: 'rgba(30, 144, 255, 1.0)',
                borderWidth: 2,
                hoverBorderWidth: 3,
                pointRadius: 3,
                pointHoverBorderWidth: 5,
                barPercentage: 0.7,
                fill: false
            },
            {
                label: 'Avg. Score',
                data: correctness,
                backgroundColor: 'rgba(122, 235, 122, 0.4)',
                borderColor: 'rgba(100, 231, 100, 0.8)',
                hoverBackgroundColor: 'rgba(100, 231, 100, 0.5)',
                hoverBorderColor: 'rgba(100, 231, 100, 1.0)',
                borderWidth: 2,
                hoverBorderWidth: 3,
                pointRadius: 3,
                pointHoverRadius: 5,
                barPercentage: 0.7,
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
    }
    assign_chart = new Chart(ctx, chart_config);

    set_chart_size(chart_canvas);
    add_selectors();
    add_buttons();

    load_finished = true;
}

// set up chart size according to overview table size
function set_chart_size(chart_canvas) {
    const overview_table = document.getElementsByClassName('marmostats-overview-table')[0];
    const table_width = overview_table.clientWidth;
    const new_width = Math.floor(table_width * 0.8);
    const new_height = Math.floor(table_width * 0.4);
    chart_canvas.parentNode.style.maxWidth = new_width;
    chart_canvas.parentNode.style.maxHeight = new_height;
    chart_canvas.parentElement.style.width = '90%';
}

// update an existing chart
function update_chart() {
    for (var project_name in projects) {
        if (projects[project_name]['submission'] == -1) {
            return;
        }
    }

    projects_displayed.sort();
    assign_chart.data.labels = projects_displayed;

    var submissions = new Array();
    var correctness = new Array();
    for (const project_name of projects_displayed) {
        submissions.push(projects[project_name]['submission']);
        correctness.push(projects[project_name]['correctness']);
    }

    assign_chart.data.datasets[0].data = submissions;
    assign_chart.data.datasets[1].data = correctness;
    assign_chart.update();

    var loading_icon = document.getElementById('marmostats-refresh-loading');
    if (loading_icon) {
        loading_icon.style.visibility = 'hidden';
    }
}

// add selectors for each assignment
function add_selectors() {
    const assign_regex = /^\D+\d*/g;
    var assignments = new Array();
    var assigns_displayed = new Array();
    for (const project_name of Object.keys(projects)) {
        const assign_match = project_name.match(assign_regex);
        if (assign_match) {
            const assign_name = assign_match[0];
            if (!assignments.includes(assign_name)) {
                assignments.push(assign_name);
            }
        }
    }

    for (const project_name of projects_displayed) {
        const assign_match = project_name.match(assign_regex);
        if (assign_match) {
            const assign_name = assign_match[0];
            if (!assigns_displayed.includes(assign_name)) {
                assigns_displayed.push(assign_name);
            }
        }
    }

    const selector_table = document.getElementById('marmostats-selector-table');
    var table_title_row = document.createElement('tr');
    var table_title = document.createElement('th');
    table_title.setAttribute('colspan', assignments.length + 1);
    table_title.innerText = "Displayed Assignments";
    table_title_row.appendChild(table_title);
    selector_table.appendChild(table_title_row);
    selector_table.style.visibility = 'visible';

    var selector_container = document.createElement('tr');
    selector_table.appendChild(selector_container);
    var all_selector = document.createElement('td');
    var selectors = new Array();
    for (const assign_name of assignments.sort()) {
        var selector = document.createElement('td');
        selector.id = 'marmostats-selector-' + assign_name;
        selector.innerText = assign_name;
        selector.classList.add('marmostats-selector');
        if (assigns_displayed.includes(assign_name)) {
            selector.classList.add('selected');
        }
        selector.onclick = function() {
            if (this.classList.contains('selected')) {
                this.classList.remove('selected');
                all_selector.classList.remove('selected');
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

                var all_selected = true;
                for (const check_selector of selectors) {
                    if (!check_selector.classList.contains('selected')) {
                        all_selected = false;
                        break;
                    }
                }

                if (all_selected) {
                    all_selector.classList.add('selected');
                }
            }
            chrome.storage.local.set({"projects_displayed": projects_displayed}, function() {});
            update_chart();
        };
        selector_container.appendChild(selector);
        selectors.push(selector);
    }

    all_selector.id = 'marmostats-selectall';
    all_selector.innerText = 'Toggle All';
    all_selector.classList.add('marmostats-selector');
    if (assigns_displayed.length) {
        all_selector.classList.add('selected');
    }
    all_selector.onclick = function() {
        if (this.classList.contains('selected')) {
            for (var selector of selectors) {
                if (selector.classList.contains('selected')) {
                    selector.click();
                }
            }
        } else {
            for (var selector of selectors) {
                if (!selector.classList.contains('selected')) {
                    selector.click();
                }
            }
        }
        update_chart();
    };
    selector_container.appendChild(all_selector);
}

// add refresh button after selector table
function add_buttons() {
    var container = document.getElementById('marmostats-setting-container');

    var autorefresh_container = document.createElement('div');
    autorefresh_container.id = 'marmostats-autorefresh-container';
    autorefresh_container.innerHTML = '<p>Auto-refresh: </p>';
    container.appendChild(autorefresh_container);

    var autorefresh_button = document.createElement('span');
    autorefresh_button.id = 'marmostats-autorefresh-button';
    autorefresh_button.innerHTML = '<input type="checkbox" id="marmostats-toggle-button" class="cbx hidden"/> \
                                    <label for="marmostats-toggle-button" class="lbl"></label><br /> \
                                    <p>Interval: </p> \
                                    <input id="marmostats-autorefresh-input" type="text" name="autorefresh-input" value="1"> \
                                    <p>min</p> \
                                    <div id="marmostats-autorefresh-progress"></div>';
    autorefresh_container.appendChild(autorefresh_button);

    var checkbox = document.getElementById('marmostats-toggle-button');
    autorefresh_button.onchange = function(e) {
        if (interval) {
            clearInterval(interval);
            interval = null;
        }

        if (timer_bar_timeout) {
            clearTimeout(timer_bar_timeout);
            timer_bar_timeout = null;
        }

        var timer_bar = document.getElementById('marmostats-autorefresh-progress');
        if (checkbox.checked) {
            var input_tag = document.getElementById('marmostats-autorefresh-input');
            const autorefresh_time = parseFloat(input_tag.value);
            if (isNaN(autorefresh_time) || autorefresh_time < 0.1) {
                input_tag.style.backgroundColor = 'rgba(255, 69, 0, 0.25)';
                checkbox.checked = false;
                if (autorefresh_time) {
                    clearInterval(autorefresh_time);
                }
                return;
            } else {
                input_tag.style.backgroundColor = 'rgb(255, 255, 255)';
            }

            timer_bar.style.visibility = 'visible';
            start_timer_bar(timer_bar, 0, autorefresh_time * 60);

            interval = setInterval(function() {
                refresh_page(true);
                timer_bar.style.visibility = 'visible';
                start_timer_bar(timer_bar, 0, autorefresh_time * 60);
            }, autorefresh_time * 60 * 1000);
        } else {
            timer_bar.style.width = 0;
            timer_bar.style.visibility = 'hidden';
        }
    };


    var input_box = document.getElementById('marmostats-autorefresh-input');
    input_box.onkeydown = function(e) {
        if (e.key == 'Enter') {
            checkbox.checked = true;
        }
    }

    var refresh_button = document.createElement('button');
    refresh_button.id = 'marmostats-refresh-button';
    refresh_button.innerHTML = '<span>Refresh</span>';
    container.appendChild(refresh_button);

    var loading_tag = document.createElement('img');
    loading_tag.id = 'marmostats-refresh-loading';
    loading_tag.src = chrome.extension.getURL('images/loading.gif');
    container.appendChild(loading_tag);

    var image_tag = document.createElement('img');
    image_tag.src = chrome.extension.getURL('images/refresh.png');
    refresh_button.prepend(image_tag);
    refresh_button.onclick = function() {
        loading_tag.style.visibility = 'visible';
        refresh_page(false);
    };
}

// update progress bar, total_time is in seconds
function start_timer_bar(timer_bar, perc, total_time) {
    if (perc > 100) {
        timer_bar.style.width = '100%';
        return;
    }

    const update_rate = 0.2;
    const unit_perc = update_rate / total_time * 100;
    timer_bar.style.width = perc + '%';
    timer_bar_timeout = setTimeout(function() {
        start_timer_bar(timer_bar, perc + unit_perc, total_time);
    }, update_rate * 1000);
}

// refresh test data
function refresh_page(autorefresh) {
    if (autorefresh) {
        clearTimeout(timer_bar_timeout);
        var timer_bar = document.getElementById('marmostats-autorefresh-progress');
        timer_bar.style.visibility = 'hidden';
    }

    $.get(current_url, function(response) {
        var doc = document.createElement('html');
        doc.innerHTML = response;

        var result_table = doc.getElementsByTagName('table')[0];
        result_table.classList.add('marmostats-overview-table');

        var current_table = document.getElementsByClassName('marmostats-overview-table')[0];
        current_table.parentNode.replaceChild(result_table, current_table);

        display_overview();
    });
}

// update the number of total students and students who have submitted
function update_total_students(subject, catalog) {
    const termlist_url = "https://api.uwaterloo.ca/v2/terms/list.json?key="+key;

    $.get(termlist_url, function(termlist) {
            const term = termlist.data.current_term.toString();
            const enroll_url = "https://api.uwaterloo.ca/v2/terms/"+term+"/"+subject+"/"+catalog+"/schedule.json?key="+key;
            $.get(enroll_url, function(enrollment) {
                var total_students = 0;
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
    var project_table = document.getElementsByClassName('marmostats-overview-table')[0];
    var rows = project_table.getElementsByTagName('tr');

    var title_rate_tag = document.createElement('th');
    title_rate_tag.innerHTML = "Submission<br />/Avg. Score";
    rows[0].insertBefore(title_rate_tag, rows[0].children[1]);

    var title_score_tag = document.createElement('th');
    title_score_tag.innerHTML = "Max<br />Score";
    rows[0].insertBefore(title_score_tag, rows[0].children[2]);

    var title_detail_tag = document.createElement('th');
    title_detail_tag.innerHTML = "Test<br />Details";
    rows[0].insertBefore(title_detail_tag, rows[0].children[3]);

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
            var detail_tag = document.createElement('td');
            rows[i].insertBefore(rate_tag, rows[i].children[1]);
            rows[i].insertBefore(score_tag, rows[i].children[2]);
            rows[i].insertBefore(detail_tag, rows[i].children[3]);

            var image_tag_1 = document.createElement('img');
            image_tag_1.src = chrome.extension.getURL('images/loading.gif');
            image_tag_1.style.width = '18px';
            image_tag_1.style.height = '18px';
            var image_tag_2 = image_tag_1.cloneNode(true);

            const detail_link = 'https://marmoset.student.cs.uwaterloo.ca/view/instructor/projectTestResults.jsp?projectPK='+project_id;
            var detail_link_tag = document.createElement('a');
            detail_link_tag.href = detail_link;
            var detail_image = document.createElement('img');
            detail_image.src = chrome.extension.getURL('images/bar-chart.png');
            detail_image.title = 'View Test Details for ' + project_name;
            detail_image.style.width = '18px';
            detail_image.style.height = '18px';
            detail_link_tag.appendChild(detail_image);

            rate_tag.appendChild(image_tag_1);
            score_tag.appendChild(image_tag_2);
            detail_tag.appendChild(detail_link_tag);

            projects[project_name] = {id: project_id, submission: -1, correctness: -1};
            if (!load_finished && display_all && !projects_displayed.includes(project_name)) {
                projects_displayed.push(project_name);
            }
            update_project_stats(project_name, rate_tag, score_tag, total_students);
        }
    }

    update_table_style(project_table);
}

// update_table_style sets the style of table cells according to their contents
function update_table_style(table) {
    var visible_ind = -1;
    var due_ind = -1;
    var test_ind = -1;
    var retest_ind = -1;
    var setup_ind = -1;
    var overview_ind = -1;

    var rows = table.getElementsByTagName('tr');
    const titles = rows[0].getElementsByTagName('th');

    for (var i = 0; i < titles.length; ++i) {
        if (visible_ind == -1 && titles[i].innerText == 'Visible') {
            visible_ind = i;
        } else if (due_ind == -1 && titles[i].innerText == 'Due') {
            due_ind = i;
        } else if (test_ind == -1 && titles[i].innerText == '# to test') {
            test_ind = i;
        } else if (retest_ind == -1 && titles[i].innerText == '# retesting') {
            retest_ind = i;
        } else if (setup_ind == -1 && titles[i].textContent.indexOf('setup') != -1) {
            setup_ind = i;
        } else if (overview_ind == -1 && titles[i].innerText == 'Overview') {
            overview_ind = i;
        }
    }

    for (var i = 1; i < rows.length; ++i) {
        const project_name = rows[i].children[0].innerText;

        if (!(rows[i].classList.contains('r0') || rows[i].classList.contains('r1'))) {
            continue;
        }

        if (visible_ind != -1 && visible_ind < rows[i].children.length) {
            var visible_cell = rows[i].children[visible_ind];
            if (visible_cell.innerText === 'true') {
                visible_cell.style.backgroundColor = 'rgba(122, 235, 122, 0.25)';
            } else {
                visible_cell.style.backgroundColor = 'rgba(255, 69, 0, 0.25)';
            }
        }

        if (due_ind != -1 && due_ind < rows[i].children.length) {
            var due_cell = rows[i].children[due_ind];
            const due_time = Date.parse(due_cell.innerText);
            const current_time = Date.now();
            if (!due_time) {
                due_cell.style.backgroundColor = 'rgba(255, 213, 0, 0.25)';
            } else if (due_time < current_time) {
                due_cell.style.backgroundColor = 'rgba(255, 69, 0, 0.25)';
            } else {
                due_cell.style.backgroundColor = 'rgba(122, 235, 122, 0.25)';
            }
        }

        if (test_ind != -1 && test_ind < rows[i].children.length) {
            var test_cell = rows[i].children[test_ind];
            if (test_cell.innerText != '0') {
                test_cell.style.backgroundColor = 'rgba(255, 255, 0, 0.6)';
            } else {
                test_cell.style.backgroundColor = 'rgba(122, 235, 122, 0.25)';
            }
        }

        if (retest_ind != -1 && retest_ind < rows[i].children.length) {
            var retest_cell = rows[i].children[retest_ind];
            if (retest_cell.innerText != '0') {
                retest_cell.style.backgroundColor = 'rgba(255, 255, 0, 0.6)';
            } else {
                retest_cell.style.backgroundColor = 'rgba(122, 235, 122, 0.25)';
            }
        }

        if (setup_ind != -1 && setup_ind < rows[i].children.length) {
            var setup_cell = rows[i].children[setup_ind];
            if (setup_cell.textContent.indexOf('inactive') != -1) {
                setup_cell.style.backgroundColor = 'rgba(255, 69, 0, 0.25)';
            } else {
                setup_cell.style.backgroundColor = 'rgba(122, 235, 122, 0.25)';
            }
        }

        if (overview_ind != -1 && overview_ind < rows[i].children.length) {
            var overview_cell = rows[i].children[overview_ind];
            var link_tag = overview_cell.getElementsByTagName('a')[0];
            link_tag.innerText = '';
            var image_tag = document.createElement('img');
            image_tag.src = chrome.extension.getURL('images/line-chart.png');
            image_tag.title = 'Overview for ' + project_name;
            image_tag.style.width = '18px';
            image_tag.style.height = '18px';
            link_tag.appendChild(image_tag);
        }
    }
}

// display stats for overview page
function display_stats() {
    // setup html tags for showing results
    var project_table = document.getElementsByTagName('table')[0];
    project_table.classList.add('marmostats-overview-table');

    var overview_tag = document.createElement('div');
    overview_tag.id = 'marmostats-overview';
    overview_tag.innerHTML = '<div id="marmostats-test-summary"> \
                                <p>Total Students: <b id="marmostats-total-students"></b></p> \
                              </div> \
                              <div id="marmostats-selector-container"> \
                                <table id="marmostats-selector-table"></table> \
                                <div id="marmostats-setting-container"></div> \
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

// load configurations using chrome.storage API
function start() {
    chrome.storage.local.get(["projects_displayed"], function(result) {
        if (result.projects_displayed) {
            projects_displayed = result.projects_displayed;
            display_all = false;
        }
        display_stats();
    });
}

$(document).ready(function() {
    start();
})
