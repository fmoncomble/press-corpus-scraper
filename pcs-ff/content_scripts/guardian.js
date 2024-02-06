console.log('The Guardian PCS script injected');

const anchor = document.querySelector('gu-island[name="HeaderTopBar"] div div span');
const scriptBtn = document.createElement('div');
scriptBtn.id = 'pcs-btn';
scriptBtn.classList.add('dcr-1gd007l');
scriptBtn.title = 'Start extraction session';
const scriptLink = document.createElement('a');
scriptLink.id = 'pcs-link';
scriptLink.classList.add('dcr-vxyr81');
scriptLink.textContent = 'PCScraper';
const apiUrl = chrome.runtime.getURL('content_scripts/guardianapi.html');
scriptLink.setAttribute('href', apiUrl);
scriptLink.setAttribute('target', '_blank');
scriptBtn.appendChild(scriptLink);
anchor.after(scriptBtn);
