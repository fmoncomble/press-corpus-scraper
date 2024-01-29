console.log('popup.js loaded');

document.addEventListener('DOMContentLoaded', function () {
    const triggerBtn = document.querySelector('.trigger-btn');
    const paperNames = [
        'theguardian',
        'nytimes',
        'lemonde',
        'lefigaro',
        'lepoint',
    ];
    chrome.runtime.sendMessage(
        {
            action: 'getUrl',
        },
        function (response) {
            if (chrome.runtime.lastError) {
                console.error(chrome.runtime.lastError);
                return;
            }

            if (response && response.url) {
                let url = response.url;
                url = new URL(url);
                domain = url.hostname.split('.')[1];
                console.log('Current tab domain = ', domain);
                if (!paperNames.includes(domain)) {
                    const errorMsg = document.querySelector('.error-msg');
                    errorMsg.style.display = 'block';
                    triggerBtn.style.display = 'none';
                } else {
                    const urlDisplay = document.querySelector('.url-display');
                    urlDisplay.textContent = tabDomain;
                }
            }
        }
    );
});
