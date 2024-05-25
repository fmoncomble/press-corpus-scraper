document.addEventListener('DOMContentLoaded', () => {
    async function checkNewVersion() {
        const response = await fetch(
            'https://www.github.com/fmoncomble/press-corpus-scraper/releases/latest'
        );
        if (response.redirected) {
            const redirectUrl = response.url;
            const manifest = chrome.runtime.getManifest();
            const currentVersion = manifest.version;
            const newVersion = redirectUrl.split('tag/v')[1];
            if (currentVersion < newVersion) {
                const updateDiv = document.getElementById('update');
                const updateLink = updateDiv.querySelector('a');
                if (typeof chrome !== 'undefined') {
                    updateLink.setAttribute('href', 'https://github.com/fmoncomble/press-corpus-scraper/releases/latest/download/pcs.zip');
                } else if (typeof browser !== 'undefined') {
                    updateLink.setAttribute('href', 'https://github.com/fmoncomble/press-corpus-scraper/releases/latest/download/pcs.xpi');
                }
                updateDiv.style.display = 'block';
            }
        }
    }

    checkNewVersion();

    const sourceSelect = document.getElementById('source-select');
    const euroResetBtn = document.getElementById('euro-reset');
    const europresseSelect = document.getElementById('europresse-select');
    const instSelect = document.getElementById('inst-select');
    const europartnerDiv = document.getElementById('europartner');
    const goBtn = document.getElementById('go-btn');

    const partnersFileUrl = chrome.runtime.getURL('europartners.json');

    const guardianapiurl = chrome.runtime.getURL(
        'content_scripts/guardianapi.html'
    );
    const nytapiurl = chrome.runtime.getURL('content_scripts/nytimesapi.html');
    const dzpapiurl = chrome.runtime.getURL('content_scripts/dzpapi.html');

    const sources = {
        lemonde: 'https://www.lemonde.fr/recherche/',
        lefigaro: 'https://recherche.lefigaro.fr/',
        lepoint: 'https://www.lepoint.fr/',
        lhumanite: 'https://www.humanite.fr/',
        guardian: guardianapiurl,
        nyt: nytapiurl,
        dzp: dzpapiurl,
    };

    let source = 'lemonde';
    let sourceUrl;
    let partners = {};
    let euroSource;

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

    sourceSelect.addEventListener('change', async () => {
        source = sourceSelect.value;
        if (source === 'europresse') {
            if (euroSource) {
                europartnerDiv.textContent = euroSource;
                euroResetBtn.style.display = 'inline-block';
            } else if (!euroSource) {
                euroResetBtn.style.display = 'none';
                europresseSelect.style.display = 'block';
                buildSelect();
            }
        } else {
            europresseSelect.style.display = 'none';
        }
    });

    instSelect.addEventListener('change', () => {
        euroSource = instSelect.value;
        saveEuroSource();
    });

    goBtn.addEventListener('click', async () => {
        if (source !== 'europresse') {
            for (src in sources) {
                src = source;
                sourceUrl = sources[src];
            }
        } else if (source === 'europresse') {
            await getPartners();
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

    euroResetBtn.addEventListener('click', async () => {
        europartnerDiv.textContent = '';
        euroSource = '';
        saveEuroSource();
        euroResetBtn.style.display = 'none';
        europresseSelect.style.display = 'block';
        buildSelect();
    });

    async function buildSelect() {
        await getPartners();
        for (p of partners) {
            const option = document.createElement('option');
            const name = p.name;
            option.value = name;
            option.textContent = name;
            instSelect.appendChild(option);
        }
        instSelect.value = '';
    }

    async function getPartners() {
        const partnersFile = await fetch(partnersFileUrl);
        const data = await partnersFile.json();
        partners = data.partners;
    }
});
