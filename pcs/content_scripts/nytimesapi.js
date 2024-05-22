console.log('NYT API script loaded');

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
    const newsdeskSelect = document.getElementById('newsdesk-option');
    const sectionSelect = document.getElementById('section-option');
    const tomSelect = document.getElementById('tom-option');
    const fromDateInput = document.getElementById('from-date');
    const toDateInput = document.getElementById('to-date');
    const resultsContainer = document.querySelector('div#results-container');
    const queryUrlDiv = document.getElementById('query-url-div');
    const resultsOverview = document.querySelector('div#results-overview');
    const extractContainer = document.querySelector('div#extract-container');
    const extractionCounter = document.querySelector('div#extraction-counter');
    const formatSelector = document.querySelector('#format');
    const orderOption = document.getElementById('order-option');
    const extractBtn = document.querySelector('.extract-button');
    const searchSpinner = document.querySelector('#search-spinner');
    const abortSearchBtn = document.querySelector('#abort-search-btn');
    const extractSpinner = document.querySelector('#extract-spinner');
    const urlInput = document.querySelector('.url-input');
    const extractOption = document.getElementById('extract-option');
    const extractSelectContainer = document.getElementById(
        'extract-select-container'
    );
    const extractSelect = document.getElementById('extract-select');
    const listWrapper = document.getElementById('list-wrapper');
    const premiumLinks = document.querySelector('ul#premium-links');
    const errorLinks = document.querySelector('ul#error-links');
    const noContentLinks = document.querySelector('ul#no-content-links');

    // Manage API key
    let apiKey;
    function getApiKey(callback) {
        chrome.storage.local.get(['nytimesapikey'], function (result) {
            const apiKey = result.nytimesapikey || '';
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
            chrome.storage.local.set({ nytimesapikey: apiKey }, function () {
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
            chrome.storage.local.remove('nytimesapikey', function () {
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
            ['nytimesapicallnb', 'nextResetTime'],
            function (result) {
                apiCallTotal = result.nytimesapicallnb;
                const now = new Date().getTime();
                const nextResetTime = result.nextResetTime || 0;

                if (now > nextResetTime) {
                    apiCallTotal = 500;
                    chrome.storage.local.set({
                        nytimesapicallnb: apiCallTotal,
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
        console.log('API counter updated');
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
        const searchInputs = searchContainer.querySelectorAll('input, select.search-option');
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
        processMsg.textContent = '';
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
    let newsdesk;
    let section;
    let tom;
    let fromDate;
    let toDate;

    async function buildApiQuery() {
        resultsContainer.style.display = 'none';
        abortSearchBtn.style.display = 'none';
        resultsOverview.textContent = '';
        extractContainer.style.display = 'none';
        outputContainer.textContent = '';
        outputContainer.style.display = 'none';
        listWrapper.style.display = 'none';
        const urlValue = urlInput.value;
        if (urlValue) {
            queryUrl = urlValue;
        } else {
            const baseUrl =
                'https://api.nytimes.com/svc/search/v2/articlesearch.json?';
            allWords = allWordsInput.value.replaceAll(' ', ' AND ');
            anyWords = anyWordsInput.value.replaceAll(' ', ' OR ');
            exactPhrase = exactPhraseInput.value;
            noWords = noWordsInput.value.replaceAll(' ', ' OR ');
            keywords = keywordsInput.value;
            newsdesk = newsdeskSelect.value;
            section = sectionSelect.value;
            tom = tomSelect.value;
            fromDate = fromDateInput.value;
            toDate = toDateInput.value;

            queryUrl = baseUrl + '&api-key=' + apiKey + '&fq=';
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
                        queryUrl = queryUrl + ' NOT ';
                    }
                    queryUrl = queryUrl + `(${noWords})`;
                }
            }
            if (newsdesk) {
                queryUrl = queryUrl + ' AND news_desk:(' + newsdesk + ')';
            }
            if (section) {
                queryUrl = queryUrl + ' AND section_name:(' + section + ')';
            }
            if (tom) {
                queryUrl = queryUrl + ' AND type_of_material:(' + tom + ')';
            }
            if (fromDate) {
                queryUrl = queryUrl + '&begin_date=' + fromDate;
            }
            if (toDate) {
                queryUrl = queryUrl + '&end_date=' + toDate;
            }
            queryUrl = queryUrl + '&sort=' + orderOption.value + '&page=';
            queryUrl = encodeURI(queryUrl);
        }
        const queryLink = document.createElement('a');
        queryLink.id = 'query-link';
        queryLink.textContent = queryUrl + '0';
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
            const queryResponse = await fetch(queryUrl);
            console.log('Query response = ', queryResponse);
            if (queryResponse.status === 429) {
                window.alert('You have reached your API rate limit');
                resultsOverview.textContent =
                    'API rate limit reached. Try again later.';
                resultsContainer.style.display = 'block';
                throw new Error('API rate limit reached');
            } else if (!queryResponse.ok) {
                window.alert('There was an error processing your query');
                throw new Error(
                    ('HTTP error: query responded with status ',
                    queryResponse.status)
                );
            } else if (queryResponse.ok) {
                apiCallTotal = apiCallTotal - 1;
                chrome.storage.local.set(
                    { nytimesapicallnb: apiCallTotal },
                    function () {
                        console.log('API calls left today: ', apiCallTotal);
                    }
                );
                updateApiCounter();
                const data = await queryResponse.json();
                const dataContent = data.response;
                resultsTotal = dataContent.meta.hits;
                resultsOverview.textContent = `${resultsTotal} result(s) found.`;
                resultsContainer.style.display = 'block';

                if (resultsTotal > 0) {
                    if (resultsTotal > 1000) {
                        const span = document.createElement('span');
                        span.textContent = 'refining your search';
                        span.addEventListener('click', () => {
                            searchContainer.style.display = 'block';
                            showSearch.style.display = 'none';
                            hideSearch.style.display = 'block';
                        });
                        span.style.fontWeight = 'bold';
                        span.style.textDecoration = 'underline';
                        span.style.cursor = 'pointer';
                        resultsOverview.append(
                            ' Only the first 1,000 results will be processed. Consider '
                        );
                        resultsOverview.append(span);
                        resultsOverview.append(' before continuing.');
                    } else {
                        resultsOverview.append(' Begin extraction?');
                    }
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
    const abortBtn = document.querySelector('#abort-extract-btn');
    abortBtn.addEventListener('click', function () {
        abort = true;
        abortBtn.textContent = 'Aborting...';
        console.log('Abort signal sent');
    });

    const processContainer = document.querySelector('#process-container');
    const processMsg = processContainer.querySelector('div#process-message');
    const outputContainer = document.querySelector('#output-container');
    const fileList = document.querySelector('#file-list');

    const dlContainer = document.getElementById('dl-container');
    const dlBtn = document.getElementById('dl-button');

    let articles = [];

    // Assign function to the extract button
    extractBtn.addEventListener('click', async function () {
        await extractArticles();
        extractBtn.style.display = 'none';
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
        abort = false;
        extractBtn.style.display = 'none';
        processMsg.textContent = '';
        outputContainer.textContent = '';
        fileList.textContent = '';
        premiumLinks.textContent = '';
        errorLinks.textContent = '';
        extractSpinner.style.display = 'inline-block';
        let results = [];
        const premiumArticles = [];
        const errorArticles = [];
        const noContentArticles = [];
        const retryArticles = [];
        rIndex = 1;
        let maxResults = extractSelect.value;
        if (!maxResults) {
            maxResults = resultsTotal;
        }
        maxResults = Number(maxResults);
        pagesTotal = Math.ceil(maxResults / 10);
        let fetchTime = (pagesTotal - 1) * 12;
        if (maxResults > 10) {
            processMsg.textContent = `Fetching ${maxResults} results: this should take approximately `;
        }
        processContainer.style.display = 'block';
        processMsg.style.display = 'block';
        const countdownDiv = document.createElement('div');
        processMsg.appendChild(countdownDiv);
        countdownDiv.style.display = 'inline';
        const countdown = setInterval(function () {
            let minutes = Math.floor(fetchTime / 60);
            let seconds = fetchTime % 60;
            if (seconds < 10) {
                seconds = '0' + seconds;
            }
            countdownDiv.textContent = minutes + ':' + seconds + '...';
            fetchTime = fetchTime - 1;
            if (fetchTime < 0) {
                clearInterval(countdown);
            }
        }, 1000);

        try {
            let i = 0;
            async function fetchResults(i) {
                return new Promise(async (resolve, reject) => {
                    nextQueryUrl = queryUrl + i;
                    const response = await fetch(nextQueryUrl);
                    if (response.status === 400) {
                        window.alert('Error fetching results');
                        reject(
                            new Error(
                                'HTTP error, could not fetch search results'
                            )
                        );
                        return;
                    } else if (response.status === 429) {
                        window.alert('You have reached your API rate limit');
                        resolve();
                        return;
                    } else if (!response.ok) {
                        resolve();
                        return;
                    } else if (abort) {
                        abortBtn.textContent = 'Abort';
                        abortBtn.style.display = 'none';
                        extractBtn.style.display = 'inline';
                        extractSpinner.style.display = 'none';
                        processMsg.textContent = '';
                        processContainer.style.display = 'none';
                        console.log('Fetch operation aborted');
                        resolve();
                        return;
                    }
                    apiCallTotal = apiCallTotal - 1;
                    chrome.storage.local.set(
                        { nytimesapicallnb: apiCallTotal },
                        function () {
                            console.log('API calls left today: ', apiCallTotal);
                        }
                    );
                    updateApiCounter();
                    const data = await response.json();
                    const dataContent = data.response;
                    results = results.concat(dataContent.docs);
                    if (results.length === 0) {
                        resolve();
                        return;
                    }
                    i++;
                    if (i < pagesTotal) {
                        setTimeout(async () => {
                            try {
                                await fetchResults(i);
                                resolve();
                            } catch (error) {
                                reject(error);
                            }
                        }, 12000);
                    } else {
                        resolve();
                    }
                });
            }

            await fetchResults(i);

            if (abort) {
                abortBtn.textContent = 'Abort';
                abortBtn.style.display = 'none';
                extractBtn.style.display = 'inline';
                extractSpinner.style.display = 'none';
                processMsg.textContent = '';
                processContainer.style.display = 'none';
                return;
            }

            processMsg.textContent =
                'Finished fetching results, now extracting...';

            for (r of results) {
                if (rIndex <= maxResults) {
                    try {
                        extractionCounter.textContent = `Processing result #${rIndex} out of ${maxResults}...`;
                        await new Promise((resolve) =>
                            setTimeout(resolve, 1000)
                        );
                        await processResult(r);
                        rIndex++;
                    } catch (error) {
                        console.log(error);
                    }
                } else if (rIndex > maxResults) {
                    break;
                }
                if (abort) {
                    abortBtn.textContent = 'Abort';
                    abortBtn.style.display = 'none';
                    extractBtn.style.display = 'inline';
                    extractSpinner.style.display = 'none';
                    console.log('Result extraction aborted');
                    break;
                }
            }

            // Function to extract text and metadata from each result
            async function processResult(r) {
                const parser = new DOMParser();
                const date = r.pub_date.split('T')[0];
                const link = r.web_url;
                const title = r.headline.main;
                const subhed = r.abstract;
                const byline = r.byline;
                let authors = byline.person;
                let authorName;
                authors.forEach((a) => {
                    const firstName = a.firstname;
                    const middleName = a.middlename;
                    const lastName = a.lastname;
                    let author;
                    if (middleName) {
                        author = firstName + ' ' + middleName + ' ' + lastName;
                    } else {
                        author = firstName + ' ' + lastName;
                    }
                    if (authorName) {
                        authorName = authorName + ' & ' + author;
                    } else {
                        authorName = author;
                    }
                });
                if (!authorName) {
                    authorName = 'unknown';
                }

                let text;
                const pauseDiv = document.querySelector('div#pause-message');
                const premiumMsg = document.querySelector(
                    'span#premium-message'
                );
                const pauseMsg = document.querySelector('span#confirm-message');
                const pauseLink = pauseDiv.querySelector('a#confirm-link');
                const resumeBtn = pauseDiv.querySelector('button#resume-btn');
                await getText();

                // Function to build text content
                async function getText() {
                    let response = await fetch(link);
                    if (response.status === 403) {
                        pauseLink.setAttribute('href', link);
                        pauseDiv.style.display = 'block';
                        pauseMsg.style.display = 'inline';
                        await new Promise((resolve) => {
                            resumeBtn.addEventListener(
                                'click',
                                async function resumeFetch() {
                                    response = await fetch(link);
                                    resumeBtn.removeEventListener(
                                        'click',
                                        resumeFetch
                                    );
                                    resolve();
                                }
                            );
                        });
                        pauseDiv.style.display = 'none';
                        pauseMsg.style.display = 'none';
                    } else if (!response.ok) {
                        console.error(
                            'Could not fetch article ' + link + ': status ',
                            response.status
                        );
                        errorArticles.push(link);
                        retryArticles.push(r);
                        return;
                    }
                    const html = await response.text();
                    const doc = parser.parseFromString(html, 'text/html');
                    const body = doc.querySelector(
                        'section[name="articleBody"]'
                    );
                    if (!body) {
                        console.error('No article content found for ', link);
                        noContentArticles.push(link);
                        return;
                    }
                    const paragraphs = body.querySelectorAll('p');

                    text = '';
                    for (p of paragraphs) {
                        const pText = p.textContent;
                        text = text + `\n${pText}\n`;
                    }
                }

                if (!text) {
                    return;
                } else if (
                    text &&
                    text.includes('Already a subscriber? Log in.')
                ) {
                    console.log('Login required');
                    pauseDiv.style.display = 'block';
                    premiumMsg.style.display = 'inline';
                    resumeBtn.style.display = 'inline';
                    await new Promise((resolve) => {
                        resumeBtn.addEventListener(
                            'click',
                            async function resumeFetch() {
                                // await getText();
                                results.push(r);
                                rIndex--;
                                console.log(
                                    'Skipping this one, will process later'
                                );
                                resumeBtn.removeEventListener(
                                    'click',
                                    resumeFetch
                                );
                                resolve();
                            }
                        );
                    });
                    pauseDiv.style.display = 'none';
                    premiumMsg.style.display = 'none';
                    return;
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

            }
        } catch (error) {
            console.error(error);
        }

        processContainer.style.display = 'none';
        extractionCounter.textContent = '';
        outputContainer.style.display = 'block';
        outputContainer.textContent = `${articles.length} out of ${maxResults} articles extracted.`;
        listWrapper.style.display = 'block';
        if (premiumArticles.length > 0) {
            try {
                const premiumList = document.querySelector('div#premium-list');
                const premiumNb = premiumList.querySelector('span#premium-nb');
                const showPremiumBtn = premiumList.querySelector(
                    'div#show-premium-list'
                );
                const hidePremiumBtn = premiumList.querySelector(
                    'div#hide-premium-list'
                );
                if (premiumArticles.length === 1) {
                    premiumNb.textContent =
                        premiumArticles.length + ' premium article';
                } else {
                    premiumNb.textContent =
                        premiumArticles.length + ' premium articles';
                }
                premiumArticles.forEach((link) => {
                    const li = document.createElement('li');
                    const a = document.createElement('a');
                    a.setAttribute('href', link);
                    a.setAttribute('target', '_blank');
                    a.textContent = link;
                    li.appendChild(a);
                    premiumLinks.appendChild(li);
                });
                premiumList.style.color = '#ff9900';
                premiumList.style.display = 'block';
                showPremiumBtn.addEventListener('click', () => {
                    premiumLinks.style.display = 'block';
                    hidePremiumBtn.style.display = 'inline';
                    showPremiumBtn.style.display = 'none';
                });
                hidePremiumBtn.addEventListener('click', () => {
                    premiumLinks.style.display = 'none';
                    hidePremiumBtn.style.display = 'none';
                    showPremiumBtn.style.display = 'inline';
                });
            } catch (error) {
                console.error(error);
            }
        }
        if (errorArticles.length > 0) {
            try {
                const errorList = document.querySelector('div#error-list');
                const errorNb = document.querySelector('span#error-nb');
                const showBtn = document.querySelector('div#show-list');
                const hideBtn = document.querySelector('div#hide-list');
                showBtn.addEventListener('click', () => {
                    errorLinks.style.display = 'block';
                    hideBtn.style.display = 'inline';
                    showBtn.style.display = 'none';
                });
                hideBtn.addEventListener('click', () => {
                    errorLinks.style.display = 'none';
                    hideBtn.style.display = 'none';
                    showBtn.style.display = 'inline';
                });
                if (errorArticles.length === 1) {
                    errorNb.textContent = errorArticles.length + ' result';
                } else {
                    errorNb.textContent = errorArticles.length + ' results';
                }
                errorArticles.forEach((link) => {
                    const li = document.createElement('li');
                    const a = document.createElement('a');
                    a.setAttribute('href', link);
                    a.setAttribute('target', '_blank');
                    a.textContent = link;
                    li.appendChild(a);
                    errorLinks.appendChild(li);
                });
                errorList.style.color = '#cc0000';
                errorList.style.display = 'block';
            } catch (error) {
                console.error(error);
            }
        }
        if (noContentArticles.length > 0) {
            try {
                const noContentList = document.querySelector(
                    'div#no-content-list'
                );
                const noContentNb =
                    document.querySelector('span#no-content-nb');
                const showBtn = document.querySelector('div#show-nc-list');
                const hideBtn = document.querySelector('div#hide-nc-list');
                showBtn.addEventListener('click', () => {
                    noContentLinks.style.display = 'block';
                    hideBtn.style.display = 'inline';
                    showBtn.style.display = 'none';
                });
                hideBtn.addEventListener('click', () => {
                    noContentLinks.style.display = 'none';
                    hideBtn.style.display = 'none';
                    showBtn.style.display = 'inline';
                });
                if (noContentArticles.length === 1) {
                    noContentNb.textContent =
                        noContentArticles.length + ' result';
                } else {
                    noContentNb.textContent =
                        noContentArticles.length + ' results';
                }
                noContentArticles.forEach((link) => {
                    const li = document.createElement('li');
                    const a = document.createElement('a');
                    a.setAttribute('href', link);
                    a.setAttribute('target', '_blank');
                    a.textContent = link;
                    li.appendChild(a);
                    noContentLinks.appendChild(li);
                });
                noContentList.style.color = '#cc0000';
                noContentList.style.display = 'block';
            } catch (error) {
                console.error(error);
            }
        }
        abortBtn.style.display = 'none';
        extractSpinner.style.display = 'none';
    }

    dlBtn.addEventListener('mousedown', () => {
        dlBtn.style.backgroundColor = '#666666';
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
                    fileContent = `<text source="The New York Times" title="${xmltitle}" author="${xmlauthor}" date="${date}">\n<ref target="${link}">Link to article</ref><lb></lb><lb></lb>${xmlsubhed}<lb></lb><lb></lb>${xmltext}<lb></lb></text>`;
                }

                if (format === 'ira') {
                    fileContent = `\n**** *source_nyt *title_${title
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

        const zipFileName = `NYT_${searchTerm}_${format}_archive.zip`;
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
