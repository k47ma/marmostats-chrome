/* Script for parsing test details. */

// Parse the result for a single test case and add the result to title
// test_ind starts from 0 for public tests, followed by secret tests
function parse_test_result(table, test_ind, col_ind) {
    var test_rows = table.getElementsByTagName('tr');
    var title_tag = test_rows[1].getElementsByTagName('th')[test_ind];
    var total_passed = 0;
    const total_submissions = test_rows.length - 2;

    for (row_ind = 2; row_ind < test_rows.length; ++row_ind) {
        const test_result = test_rows[row_ind].children[col_ind];
        if (test_result != undefined && test_result.getAttribute('class') == "passed") {
            ++total_passed;
        }
    }

    var summary_tag = document.createElement("P");
    summary_tag.innerText = (total_passed / total_submissions * 100).toFixed(2) + "%";
    summary_tag.style.fontWeight = 'normal';
    summary_tag.style.fontSize = '13px';
    summary_tag.style.marginBlockStart = '0px';
    summary_tag.style.marginBlockEnd = '0px';
    title_tag.appendChild(summary_tag);
}

function display_stats() {
    var result_table = document.querySelector('[title="projectTestResults"]');
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

display_stats();