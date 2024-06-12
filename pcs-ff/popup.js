document.addEventListener('DOMContentLoaded', () => {
    // Check for update
    console.log('Firefox? ', navigator.userAgent.indexOf('Firefox'));
    async function checkNewVersion() {
        const response = await fetch(
            'https://www.github.com/fmoncomble/press-corpus-scraper/releases/latest'
        );
        if (response.redirected) {
            const redirectUrl = response.url;
            const manifest = chrome.runtime.getManifest();
            const currentVersion = manifest.version;
            const newVersion = redirectUrl.split('tag/v')[1];
            const cV = currentVersion.split('.');
            const nV = newVersion.split('.');
            for (let i = 0; i < newVersion.length; i++) {
                if (Number(nV[i]) > Number(cV[i])) {
                    const updateContainer =
                        document.getElementById('update-container');
                    if (navigator.userAgent.indexOf('Firefox') != -1) {
                        updateLink.setAttribute(
                            'href',
                            'https://github.com/fmoncomble/press-corpus-scraper/releases/latest/download/pcs.xpi'
                        );
                    } else {
                        updateLink.setAttribute(
                            'href',
                            'https://github.com/fmoncomble/press-corpus-scraper/releases/latest/download/pcs.zip'
                        );
                        updateLink.textContent =
                            chrome.i18n.getMessage('dlUpdateLinkText');
                    }
                    updateContainer.style.display = 'block';
                }
            }
        }
    }
    checkNewVersion();

    const manifest = chrome.runtime.getManifest();
    const currentVersion = manifest.version;
    const versionDiv = document.getElementById('version');
    versionDiv.textContent = `${currentVersion}`;

    // Declare popup elements
    const updateDiv = document.getElementById('update');
    const updateLink = document.querySelector('a');
    const sourceSelect = document.getElementById('source-select');
    const sourceLabel = document.getElementById('source-label');
    const europresseSelect = document.getElementById('europresse-select');
    const instLegend = document.getElementById('inst-legend');
    const instInput = document.getElementById('inst-input');
    const europartnerDiv = document.getElementById('europartner');
    const euroResetBtn = document.getElementById('euro-reset');
    const goBtn = document.getElementById('go-btn');

    // Localize elements
    updateDiv.textContent = chrome.i18n.getMessage('updateNotif');
    updateLink.textContent = chrome.i18n.getMessage('updateLinkText');
    sourceLabel.textContent = chrome.i18n.getMessage('sourceSelect');
    euroResetBtn.textContent = chrome.i18n.getMessage('instReset');
    instLegend.textContent = chrome.i18n.getMessage('instSelect');
    instInput.placeholder = chrome.i18n.getMessage('instPlaceholder');
    goBtn.textContent = chrome.i18n.getMessage('go');

    // Get resources & URLs
    const partnersFileUrl = chrome.runtime.getURL('europartners.json');
    const guardianapiurl = chrome.runtime.getURL(
        'content_scripts/guardianapi.html'
    );
    const nytapiurl = chrome.runtime.getURL('content_scripts/nytimesapi.html');
    const dzpapiurl = chrome.runtime.getURL('content_scripts/dzpapi.html');

    const sources = {
        lemonde: 'https://www.lemonde.fr/recherche/',
        lefigaro: 'https://recherche.lefigaro.fr/',
        lepoint: 'https://www.lepoint.fr/recherche/',
        lhumanite: 'https://www.humanite.fr/',
        sueddeutsche: 'https://www.sueddeutsche.de/suche?search=',
        guardian: guardianapiurl,
        nyt: nytapiurl,
        dzp: dzpapiurl,
    };

    let source = '';
    let sourceUrl;
    let partners = {};
    let euroSource;

    // Listen for source selection
    sourceSelect.addEventListener('change', async () => {
        source = sourceSelect.value;
        if (source === 'europresse') {
            if (euroSource) {
                europartnerDiv.textContent = euroSource;
                euroResetBtn.style.display = 'inline-block';
            } else if (!euroSource) {
                euroResetBtn.style.display = 'none';
                europresseSelect.style.display = 'block';
                const euroPartners = document.querySelectorAll(
                    'label.inst-choice-div'
                );
                console.log(
                    'List of Europresse partners: ',
                    Array.from(euroPartners)
                );
                if (Array.from(euroPartners).length === 0) {
                    buildSelect();
                }
                instInput.focus();
            }
        } else {
            europresseSelect.style.display = 'none';
            europartnerDiv.textContent = '';
            euroResetBtn.style.display = 'none';
        }
    });

    // Handle storage of Europresse partner
    function getEuroSource(callback) {
        chrome.storage.local.get(['eurosource'], function (result) {
            const euroSource = result.eurosource || '';
            callback(euroSource);
        });
    }
    async function saveEuroSource() {
        chrome.storage.local.set({ eurosource: euroSource });
    }
    getEuroSource(function (euroSourceResult) {
        euroSource = euroSourceResult;
    });

    // Listen to filter input
    instInput.oninput = () => {
        const searchTerm = instInput.value;
        const instList = document.getElementById('inst-list');
        const choices = instList.getElementsByClassName('inst-choice-div');
        Array.from(choices).forEach((choice) => {
            const choice_name = choice.textContent;
            choice.hidden = !choice_name
                .toLowerCase()
                .includes(searchTerm.toLowerCase());
        });
        const hiddenChoices = instList.querySelectorAll('label[hidden]');
        console.log('Hidden choices: ', hiddenChoices);
    };

    // Set Europresse partner choice and save it to storage
    function getInstChoice() {
        const instChoiceInputs = document.querySelectorAll('input.inst-choice');
        if (instChoiceInputs) {
            for (i of instChoiceInputs) {
                if (i.checked) {
                    euroSource = i.value;
                    saveEuroSource();
                }
            }
        }
    }

    // Listen to Europresse partner reset button
    euroResetBtn.addEventListener('click', async () => {
        europartnerDiv.textContent = '';
        euroSource = '';
        saveEuroSource();
        euroResetBtn.style.display = 'none';
        europresseSelect.style.display = 'block';
        buildSelect();
        instInput.focus();
    });

    // Build list of Europresse partner
    async function buildSelect() {
        await getPartners();
        for (p of partners) {
            const instList = document.getElementById('inst-list');
            const label = document.createElement('label');
            label.classList.add('inst-choice-div');
            const input = document.createElement('input');
            input.setAttribute('type', 'radio');
            const name = p.name;
            input.value = name;
            input.id = name;
            input.classList.add('inst-choice');
            input.name = 'inst';
            label.appendChild(input);
            const span = document.createElement('span');
            span.textContent = name;
            label.appendChild(span);
            instList.appendChild(label);
        }
    }

    // Retrieve list of Europresse partners from JSON file
    async function getPartners() {
        const partnersFile = await fetch(partnersFileUrl);
        const data = await partnersFile.json();
        partners = data.partners;
    }

    // Listen to 'Go' button
    goBtn.addEventListener('click', async () => {
        if (source !== 'europresse') {
            for (src in sources) {
                src = source;
                sourceUrl = sources[src];
            }
        } else if (source === 'europresse') {
            await getPartners();
            getInstChoice();
            const selectedPartner = partners.find((p) => p.name === euroSource);
            if (selectedPartner) {
                sourceUrl = selectedPartner.AUTH_URL;
            } else {
                console.error('Europresse URL not found');
            }
        }
        chrome.tabs.create({ url: sourceUrl });
        window.close();
    });
});
