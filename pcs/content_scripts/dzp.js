window.onload = function () {
    console.log('DDB PCS script injected');

    let anchor = document.querySelector('li.language-switch');
    const scriptBtn = document.createElement('li');
    scriptBtn.id = 'pcs-btn';
    scriptBtn.classList.add('language-switch');
    scriptBtn.title = 'Start extraction session';
    const scriptLink = document.createElement('a');
    scriptLink.id = 'pcs-link';
    scriptLink.classList.add('link-language');
    scriptLink.textContent = 'PCScraper';
    const apiUrl = chrome.runtime.getURL('content_scripts/dzpapi.html');
    scriptLink.setAttribute('href', apiUrl);
    scriptLink.setAttribute('target', '_blank');
    scriptBtn.appendChild(scriptLink);
    anchor.after(scriptBtn);
};