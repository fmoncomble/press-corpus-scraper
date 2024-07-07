console.log('FAZ API script loaded');

document.addEventListener('DOMContentLoaded', async function () {
    // Declare page elements
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
    const fromDateInput = document.getElementById('from-date');
    const toDateInput = document.getElementById('to-date');
    const includePaidCheckbox = document.getElementById('include-paid');
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
        processMsg.textContent = '';
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
    includePaidCheckbox.onchange = () => {
        includePaid = includePaidCheckbox.checked;
    }
    searchBtn.addEventListener('click', function () {
        console.log('Include premium? ', includePaid);
        if (includePaid) {
            const dialog = document.getElementById('dialog');
            const yesBtn = document.getElementById('yes-btn');
            const noBtn = document.getElementById('no-btn');
            yesBtn.onclick = () => {
                dialog.close();
                buildApiQuery();
            };
            noBtn.onclick = () => {
                chrome.tabs.create({ url: 'https://www.faz.net/aktuell/' });
                dialog.close();
                // return;
            };
            dialog.showModal();
        } else {
            buildApiQuery();
        }
    });

    keywordsInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
            if (includePaid) {
                const dialog = document.getElementById('dialog');
                const yesBtn = document.getElementById('yes-btn');
                const noBtn = document.getElementById('no-btn');
                yesBtn.onclick = () => {
                    dialog.close();
                    buildApiQuery();
                };
                noBtn.onclick = () => {
                    chrome.tabs.create({ url: 'https://www.faz.net/aktuell/' });
                    dialog.close();
                    // return;
                };
                dialog.showModal();
            } else {
                buildApiQuery();
            }
        }
    });

    urlInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
            if (includePaid) {
                const dialog = document.getElementById('dialog');
                const yesBtn = document.getElementById('yes-btn');
                const noBtn = document.getElementById('no-btn');
                yesBtn.onclick = () => {
                    dialog.close();
                    buildApiQuery();
                };
                noBtn.onclick = () => {
                    chrome.tabs.create({ url: 'https://www.faz.net/aktuell/' });
                    dialog.close();
                    // return;
                };
                dialog.showModal();
            } else {
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
    let page;
    let pagesTotal;
    let resultsTotal;
    let nextQueryUrl;
    let allWords;
    let anyWords;
    let exactPhrase;
    let noWords;
    let keywords;
    let fromDate;
    let toDate;
    let includePaid;

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
            const baseUrl = 'https://www.faz.net/api/faz-content-search?';
            allWords = allWordsInput.value.replaceAll(' ', '+');
            anyWords = anyWordsInput.value;
            exactPhrase = exactPhraseInput.value.replaceAll(' ', ' AND ');
            noWords = noWordsInput.value;
            keywords = keywordsInput.value;
            fromDate = fromDateInput.value;
            toDate = toDateInput.value;
            includePaid = includePaidCheckbox.checked;
            page = 1;

            queryUrl = baseUrl + 'paid_content=';
            if (includePaid) {
                queryUrl = queryUrl + 'include';
            } else {
                queryUrl = queryUrl + 'exclude';
            }
            queryUrl = queryUrl + '&q=';
            if (searchType === 'expert') {
                if (!keywords) {
                    window.alert('Please enter keywords');
                    keywordsInput.focus();
                    return;
                }
                keywords = keywords.replaceAll(/"(.+)\s(.+)"/gu, `($1 AND $2)`);
                queryUrl = queryUrl + `(${keywords})`;
            } else if (searchType === 'guided') {
                queryUrl += '(';
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
                    queryUrl = queryUrl + `(${exactPhrase})`;
                }
                if (noWords) {
                    if (allWords || anyWords || exactPhrase) {
                        queryUrl = queryUrl + ' -' + `(${noWords})`;
                    } else {
                        window.alert('You must specify positive seaarch terms');
                    }
                }
                queryUrl += ')';
            }
            if (orderOption.value === 'newest') {
                queryUrl = queryUrl + '&sort_by=date&sort_order=desc';
            } else if (orderOption.value === 'oldest') {
                queryUrl = queryUrl + '&sort_by=date&sort_order=asc';
            } else if (orderOption.value === 'rel') {
                queryUrl = queryUrl + '&sort_by=rel&sort_order=desc';
            }
            queryUrl += '&rows=100';
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
                const data = await queryResponse.json();
                resultsTotal = data.num_found;
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
        let rIndex = 1;
        let pIndex = 1;
        let maxResults = extractSelect.value;
        if (!maxResults) {
            maxResults = resultsTotal;
        }
        maxResults = Number(maxResults);
        pagesTotal = Math.ceil(maxResults / 100);
        processContainer.style.display = 'block';
        processMsg.style.display = 'block';

        try {
            let i = 1;
            queryUrl += '&page=';
            while (rIndex <= maxResults && pIndex <= resultsTotal) {
                await fetchResults(i);
                for (r of results) {
                    if (rIndex <= maxResults) {
                        try {
                            extractionCounter.textContent = `Processing result #${rIndex} out of ${maxResults}...`;
                            await processResult(r);
                            pIndex++;
                        } catch (error) {
                            console.log(error);
                        }
                    } else if (rIndex > maxResults || pIndex > resultsTotal) {
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
                i++;
            }

            async function fetchResults(i) {
                return new Promise(async (resolve, reject) => {
                    nextQueryUrl = queryUrl + i;
                    console.log('Processing query URL ', nextQueryUrl);
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
                        reject();
                        return;
                    } else if (!response.ok) {
                        reject();
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
                    const data = await response.json();
                    results = data.docs;
                    console.log('Results: ', results);
                    if (results.length === 0) {
                        reject();
                        return;
                    }
                    resolve();
                });
            }

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

            // Function to extract text and metadata from each result
            async function processResult(r) {
                const parser = new DOMParser();
                const id = r.doc_id;
                console.log('Processing article ID ', id);
                const date = r.date.split('T')[0];
                if (fromDate || toDate) {
                    const dateString = new Date(date);
                    const fromDateString = new Date(fromDate);
                    const toDateString = new Date(toDate);
                    if (
                        dateString < fromDateString ||
                        dateString > toDateString
                    ) {
                        console.log('Article not in date range');
                        return;
                    }
                }
                const link = r.canonical_url;
                const title = r.title;
                const subhed = r.teaser;
                let authorName = r.author;
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
                text = await getText();

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
                        return null;
                    }
                    const html = await response.text();
                    const doc = parser.parseFromString(html, 'text/html');
                    const body = doc.querySelector('article.article');
                    if (!body) {
                        console.error('No article content found for ', link);
                        noContentArticles.push(link);
                        return null;
                    }
                    const premiumBanner = doc.querySelector('div.paywall');
                    if (premiumBanner) {
                        if (!includePaid) {
                            console.log(id + 'is a premium article, skipping...');
                            premiumArticles.push(link);
                            return null;
                        } else {
                            pauseDiv.style.display = 'block';
                            premiumMsg.style.display = 'inline';
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
                            premiumMsg.style.display = 'none';
                        }
                    }
                    const regBanner = doc.querySelector('div.regwall');
                    if (regBanner) {
                        const regMsg = document.getElementById('reg-message');
                        pauseDiv.style.display = 'block';
                        regMsg.style.display = 'inline';
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
                        regMsg.style.display = 'none';
                    }
                    const paragraphs = body.querySelectorAll(
                        'p.body-elements__paragraph, h3.body-elements__subheading'
                    );

                    text = '';
                    for (p of paragraphs) {
                        const pText = p.textContent;
                        text = text + `\n${pText}\n`;
                    }
                    if (!text) {
                        console.error(id + ' has no text, skipping...');
                        noContentArticles.push(link);
                        return null;
                    }
                    return text;
                }

                if (!text) {
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
                rIndex++;
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
                    fileContent = `<text source="FAZ" title="${xmltitle}" author="${xmlauthor}" date="${date}">\n<ref target="${link}">Link to article</ref><lb></lb><lb></lb>${xmlsubhed}<lb></lb><lb></lb>${xmltext}<lb></lb></text>`;
                }

                if (format === 'ira') {
                    fileContent = `\n**** *source_faz *title_${title
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

        const zipFileName = `FAZ_${searchTerm}_${format}_archive.zip`;
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
