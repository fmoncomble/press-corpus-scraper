window.onload = function() {
    console.log('The NY Times PCS script injected');

    let anchor = document.querySelector('.css-17j7fe1');
    const scriptBtn = document.createElement('li');
    scriptBtn.id = 'pcs-btn';
    scriptBtn.classList.add('css-1fbfcor');
    scriptBtn.title = 'Start extraction session';
    const scriptLink = document.createElement('a');
    scriptLink.id = 'pcs-link';
    scriptLink.classList.add('css-1hhqwge');
    scriptLink.textContent = 'PCScraper';
    const apiUrl = chrome.runtime.getURL('content_scripts/nytimesapi.html');
    scriptLink.setAttribute('href', apiUrl);
    scriptLink.setAttribute('target', '_blank');
    scriptBtn.appendChild(scriptLink);
    anchor.appendChild(scriptBtn);
}