console.log('DZP API script loaded');

document.addEventListener('DOMContentLoaded', async function () {
    // Declare page elements
    const wrapper = document.querySelector('.wrapper');
    const apiKeyInput = document.querySelector('#apikey-input');
    const apiKeySaveBtn = wrapper.querySelector('button.save-apikey');
    const searchTypeSelect = document.getElementById('search-type');
    const showSearch = document.getElementById('show-search');
    const hideSearch = document.getElementById('hide-search');
    const searchContainer = document.getElementById('search-container');
    const guidedSearchContainer = document.getElementById('guided-search');
    const expertSearchContainer = document.getElementById('expert-search');
    const allWordsInput = document.getElementById('all-words');
    const anyWordsInput = document.getElementById('any-words');
    const exactPhraseInput = document.getElementById('exact-phrase');
    const noWordsInput = document.getElementById('no-words');
    const keywordsInput = document.getElementById('keywords');
    const paperTitleInput = document.getElementById('paper-title');
    const fromDateInput = document.getElementById('from-date');
    const toDateInput = document.getElementById('to-date');
    const resultsContainer = document.querySelector('div#results-container');
    const queryUrlDiv = document.getElementById('query-url-div');
    const resultsOverview = document.querySelector('div#results-overview');
    const extractContainer = document.querySelector('div#extract-container');
    const formatSelector = document.querySelector('#format');
    const extractBtn = document.querySelector('.extract-button');
    const searchSpinner = document.querySelector('#search-spinner');
    const extractSpinner = document.querySelector('#extract-spinner');
    const urlInput = document.querySelector('.url-input');
    const extractOption = document.getElementById('extract-option');
    const extractSelectContainer = document.getElementById(
        'extract-select-container'
    );
    const extractSelect = document.getElementById('extract-select');

    // Manage API key
    let apiKey;
    function getApiKey(callback) {
        chrome.storage.local.get(['dzpapikey'], function (result) {
            const apiKey = result.dzpapikey || '';
            callback(apiKey);
        });
    }
    getApiKey(function (apiKeyResult) {
        apiKey = apiKeyResult;
        if (apiKey) {
            apiKeyInput;
            apiKeyInput.placeholder = 'API Key stored: enter new key to reset';
            apiKeySaveBtn.textContent = 'Reset API Key';
        }
    });

    apiKeyInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            saveApiKey();
        }
    });
    apiKeySaveBtn.addEventListener('click', function () {
        saveApiKey();
    });

    async function saveApiKey() {
        apiKey = apiKeyInput.value;
        if (apiKey) {
            chrome.storage.local.set({ dzpapikey: apiKey }, function () {
                apiKeySaveBtn.style.backgroundColor = '#006600';
                apiKeySaveBtn.textContent = 'Saved';
                apiKeyInput.value = '';
                apiKeyInput.placeholder =
                    'API Key stored: enter new key to reset';
                setTimeout(() => {
                    apiKeySaveBtn.removeAttribute('style');
                    apiKeySaveBtn.textContent = 'Reset API Key';
                }, 2000);
            });
        } else {
            chrome.storage.local.remove('dzpapikey', function () {
                apiKeySaveBtn.style.backgroundColor = '#006600';
                apiKeySaveBtn.textContent = 'API Key reset';
                apiKeyInput.value = '';
                apiKeyInput.placeholder = 'Enter your API key';
                setTimeout(() => {
                    apiKeySaveBtn.removeAttribute('style');
                    apiKeySaveBtn.textContent = 'Save';
                }, 2000);
            });
        }
    }

    // Set search type
    let searchType = 'guided';
    searchTypeSelect.addEventListener('change', () => {
        searchType = searchTypeSelect.value;
        if (searchType === 'expert') {
            guidedSearchContainer.style.display = 'none';
            expertSearchContainer.style.display = 'block';
        } else if (searchType === 'guided') {
            guidedSearchContainer.style.display = 'block';
            expertSearchContainer.style.display = 'none';
        }
    });

    // Assign function to show-search and hide-search
    showSearch.addEventListener('click', () => {
        searchContainer.style.display = 'block';
        showSearch.style.display = 'none';
        hideSearch.style.display = 'block';
    });
    hideSearch.addEventListener('click', () => {
        searchContainer.style.display = 'none';
        showSearch.style.display = 'block';
        hideSearch.style.display = 'none';
    });

    // Assign function to reset button
    const resetFormBtn = document.querySelector('.reset-form');
    resetFormBtn.addEventListener('click', function () {
        urlInput.value = '';
        const searchInputs = searchContainer.querySelectorAll(
            'input, select.search-option'
        );
        for (s of searchInputs) {
            s.value = '';
        }
        searchContainer.style.display = 'block';
        showSearch.style.display = 'none';
        hideSearch.style.display = 'none';
        searchSpinner.style.display = 'none';
        resultsContainer.style.display = 'none';
        extractContainer.style.display = 'none';
        extractBtn.removeAttribute('style');
        outputContainer.textContent = '';
        fileList.textContent = '';
        extractOption.value = 'all';
        extractSelectContainer.style.display = 'none';
        extractSelect.value = '';
        formatSelector.value = 'txt';
        format = 'txt';
    });

    // Assign function to search button
    const searchBtn = document.querySelector('.trigger-search');
    searchBtn.addEventListener('click', function () {
        if (!apiKey) {
            window.alert('You need to enter your API key to continue');
        } else {
            buildApiQuery();
        }
    });

    keywordsInput.addEventListener('keydown', function (e) {
        if (!apiKey) {
            window.alert('You need to enter your API key to continue');
        } else {
            if (e.key === 'Enter') {
                buildApiQuery();
            }
        }
    });

    urlInput.addEventListener('keydown', function (e) {
        if (!apiKey) {
            window.alert('You need to enter your API key to continue');
        } else {
            if (e.key === 'Enter') {
                buildApiQuery();
            }
        }
    });

    searchBtn.addEventListener('mousedown', () => {
        searchBtn.style.backgroundColor = '#666666';
    });
    searchBtn.addEventListener('mouseup', () => {
        searchBtn.removeAttribute('style');
    });
    resetFormBtn.addEventListener('mousedown', () => {
        resetFormBtn.style.backgroundColor = '#666666';
    });
    resetFormBtn.addEventListener('mouseup', () => {
        resetFormBtn.removeAttribute('style');
    });
    extractBtn.addEventListener('mousedown', () => {
        extractBtn.style.backgroundColor = '#666666';
    });
    extractBtn.addEventListener('mouseup', () => {
        extractBtn.removeAttribute('style');
    });

    // Function to build the query URL
    let queryUrl;
    let pagesTotal;
    let resultsTotal;
    let nextQueryUrl;
    let allWords;
    let anyWords;
    let exactPhrase;
    let noWords;
    let keywords;
    let paperTitle;
    let fromDate;
    let toDate;

    async function buildApiQuery() {
        resultsContainer.style.display = 'none';
        resultsOverview.textContent = '';
        extractContainer.style.display = 'none';
        outputContainer.textContent = '';
        outputContainer.style.display = 'none';
        const urlValue = urlInput.value;
        if (urlValue) {
            queryUrl = urlValue;
        } else {
            const baseUrl =
                'https://api.deutsche-digitale-bibliothek.de/search/index/newspaper-issues/select?';
            allWords = allWordsInput.value.replaceAll(' ', ' AND ');
            anyWords = anyWordsInput.value.replaceAll(' ', ' OR ');
            exactPhrase = exactPhraseInput.value;
            noWords = noWordsInput.value.replaceAll(' ', ' OR ');
            keywords = keywordsInput.value;
            paperTitle = paperTitleInput.value;
            fromDate = fromDateInput.value;
            toDate = toDateInput.value;

            queryUrl = baseUrl + 'q=plainpagefulltext:';
            if (searchType === 'expert') {
                if (!keywords) {
                    window.alert('Please enter keywords');
                    keywordsInput.focus();
                    return;
                }
                queryUrl = queryUrl + `(${keywords})`;
            } else if (searchType === 'guided') {
                let query;
                if (!allWords && !anyWords && !exactPhrase) {
                    window.alert('Please enter search terms');
                    allWordsInput.focus();
                    return;
                }
                if (allWords) {
                    query = `(${allWords})`;
                }
                if (anyWords) {
                    if (allWords) {
                        query = query + ' AND ';
                    }
                    query = query + `(${anyWords})`;
                }
                if (exactPhrase) {
                    if (allWords || anyWords) {
                        query = query + ' AND ';
                    }
                    query = query + `("${exactPhrase}")`;
                }
                if (noWords) {
                    if (allWords || anyWords || exactPhrase) {
                        query = query + ' NOT ';
                    }
                    query = query + `(${noWords})`;
                }
                queryUrl = queryUrl + `(${query})`;
            }
            if (paperTitle) {
                queryUrl = queryUrl + ' AND paper_title:(' + newsdesk + ')';
            }
            if (fromDate || toDate) {
                if (!fromDate) {
                    fromDate = '1600-01-01';
                }
                if (!toDate) {
                    const today = new Date();
                    toDate = today.toISOString().split('T')[0];
                }
                queryUrl =
                    queryUrl +
                    ` AND publication_date:[${fromDate} TO ${toDate}]`;
            }
            queryUrl = encodeURI(queryUrl);
        }
        const queryLink = document.createElement('a');
        queryLink.id = 'query-link';
        queryLink.textContent = queryUrl;
        queryUrlDiv.textContent = 'Query URL (click to copy): ';
        queryLink.addEventListener('click', () => {
            writeToClipboard(queryUrl);
            queryLink.style.color = 'green';
            setTimeout(() => {
                queryLink.textContent = queryUrl + '0';
                queryLink.removeAttribute('style');
            }, 1000);
        });
        queryUrlDiv.appendChild(queryLink);

        try {
            searchSpinner.style.display = 'inline-block';
            const queryResponse = await fetch(queryUrl, {
                method: 'GET',
                headers: {
                    accept: 'application/json',
                    Authorization: apiKey,
                },
            });
            console.log('Query response = ', queryResponse);
            if (queryResponse.status === 429) {
                window.alert('Too many requests. Try again later.');
                resultsOverview.textContent =
                    'Too many requests. Try again later.';
                resultsContainer.style.display = 'block';
                throw new Error('API rate limit reached');
            } else if (!queryResponse.ok) {
                window.alert('There was an error processing your query');
                throw new Error(
                    ('HTTP error: query responded with status ',
                    queryResponse.status)
                );
            } else if (queryResponse.ok) {
                const data = await queryResponse.json();
                const dataContent = data.response;
                resultsTotal = dataContent.numFound;
                pagesTotal = Math.ceil(resultsTotal / 10);
                resultsOverview.textContent = `${resultsTotal} result(s) found.`;
                resultsContainer.style.display = 'block';

                if (resultsTotal > 0) {
                    resultsOverview.append(' Begin extraction?');
                    searchContainer.style.display = 'none';
                    hideSearch.style.display = 'none';
                    showSearch.style.display = 'block';
                    resultsOverview.style.display = 'block';
                    resultsContainer.style.display = 'block';
                    extractContainer.style.display = 'block';
                } else {
                    resultsOverview.textContent =
                        'Query returned no result. Restart search.';
                    resultsOverview.style.display = 'block';
                    resultsContainer.style.display = 'block';
                    extractContainer.style.display = 'none';
                }
            }
        } catch (error) {
            console.error('There was an error getting results number: ', error);
        }
        searchSpinner.style.display = 'none';
    }

    function writeToClipboard(text) {
        const textarea = document.createElement('textarea');
        textarea.value = text;

        textarea.select();

        try {
            navigator.clipboard
                .writeText(textarea.value)
                .then(() => {
                    console.log('Text copied to clipboard:', text);
                })
                .catch((err) => {
                    console.error('Failed to copy text to clipboard:', err);
                });
        } catch (err) {
            console.error('Clipboard write operation not supported:', err);
        }
    }

    // Assign function to the output format selector
    let format = 'txt';
    formatSelector.addEventListener('change', function () {
        fileList.textContent = '';
        format = formatSelector.value;
    });

    // Assign function to the extract option selector
    extractOption.addEventListener('change', function () {
        outputContainer.textContent = '';
        dlContainer.style.display = 'none';
        extractBtn.style.display = 'block';
        fileList.textContent = '';
        if (extractOption.value === 'selection') {
            extractSelectContainer.style.display = 'inline';
        } else if (extractOption.value === 'all') {
            extractSelect.value = '';
            extractSelectContainer.style.display = 'none';
        }
    });

    // Assign function to the abort button
    let abort = false;
    const abortBtn = document.querySelector('.abort-button');
    abortBtn.addEventListener('click', function () {
        abort = true;
        abortBtn.textContent = 'Aborting...';
    });

    const processContainer = document.querySelector('#process-container');
    const outputContainer = document.querySelector('#output-container');
    const fileList = document.querySelector('#file-list');

    const dlContainer = document.getElementById('dl-container');
    const dlBtn = document.getElementById('dl-button');

    let articles = [];

    // Assign function to the extract button
    extractBtn.addEventListener('click', async function () {
        await extractArticles();
        processContainer.style.display = 'none';
        dlContainer.style.display = 'block';
    });

    extractSelect.addEventListener('keydown', async function (e) {
        if (isFinite(e.key)) {
            extractBtn.style.display = 'block';
            dlContainer.style.display = 'none';
        } else if (e.key === 'Enter') {
            extractBtn.style.display = 'none';
            await extractArticles();
            processContainer.style.display = 'none';
            dlContainer.style.display = 'block';
        }
    });

    // Function to extract results
    let rIndex = 1;

    async function extractArticles() {
        console.log('Firing extraction');
        articles = [];
        let ids = new Set();
        searchContainer.style.display = 'none';
        showSearch.style.display = 'block';
        hideSearch.style.display = 'none';
        abortBtn.style.display = 'inline';
        extractBtn.style.display = 'none';
        processContainer.textContent = '';
        outputContainer.textContent = '';
        fileList.textContent = '';
        extractSpinner.style.display = 'inline-block';
        rIndex = 1;
        let maxResults = extractSelect.value;
        if (!maxResults) {
            maxResults = resultsTotal;
        }
        let start = 0;
        let p = 1;
        while (rIndex <= maxResults) {
            await processPage(p);

            if (rIndex > maxResults) {
                break;
            }

            if (abort) {
                abortBtn.textContent = 'Abort';
                abortBtn.style.display = 'none';
                extractBtn.style.display = 'inline';
                abort = false;
                break;
            }
            p++;
        }
        async function processPage(p) {
            try {
                maxResults = Number(maxResults);
                pagesTotal = Math.ceil(maxResults / 10);
                processContainer.textContent = `Extracting page ${p} out of ${pagesTotal}...`;
                processContainer.style.display = 'block';
                nextQueryUrl = queryUrl + '&start=' + start;
                console.log('URL being processed: ', nextQueryUrl);
                const response = await fetch(nextQueryUrl, {
                    method: 'GET',
                    headers: {
                        accept: 'application/json',
                        Authorization: apiKey,
                    },
                });
                if (!response.ok) {
                    window.alert('Error fetching results');
                    throw new Error(
                        'HTTP error, could not fetch search results'
                    );
                }
                const data = await response.json();
                const dataContent = data.response;
                results = dataContent.docs;
                console.log(
                    'Number of results on page ' + p + ': ' + results.length
                );
                for (r of results) {
                    const date = r.publication_date.split('T')[0];
                    const id = r.id;
                    if (ids.has(id)) {
                        console.log('Already extracted this article, skipping');
                        continue;
                    }
                    ids.add(id);
                    const linkId = id.split('-')[0];
                    const pageNumber = r.pagenumber;
                    const link = `https://www.deutsche-digitale-bibliothek.de/newspaper/item/${linkId}?issuepage=${pageNumber}`;
                    const paperTitle = r.paper_title;
                    let text = r.plainpagefulltext;

                    let article = {};
                    article['article'] = {
                        paperTitle: `${paperTitle}`,
                        id: `${id}`,
                        pageNumber: `${pageNumber}`,
                        date: `${date}`,
                        text: `${text}`,
                        link: `${link}`,
                    };

                    articles.push(article);

                    rIndex++;
                    if (rIndex > maxResults) {
                        return;
                    }
                }
                start += 10;
            } catch (error) {
                console.error(error);
            }
        }

        outputContainer.textContent = `${articles.length} out of ${maxResults} articles extracted.`;
        outputContainer.style.display = 'block';
        abortBtn.style.display = 'none';

        extractSpinner.style.display = 'none';
    }

    dlBtn.addEventListener('mousedown', () => {
        dlBtn.style.backgroundColor = '#0a51c2';
    });
    dlBtn.addEventListener('mouseup', () => {
        dlBtn.removeAttribute('style');
    });

    dlBtn.addEventListener('click', () => {
        buildFiles();
    });

    // Function to build article files
    async function buildFiles() {
        const zip = new JSZip();
        const addedArticles = new Set();

        try {
            for (a of articles) {
                const paperTitle = a.article.paperTitle;
                const id = a.article.id;
                const date = a.article.date;
                const pageNumber = a.article.pageNumber;
                const text = a.article.text;
                const link = a.article.link;

                let fileContent;

                if (format === 'txt') {
                    fileContent = `${paperTitle}\n\n${id}\n\n${date}\n\n${text}`;
                }

                if (format === 'xml') {
                    let xmlpapertitle = paperTitle
                        .replaceAll('&', '&amp;')
                        .replaceAll('"', '&quot;');
                    let xmltext = text
                        .replaceAll('&', '&amp;')
                        .replaceAll('<', '&lt;')
                        .replaceAll('>', '&gt;')
                        .replaceAll('\n', '<lb></lb>');
                    fileContent = `<text source="${xmlpapertitle}" date="${date}" page_number="${pageNumber}">\n<ref target="${link}">Link to article</ref><lb></lb><lb></lb>${xmltext}<lb></lb></text>`;
                }

                if (format === 'ira') {
                    fileContent = `\n**** *source_${paperTitle
                        .replaceAll(/\p{P}/gu, ' ')
                        .trim()
                        .replaceAll(' ', '_')
                        .replaceAll('__', '_')} *date_${date} *pagenumber_${pagenumber}\n\n${text}`;
                }

                let ext = format;
                if (format === 'ira') {
                    ext = 'txt';
                }
                let baseFileName = `${date}_${paperTitle
                    .replaceAll(/\p{P}/gu, ' ')
                    .trim()
                    .replaceAll(' ', '_')
                    .replaceAll('__', '_')
                    .slice(0, 20)}.${ext}`;
                let index = 1;
                while (addedArticles.has(baseFileName)) {
                    baseFileName = `${date}_${paperTitle
                        .replaceAll(/\p{P}/gu, ' ')
                        .trim()
                        .replaceAll(' ', '_')
                        .replaceAll('__', '_')
                        .slice(0, 20)}_${index}.${ext}`;
                    index++;
                }

                addedArticles.add(baseFileName);

                zip.file(baseFileName, fileContent);
            }
        } catch (error) {
            console.error(error);
        }

        const zipBlob = await zip.generateAsync({
            type: 'blob',
        });

        const downloadedFiles = Array.from(addedArticles);
        fileList.textContent = `Files created: ${downloadedFiles
            .slice(0, 20)
            .join(', ')}...`;
        abortBtn.style.display = 'none';
        extractBtn.style.display = 'none';

        let searchTerm;
        const urlValue = urlInput.value;
        if (urlValue) {
            searchTerm = 'custom_search';
        } else if (searchType === 'expert') {
            searchTerm = keywords;
        } else if (searchType === 'guided') {
            searchTerm = allWords + ' ' + anyWords + ' ' + exactPhrase;
        }
        searchTerm = searchTerm
            .trim()
            .slice(0, 15)
            .replaceAll('"', '')
            .replaceAll(' ', '_');

        const zipFileName = `DZP_${searchTerm}_${format}_archive.zip`;
        await downloadZip(zipBlob, zipFileName);
    }

    // Function to download zip file
    async function downloadZip(zipBlob, zipFileName) {
        return new Promise((resolve, reject) => {
            if (typeof browser !== 'undefined' && browser.downloads) {
                browser.downloads
                    .download({
                        url: URL.createObjectURL(zipBlob),
                        filename: zipFileName,
                        saveAs: false,
                    })
                    .then((downloadItem) => {
                        if (downloadItem) {
                            resolve(zipFileName);
                        } else {
                            reject(
                                new Error(
                                    `Failed to initiate download for ${zipFileName}`
                                )
                            );
                        }
                    })
                    .catch(reject);
            } else if (typeof chrome !== 'undefined' && chrome.downloads) {
                chrome.downloads.download(
                    {
                        url: URL.createObjectURL(zipBlob),
                        filename: zipFileName,
                        saveAs: true,
                    },
                    (downloadId) => {
                        if (downloadId) {
                            resolve(zipFileName);
                        } else {
                            reject(
                                new Error(
                                    `Failed to initiate download for ${zipFileName}`
                                )
                            );
                        }
                    }
                );
            } else {
                reject(new Error('Download API not available'));
            }
        });
    }
});
