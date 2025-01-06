console.log('Guardian API script loaded');

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
    const sectionSelect = document.getElementById('section-option');
    const tagSelect = document.getElementById('tag-option');
    const fromDateInput = document.getElementById('from-date');
    const toDateInput = document.getElementById('to-date');
    const resultsContainer = document.querySelector('div#results-container');
    const queryUrlDiv = document.getElementById('query-url-div');
    const resultsOverview = document.querySelector('div#results-overview');
    const extractContainer = document.querySelector('div#extract-container');
    const formatSelector = document.querySelector('#format');
    const orderOption = document.getElementById('order-option');
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
        chrome.storage.local.get(['guardianapikey'], function (result) {
            const apiKey = result.guardianapikey || '';
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
            chrome.storage.local.set({ guardianapikey: apiKey }, function () {
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
            chrome.storage.local.remove('guardianapikey', function () {
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

    // Manage API rate limit
    let apiCallTotal;
    function getApiCallTotal(callback) {
        chrome.storage.local.get(
            ['guardianapicallnb', 'nextResetTime'],
            function (result) {
                apiCallTotal = result.guardianapicallnb || 500;
                const now = new Date().getTime();
                const nextResetTime = result.nextResetTime || 0;
                console.log('Time to next reset: ', nextResetTime - now);

                if (now > nextResetTime) {
                    apiCallTotal = 500;
                    chrome.storage.local.set({
                        guardianapicallnb: apiCallTotal,
                        nextResetTime: getNextMidnightTime(),
                    });
                    console.log('Number of API calls available reset to 500');
                }
                callback(apiCallTotal);
            }
        );
    }

    function getNextMidnightTime() {
        const now = new Date();
        const nextMidnight = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate() + 1
        );
        return nextMidnight.getTime();
    }

    getApiCallTotal(function (callResult) {
        apiCallTotal = callResult;
        if (apiCallTotal) {
            console.log('API calls left today: ', apiCallTotal);
        }
        updateApiCounter();
    });

    chrome.storage.local.get('nextResetTime', function (result) {
        if (!result.nextResetTime) {
            chrome.storage.local.set({ nextResetTime: getNextMidnightTime() });
        }
    });

    const apiCounter = document.querySelector('span#api-counter');
    function updateApiCounter() {
        console.log('API counter updated: ', apiCallTotal);
        apiCounter.textContent = apiCallTotal;
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
        orderOption.value = 'newest';
        searchSpinner.style.display = 'none';
        resultsContainer.style.display = 'none';
        extractContainer.style.display = 'none';
        extractBtn.removeAttribute('style');
        processContainer.textContent = '';
        outputContainer.textContent = '';
        dlContainer.style.display = 'none';
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
        searchBtn.style.backgroundColor = '#0a51c2';
    });
    searchBtn.addEventListener('mouseup', () => {
        searchBtn.removeAttribute('style');
    });
    resetFormBtn.addEventListener('mousedown', () => {
        resetFormBtn.style.backgroundColor = '#0a51c2';
    });
    resetFormBtn.addEventListener('mouseup', () => {
        resetFormBtn.removeAttribute('style');
    });
    extractBtn.addEventListener('mousedown', () => {
        extractBtn.style.backgroundColor = '#0a51c2';
    });
    extractBtn.addEventListener('mouseup', () => {
        extractBtn.removeAttribute('style');
    });

    // Function to build the query URL
    let queryUrl;
    let pagesTotal;
    let resultsTotal;
    let results;
    let nextQueryUrl;
    let allWords;
    let anyWords;
    let exactPhrase;
    let noWords;
    let keywords;
    let section;
    let tag;
    let fromDate;
    let toDate;

    async function buildApiQuery() {
        resultsContainer.style.display = 'none';
        processContainer.textContent = '';
        outputContainer.textContent = '';
        fileList.textContent = '';
        const urlValue = urlInput.value;
        if (urlValue) {
            queryUrl = urlValue;
        } else {
            const baseUrl =
                'https://content.guardianapis.com/search?page-size=50';
            allWords = allWordsInput.value.replaceAll(' ', ' AND ');
            anyWords = anyWordsInput.value.replaceAll(' ', ' OR ');
            exactPhrase = exactPhraseInput.value;
            noWords = noWordsInput.value.replaceAll(' ', ' OR ');
            keywords = keywordsInput.value;
            section = sectionSelect.value;
            tag = tagSelect.value;
            fromDate = fromDateInput.value;
            toDate = toDateInput.value;

            queryUrl = baseUrl + '&api-key=' + apiKey + '&q=';
            if (searchType === 'expert') {
                if (!keywords) {
                    window.alert('Please enter keywords');
                    keywordsInput.focus();
                    return;
                }
                queryUrl = queryUrl + `(${keywords})`;
            } else if (searchType === 'guided') {
                if (!allWords && !anyWords && !exactPhrase) {
                    window.alert('Please enter search terms');
                    allWordsInput.focus();
                    return;
                }
                if (allWords) {
                    queryUrl = queryUrl + `(${allWords})`;
                }
                if (anyWords) {
                    if (allWords) {
                        queryUrl = queryUrl + ' AND ';
                    }
                    queryUrl = queryUrl + `(${anyWords})`;
                }
                if (exactPhrase) {
                    if (allWords || anyWords) {
                        queryUrl = queryUrl + ' AND ';
                    }
                    queryUrl = queryUrl + `("${exactPhrase}")`;
                }
                if (noWords) {
                    if (allWords || anyWords || exactPhrase) {
                        queryUrl = queryUrl + ' AND NOT ';
                    }
                    queryUrl = queryUrl + `(${noWords})`;
                }
            }
            if (section) {
                queryUrl = queryUrl + '&section=' + section;
            }
            if (tag) {
                queryUrl = queryUrl + '&tag=' + tag;
            }
            if (fromDate) {
                queryUrl = queryUrl + '&from-date=' + fromDate;
            }
            if (toDate) {
                queryUrl = queryUrl + '&to-date=' + toDate;
            }
            queryUrl =
                queryUrl +
                '&show-fields=headline,standfirst,trailText,body,byline&show-tags=contributor&order-by=' +
                orderOption.value;
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
                queryLink.removeAttribute('style');
            }, 1000);
        });
        queryUrlDiv.appendChild(queryLink);
        try {
            searchSpinner.style.display = 'inline-block';
            const response = await fetch(queryUrl);
            if (response.status === 429) {
                window.alert('You have reached your API rate limit');
                resultsOverview.textContent =
                    'API rate limit reached. Try again later.';
                resultsContainer.style.display = 'block';
                throw new Error('API rate limit reached');
            } else if (!response || !response.ok) {
                window.alert('Error fetching results');
                throw new Error('HTTP error, could not fetch search results');
            } else if (response.ok) {
                apiCallTotal = apiCallTotal - 1;
                chrome.storage.local.set(
                    { guardianapicallnb: apiCallTotal },
                    function () {
                        console.log('API calls left today: ', apiCallTotal);
                    }
                );
                updateApiCounter();
            }
            const data = await response.json();
            const dataContent = data.response;
            pagesTotal = dataContent.pages;
            resultsTotal = dataContent.total;
            pageNo = dataContent.currentPage;
            resultsOverview.textContent = `Search returned ${resultsTotal} result(s) over ${pagesTotal} page(s).`;
            if (resultsTotal > 0) {
                resultsOverview.append(' Begin extraction?');
                resultsOverview.style.display = 'block';
                resultsContainer.style.display = 'block';
                extractContainer.style.display = 'block';
                searchContainer.style.display = 'none';
                hideSearch.style.display = 'none';
                showSearch.style.display = 'block';
            } else {
                resultsOverview.append(' Restart search.');
                resultsOverview.style.display = 'block';
                resultsContainer.style.display = 'block';
                extractContainer.style.display = 'none';
            }
            searchSpinner.style.display = 'none';
        } catch (error) {
            console.error(error);
        }
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
        // extractBtn.style.display = 'none';
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
        articles = [];
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
        for (let p = 1; p <= pagesTotal; p++) {
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
        }
        async function processPage(p) {
            try {
                maxResults = Number(maxResults);
                pagesTotal = Math.ceil(maxResults / 50);
                processContainer.textContent = `Extracting page ${p} out of ${pagesTotal}...`;
                processContainer.style.display = 'block';
                nextQueryUrl = queryUrl + '&page=' + p;
                const response = await fetch(nextQueryUrl);
                if (!response.ok) {
                    window.alert('Error fetching results');
                    throw new Error(
                        'HTTP error, could not fetch search results'
                    );
                } else if (response.ok) {
                    apiCallTotal = apiCallTotal - 1;
                    chrome.storage.local.set(
                        { guardianapicallnb: apiCallTotal },
                        function () {
                            console.log('API calls left today: ', apiCallTotal);
                        }
                    );
                    updateApiCounter();
                }
                const data = await response.json();
                const dataContent = data.response;
                results = dataContent.results;
                for (r of results) {
                    const parser = new DOMParser();
                    const fields = r.fields;
                    const date = r.webPublicationDate.split('T')[0];
                    const link = r.webUrl;
                    const title = fields.headline;
                    let rawSubhed = fields.standfirst;
                    let subhedHtml;
                    let subhed;
                    if (!rawSubhed) {
                        rawSubhed = fields.trailText;
                    }
                    if (rawSubhed) {
                        subhedHtml = parser.parseFromString(
                            rawSubhed,
                            'text/html'
                        );
                        if (subhedHtml) {
                            subhed = subhedHtml.body.textContent.replaceAll(
                                /<.+?>/g,
                                ' '
                            );
                        } else {
                            subhed = rawSubhed;
                        }
                    } else {
                        subhed = ' ';
                    }

                    let author = fields.byline;
                    let authorName;
                    if (author) {
                        let authorArray = author.split(' and ');
                        if (authorArray) {
                            for (author of authorArray) {
                                if (!authorName) {
                                    authorName = author.split(' in ')[0].trim();
                                } else {
                                    authorName = `${authorName} & ${author
                                        .split(' in ')[0]
                                        .trim()}`;
                                }
                            }
                        }
                        authorName = authorName.trim();
                    } else if (!author) {
                        let authors = r.tags;
                        if (authors.length > 0) {
                            for (a of authors) {
                                let firstName = a.firstName;
                                let lastName = a.lastName;
                                if (!authorName) {
                                    authorName = firstName + ' ' + lastName;
                                } else {
                                    authorName =
                                        authorName +
                                        ' & ' +
                                        firstName +
                                        ' ' +
                                        lastName;
                                }
                            }
                        }
                    }
                    if (!authorName) {
                        authorName = 'unknown';
                    }

                    let textHtml = fields.body;
                    const doc = parser.parseFromString(textHtml, 'text/html');
                    const paragraphs = doc.querySelectorAll('p, h2');
                    let text = '';
                    for (p of paragraphs) {
                        const pText = p.textContent;
                        text = text + `\n${pText}\n`;
                    }

                    let article = {};
                    article['article'] = {
                        title: `${title}`,
                        author: `${authorName}`,
                        date: `${date}`,
                        subhed: `${subhed}`,
                        text: `${text}`,
                        link: `${link}`,
                    };

                    articles.push(article);

                    rIndex++;
                    if (rIndex > maxResults) {
                        return;
                    }
                }
            } catch (error) {
                console.error(error);
            }
        }

        outputContainer.textContent = `${articles.length} out of ${maxResults} articles extracted.`;
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
                const title = a.article.title;
                const author = a.article.author;
                const date = a.article.date;
                const subhed = a.article.subhed;
                const text = a.article.text;
                const link = a.article.link;

                let fileContent;

                if (format === 'txt') {
                    fileContent = `${title}\n\n${author}\n\n${date}\n\n${subhed}\n\n${text}`;
                }

                if (format === 'xml') {
                    let xmltitle = title
                        .replaceAll('&', '&amp;')
                        .replaceAll('"', '&quot;');
                    let xmlauthor = author
                        .replaceAll('&', '&amp;')
                        .replaceAll('"', '&quot;');
                    let xmlsubhed = subhed.replaceAll('&', '&amp;');
                    let xmltext = text
                        .replaceAll('&', '&amp;')
                        .replaceAll('<', '&lt;')
                        .replaceAll('>', '&gt;')
                        .replaceAll('\n', '<lb></lb>');
                    fileContent = `<text source="The Guardian" title="${xmltitle}" author="${xmlauthor}" date="${date}">\n<ref target="${link}">Link to article</ref><lb></lb><lb></lb>${xmlsubhed}<lb></lb><lb></lb>${xmltext}<lb></lb></text>`;
                }

                if (format === 'ira') {
                    fileContent = `\n**** *source_guardian *title_${title
                        .replaceAll(/\p{P}/gu, ' ')
                        .trim()
                        .replaceAll(/\s/g, '_')
                        .replaceAll('__', '_')} *author_${author
                        .replaceAll(/\p{P}/gu, ' ')
                        .trim()
                        .replaceAll(/\s/g, '_')
                        .replaceAll(
                            '__',
                            '_'
                        )} *date_${date}\n\n${subhed}\n\n${text}`;
                }

                let fileAuthorName = author
                    .replaceAll(/\p{P}/gu, '')
                    .replaceAll(/\s/g, '_');
                let ext = format;
                if (format === 'ira') {
                    ext = 'txt';
                }
                let baseFileName = `${date}_${fileAuthorName.slice(
                    0,
                    20
                )}.${ext}`;
                let index = 1;
                while (addedArticles.has(baseFileName)) {
                    baseFileName = `${date}_${fileAuthorName}_${index}.${ext}`;
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

        const zipFileName = `Guardian_${searchTerm}_${format}_archive.zip`;
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
