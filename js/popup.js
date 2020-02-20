document.addEventListener('DOMContentLoaded', function() {
    var checkPageButton = document.getElementById('enable_toggle');

    chrome.storage.local.get(["enabled"], function(result) {
        if (result.enabled) {
            checkPageButton.checked = true;
        } else {
            checkPageButton.checked = false;
        }
    })

    checkPageButton.addEventListener('click', function() {
        if (!checkPageButton.checked) {
            chrome.storage.local.set({"enabled": false}, function() {});
        } else {
            chrome.storage.local.set({"enabled": true}, function() {});
        }
    })
})

  

