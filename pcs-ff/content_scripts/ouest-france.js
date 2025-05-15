console.log('Ouest-France PCS script injected');
let requestUrl;
let requestHeaders;
let pagesTotal;
let articles = [];
let abort = false;
let queryTerm;

const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        let newNodes = mutation.addedNodes;
        if (newNodes.length) {
            for (let node of newNodes) {
                if (
                    node.tagName === 'DIV' &&
                    node.classList.contains('articleItem')
                ) {
                    if (!document.querySelector('fieldset.pcs-ui')) {
                        injectInterface();
                        break;
                    }
                }
            }
        }
    });
});

chrome.runtime.sendMessage({
    action: 'getHeaders',
});

async function injectInterface() {
    observer.disconnect();
    await new Promise((resolve) => {
        chrome.runtime.sendMessage(
            {
                action: 'sendHeaders',
            },
            (response) => {
                requestUrl = response.url;
                requestHeaders = response.headers;
                resolve();
            }
        );
    });
    if (!requestUrl && !requestHeaders) {
        return;
    }
    const paperName = 'Ouest-France';
    const anchorDef = 'div#bpAlgolia_actualites_filtreItem_tri';

    const fieldset = document.createElement('fieldset');
    fieldset.classList.add('pcs-ui');
    const warning = document.createElement('div');
    warning.classList.add('pcs-fs-text');
    warning.textContent = chrome.i18n.getMessage('warningText');
    fieldset.appendChild(warning);
    const fieldsetText = document.createElement('div');
    fieldsetText.classList.add('pcs-fs-text');
    fieldsetText.textContent = chrome.i18n.getMessage('fieldsetText');
    fieldset.appendChild(fieldsetText);
    const anchor = document.querySelector(anchorDef);
    anchor.style.display = 'flex';
    anchor.style.flexDirection = 'column';
    anchor.style.alignItems = 'flex-start';
    anchor.appendChild(fieldset);

    const legend = document.createElement('legend');
    const legendText = document.createElement('div');
    legendText.classList.add('legend-text');
    legendText.textContent = `${paperName} corpus scraper`;
    legend.appendChild(legendText);
    fieldset.appendChild(legend);

    const extractButtonsContainer = document.createElement('div');
    extractButtonsContainer.style.width = '100%';
    extractButtonsContainer.style.display = 'inline-block';

    let selectedFormat = 'txt';

    const select = document.createElement('select');
    select.classList.add('pcs-ui');
    const txt = new Option('TXT', 'txt');
    const xml = new Option('XML/XTZ', 'xml');
    const ira = new Option('Iramuteq', 'ira');
    select.appendChild(txt);
    select.appendChild(xml);
    select.appendChild(ira);

    select.addEventListener('change', function () {
        selectedFormat = this.value;
    });

    const extractButton = document.createElement('button');
    extractButton.classList.add('pcs-ui');
    extractButton.id = 'extractButton';
    extractButton.textContent = chrome.i18n.getMessage('extractPage');

    extractButtonsContainer.appendChild(extractButton);
    extractButtonsContainer.appendChild(select);
    fieldset.appendChild(extractButtonsContainer);

    // Create extraction option checkbox
    const checkboxDiv = document.createElement('div');
    checkboxDiv.classList.add('checkbox-div');
    checkboxDiv.style.display = 'none';
    const container = document.createElement('label');
    container.classList.add('switch');
    const slider = document.createElement('span');
    slider.classList.add('slider');
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.name = 'extractOption';
    checkbox.id = 'extractOption';
    checkbox.checked = 'checked';
    container.appendChild(checkbox);
    container.appendChild(slider);
    const label = document.createElement('span');
    label.id = 'extractOption';
    label.htmlFor = 'extractOption';
    label.appendChild(document.createTextNode(''));
    const sortBySelect = document.querySelector('select.ais-SortBy-select');
    sortBySelect.addEventListener('change', async () => {
        await getArticles(sortBySelect.value, label);
    });
    const queryInput = document.querySelector('input.ais-SearchBox-input');
    queryInput.addEventListener('input', async () => {
        await getArticles(sortBySelect.value, label);
    });
    await getArticles(sortBySelect.value, label);
    checkboxDiv.appendChild(container);
    checkboxDiv.appendChild(label);
    extractButton.before(checkboxDiv);
    if (pagesTotal > 1) {
        checkboxDiv.style.display = 'block';
        extractButton.textContent = chrome.i18n.getMessage('extractAll');
    }

    // Create container for downloaded files list
    const downloadedFilesContainer = document.createElement('div');
    downloadedFilesContainer.classList.add('fileList');
    downloadedFilesContainer.style.display = 'none';
    fieldset.appendChild(downloadedFilesContainer);

    // Create abort button
    const abortButton = document.createElement('button');
    abortButton.classList.add('abort-button');
    abortButton.textContent = chrome.i18n.getMessage('abort');
    fieldset.appendChild(abortButton);

    let extractAll = true;

    checkbox.addEventListener('change', function () {
        if (checkbox.checked) {
            extractButton.textContent = chrome.i18n.getMessage('extractAll');
            label.style.opacity = '1';
            extractAll = true;
        } else {
            extractButton.textContent = chrome.i18n.getMessage('extractPage');
            label.style.opacity = '0.6';
            extractAll = false;
        }
    });

    extractButton.addEventListener('click', async () => {
        abort = false;
        downloadedFilesContainer.textContent = '';
        downloadedFilesContainer.style.display = 'none';
        extractButtonsContainer.style.display = 'none';
        abortButton.style.display = 'block';
        extractionContainer.style.display = 'block';
        fieldset.style.cursor = 'wait';
        if (!extractAll) {
            pagesTotal = 1;
        }
        articles = [];
        for (let i = 0; i < pagesTotal; i++) {
            if (!abort) {
                await extractArticles(sortBySelect.value, i);
            } else {
                break;
            }
        }
        downloadFiles(articles, selectedFormat);
    });

    abortButton.addEventListener('click', function (event) {
        event.preventDefault();
        abort = true;
        abortButton.textContent = chrome.i18n.getMessage('abortText');
    });

    // Create a container for the extraction message and spinner
    const extractionContainer = document.createElement('div');
    extractionContainer.id = 'extractionContainer';
    extractionContainer.style.display = 'none'; // Hide initially
    fieldset.appendChild(extractionContainer);

    // Create the loading spinner element
    const spinner = document.createElement('div');
    spinner.classList.add('spinner'); // Add a class for styling
    extractionContainer.appendChild(spinner);

    // Create the extraction message element
    const extractionMessage = document.createElement('div');
    extractionMessage.id = 'extractionMessage';
    extractionMessage.textContent = chrome.i18n.getMessage('extractionMessage');
    extractionContainer.appendChild(extractionMessage);

    async function getArticles(indexName) {
        if (abort) {
            return;
        }
        queryTerm = document
            .querySelector('input.ais-SearchBox-input')
            .value.trim();

        let headers = new Headers();
        requestHeaders.forEach((header) => {
            headers.append(header.name, header.value);
        });

        let params = new URLSearchParams();
        params.append('query', queryTerm);
        params.append('hitsPerPage', '20');

        let requestBody = {
            requests: [
                {
                    indexName: indexName,
                    params: params.toString(),
                },
            ],
        };

        try {
            let res = await fetch(
                'https://c8kp7jv01t-dsn.algolia.net/1/indexes/*/queries',
                {
                    method: 'POST',
                    headers: headers,
                    body: JSON.stringify(requestBody),
                }
            );
            if (res.ok) {
                let data = await res.json();
                pagesTotal = data.results[0].nbPages;
                if (label) {
                    label.textContent = `${chrome.i18n.getMessage(
                        'extractLabelText1'
                    )}${pagesTotal}${chrome.i18n.getMessage(
                        'extractLabelText2'
                    )}`;
                }
                if (pagesTotal > 1) {
                    checkboxDiv.style.display = 'block';
                    extractButton.textContent =
                        chrome.i18n.getMessage('extractAll');
                } else {
                    checkboxDiv.style.display = 'none';
                    extractButton.textContent =
                        chrome.i18n.getMessage('extractPage');
                }
                return data.results[0];
            } else {
                console.error('Error fetching data: ', res);
            }
        } catch (error) {
            console.error('Error: ', error);
        }
    }

    async function extractArticles(indexName, page) {
        queryTerm = document
            .querySelector('input.ais-SearchBox-input')
            .value.trim();

        let headers = new Headers();
        requestHeaders.forEach((header) => {
            headers.append(header.name, header.value);
        });

        let params = new URLSearchParams();
        params.append('query', queryTerm);
        params.append('hitsPerPage', '20');
        params.append('page', page);

        let requestBody = {
            requests: [
                {
                    indexName: indexName,
                    params: params.toString(),
                },
            ],
        };

        try {
            let res = await fetch(
                'https://c8kp7jv01t-dsn.algolia.net/1/indexes/*/queries',
                {
                    method: 'POST',
                    headers: headers,
                    body: JSON.stringify(requestBody),
                }
            );
            if (res.ok) {
                let data = await res.json();
                const hits = data.results[0].hits;
                articles.push(...hits);
                extractionMessage.textContent = `${chrome.i18n.getMessage(
                    'extractionMessage2'
                )}${page + 1}${chrome.i18n.getMessage(
                    'extractionMessage3'
                )}${pagesTotal}${chrome.i18n.getMessage(
                    'extractionMessage4'
                )}${selectedFormat}...`;
            } else {
                console.error('Error fetching data: ', res);
            }
        } catch (error) {
            console.error('Error: ', error);
        }
    }

    async function downloadFiles(articles, selectedFormat) {
        let files;
        if (selectedFormat === 'txt') {
            files = await makeTxtFiles(articles);
        } else if (selectedFormat === 'xml') {
            files = await makeXmlFiles(articles);
        } else if (selectedFormat === 'ira') {
            files = await makeIraFiles(articles);
        }
        const zip = new JSZip();
        for (let file of files) {
            zip.file(file.filename, file.content);
        }
        let blob = await zip.generateAsync({ type: 'blob' });
        let url = URL.createObjectURL(blob);
        let a = document.createElement('a');
        a.href = url;
        a.download = `${paperName}_${selectedFormat}.zip`;
        a.click();
        URL.revokeObjectURL(url);
        extractionContainer.style.display = 'none';
        extractionMessage.textContent =
            chrome.i18n.getMessage('extractionMessage');
        abortButton.style.display = 'none';
        abortButton.textContent = chrome.i18n.getMessage('abort');
        extractButtonsContainer.style.display = 'inline-block';
        fieldset.style.cursor = '';
        downloadedFilesContainer.style.display = 'block';
        downloadedFilesContainer.textContent = `\n${chrome.i18n.getMessage(
            'downloadFilesContainerText1'
        )}\n${files.length}${chrome.i18n.getMessage(
            'downloadFilesContainerText3'
        )}\n${paperName}_${selectedFormat}.zip`;
    }

    async function makeTxtFiles(articles) {
        return new Promise((resolve) => {
            let titles = new Set();
            let files = [];
            for (let article of articles) {
                let title = article.titre;
                if (titles.has(title)) {
                    continue;
                }
                titles.add(title);
                let date = new Date(article.datePublication * 1000)
                    .toISOString()
                    .split('T')[0];
                let subhead = article.chapeau || '';
                let text = `${title}\n\n${subhead}\n\n${article.texte}`;
                let titleForFilename = title
                    .trim()
                    .replaceAll(/\p{P}/gu, '_')
                    .replaceAll(/\s+/gu, '_')
                    .replaceAll(/_+/gu, '_');
                if (navigator.userAgent.includes('Windows')) {
                    titleForFilename = titleForFilename
                        .normalize('NFD')
                        .replace(/[\u0300-\u036f]/g, '')
                        .replaceAll('œ', 'oe')
                        .replaceAll('æ', 'ae')
                        .replaceAll('Œ', 'OE')
                        .replaceAll('Æ', 'AE');
                }
                let file = {
                    filename: `${date}_${titleForFilename.substring(0, 20)}.txt`,
                    content: text,
                };
                files.push(file);
            }
            resolve(files);
        });
    }

    async function makeXmlFiles(articles) {
        return new Promise((resolve) => {
            let titles = new Set();
            let files = [];
            for (let article of articles) {
                let title = article.titre;
                if (titles.has(title)) {
                    continue;
                }
                titles.add(title);
                let date = new Date(article.datePublication * 1000)
                    .toISOString()
                    .split('T')[0];
                let subhead = article.cheapeau || '';
                let xmlTitle = title
                    .replaceAll(/&/gu, '&amp;')
                    .replaceAll(/</gu, '&lt;')
                    .replaceAll(/>/gu, '&gt;')
                    .replaceAll(/"/gu, '&quot;')
                    .replaceAll(/'/gu, '&apos;');
                let xmlSubhead = subhead
                    .replaceAll(/&/gu, '&amp;')
                    .replaceAll(/</gu, '&lt;')
                    .replaceAll(/>/gu, '&gt;')
                    .replaceAll(/"/gu, '&quot;')
                    .replaceAll(/'/gu, '&apos;');
                let xmlText = article.texte
                    .replaceAll(/&/gu, '&amp;')
                    .replaceAll(/</gu, '&lt;')
                    .replaceAll(/>/gu, '&gt;')
                    .replaceAll(/"/gu, '&quot;')
                    .replaceAll(/'/gu, '&apos;');
                let url = `https://www.ouest-france.fr${article.url}`;
                let text = `<text date="${date}" title="${xmlTitle}">\n<ref target="${url}">${url}</ref><lb/><lb/>\n\n${xmlSubhead}<lb/><lb/>\n\n${xmlText}\n</text>`;
                let titleForFilename = title
                    .trim()
                    .replaceAll(/\p{P}/gu, '_')
                    .replaceAll(/\s+/gu, '_')
                    .replaceAll(/_+/gu, '_');
                if (navigator.userAgent.includes('Windows')) {
                    titleForFilename = titleForFilename
                        .normalize('NFD')
                        .replace(/[\u0300-\u036f]/g, '')
                        .replaceAll('œ', 'oe')
                        .replaceAll('æ', 'ae')
                        .replaceAll('Œ', 'OE')
                        .replaceAll('Æ', 'AE');
                }
                let file = {
                    filename: `${date}_${titleForFilename.substring(
                        0,
                        20
                    )}.xml`,
                    content: text,
                };
                files.push(file);
            }
            resolve(files);
        });
    }

    async function makeIraFiles(articles) {
        return new Promise((resolve) => {
            let titles = new Set();
            let files = [];
            for (let article of articles) {
                let title = article.titre;
                if (titles.has(title)) {
                    continue;
                }
                titles.add(title);
                let date = new Date(article.datePublication * 1000)
                    .toISOString()
                    .split('T')[0];
                let subhead = article.chapeau || '';
                let titleForFilename = title
                    .trim()
                    .replaceAll(/\p{P}/gu, '_')
                    .replaceAll(/\s+/gu, '_')
                    .replaceAll(/_+/gu, '_');
                if (navigator.userAgent.includes('Windows')) {
                    titleForFilename = titleForFilename
                        .normalize('NFD')
                        .replace(/[\u0300-\u036f]/g, '')
                        .replaceAll('œ', 'oe')
                        .replaceAll('æ', 'ae')
                        .replaceAll('Œ', 'OE')
                        .replaceAll('Æ', 'AE');
                }
                let text = `\n**** *title_${title} *date_${date}\n\n${subhead}\n\n${article.texte}`;
                let file = {
                    filename: `${date}_${titleForFilename}.txt`,
                    content: text,
                };
                files.push(file);
            }
            resolve(files);
        });
    }
}

observer.observe(document.body, {
    childList: true,
    subtree: true,
});
