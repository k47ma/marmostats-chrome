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

$(document).ready(function() {
    add_styles();
});