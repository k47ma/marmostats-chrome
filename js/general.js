/* JavaScript for all instructor pages */

// setup page tab styles
function add_tab_styles(container) {
    const link_map = {'Overview': 'project.jsp',
                      'Utilities': 'projectUtilities.jsp',
                      'History': 'projectTestHistory.jsp',
                      'Test details': 'projectTestResults.jsp',
                      'Inconsistencies': 'failedBackgroundRetests.jsp'
                     };

    const current_url = window.location.href;
    var link_tags = container.getElementsByTagName('a');
    for (var link_tag of link_tags) {
        const link_text = link_tag.innerText.trim();
        if (!(link_text in link_map)) {
            continue;
        }
        if (current_url.indexOf(link_map[link_text]) != -1) {
            link_tag.id = 'marmostats-tab-current';
        }
    }
}

// setup page styles
function add_styles() {
    // add styles for tab links
    for (var p_tag of document.getElementsByTagName('p')) {
        const link_names = p_tag.innerText.split('|');
        if (link_names.length > 3 &&
            link_names[0].indexOf('Overview') != -1 &&
            link_names[1].indexOf('Utilities') != -1 &&
            link_names[2].indexOf('History') != -1) {
            p_tag.id = 'marmostats-tabs';
            add_tab_styles(p_tag);
            break;
        }
    }

    // add styles for deadline text
    for (var tag of document.getElementsByTagName('p')) {
        if (tag.textContent.startsWith('Deadline')) {
            tag.classList.add('marmostats-deadline-text');
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
                text_tag.style.backgroundColor = 'rgba(100, 210, 100, 0.5)';
            }
            break;
        }
    }
}

// add header on scroll
function add_table_header(table) {
    const rows = table.getElementsByTagName('tr')
    const header_rows = new Array();
    for (const row of rows) {
        if (row.getElementsByTagName('th')) {
            header_rows.push(row);
        } else {
            break;
        }
    }
    
    if (header_rows.length == 0) {
        return;
    }

    var header_copy = document.getElementById('marmostats-overview-header');
    if (!header_copy) {
        header_copy = document.createElement('div');
        header_copy.id = 'marmostats-overview-header';
        document.getElementById('marmostats-overview').appendChild(header_copy);
        header_copy.style.visibility = 'collapse';
    }

    const header_row = header_rows[0];
    header_copy.innerHTML = '';
    header_copy.style.width = header_row.clientWidth + header_row.children.length;
    for (var header of header_row.children) {
        var h_copy = document.createElement('span');
        h_copy.classList.add('marmostats-overview-title');
        var h_text = document.createElement('p');
        h_text.innerHTML = header.innerHTML;
        h_copy.appendChild(h_text);
        header_copy.appendChild(h_copy);
    }

    const header_rect = header_row.getBoundingClientRect();
    var area_height = 0;
    for (const row of rows) {
        if (row.children[0].hasAttribute('colspan')) {
            continue;
        }
        area_height += row.clientHeight;
    }

    if (header_rect.top < 0 && header_rect.top + area_height > 0) {
        header_copy.style.position = 'absolute';
        header_copy.style.top = window.pageYOffset - 5;
        header_copy.style.left = header_rect.left + window.pageXOffset - 0.5;
        header_copy.style.visibility = 'visible';
    } else {
        header_copy.style.visibility = 'collapse';
    }

    var max_height = 0;
    for (var i = 0; i < header_copy.children.length; ++i) {
        var cell_copy = header_copy.children[i];
        cell_copy.style.width = header_row.children[i].clientWidth;
        max_height = max_height < cell_copy.clientHeight ? cell_copy.clientHeight : max_height;
    }
    for (var cell_copy of header_copy.children) {
        cell_copy.style.height = max_height;
        if (cell_copy.innerText == 'Secret') {
            cell_copy.style.borderLeftWidth = '7px';
        }
    }
}

$(document).ready(function() {
    document.addEventListener('scroll', function() {
        table_classes = ['marmostats-overview-table',
                         'marmostats-result-table',
                         'marmostats-project-table'];
        for (const class_name of table_classes) {
            const table = document.getElementById(class_name);
            if (table) {
                add_table_header(table);
            }
        }
    });

    add_styles();
});