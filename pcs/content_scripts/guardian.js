window.onload = function () {
    console.log('The Guardian PCS script injected');

    const anchor = document.querySelector('gu-island[name="TopBar"] div div');
    const scriptBtn = document.createElement('span');
    scriptBtn.id = 'pcs-btn';
    scriptBtn.classList.add('dcr-1vetsv0');
    scriptBtn.title = 'Start extraction session';
    const scriptDiv = document.createElement('div');
    scriptDiv.classList.add('dcr-1cvta4k');
    scriptDiv.style.paddingRight = '12px';
    const scriptLink = document.createElement('a');
    scriptLink.id = 'pcs-link';
    scriptLink.classList.add('dcr-vxblrw');
    scriptLink.textContent = 'PCScraper';
    const apiUrl = chrome.runtime.getURL('content_scripts/guardianapi.html');
    scriptLink.setAttribute('href', apiUrl);
    scriptLink.setAttribute('target', '_blank');
    scriptBtn.appendChild(scriptDiv);
    scriptDiv.appendChild(scriptLink);
    anchor.appendChild(scriptBtn);
};
