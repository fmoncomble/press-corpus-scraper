console.log('NYT API script loaded');

document.addEventListener('DOMContentLoaded', async function () {
    // Declare page elements
    const wrapper = document.querySelector('.wrapper');
    const apiKeyInput = document.querySelector('#apikey-input');
    const apiKeySaveBtn = wrapper.querySelector('button.save-apikey');
    const searchContainer = wrapper.querySelector('.search-container');
    const resultsContainer = document.querySelector('div#results-container');
    const queryUrlDiv = document.getElementById('query-url-div');
    const resultsOverview = document.querySelector('div#results-overview');
    const extractContainer = document.querySelector('div#extract-container');
    const extractionCounter = document.querySelector('div#extraction-counter');
    const formatSelector = document.querySelector('#format');
    const orderOption = document.querySelector('.order-option');
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

    // Create search form
    function initiateForm() {
        const initSearchContainer = searchContainer.cloneNode(true);
        initSearchContainer.id = 'search-container-1';
        let input = initSearchContainer.querySelector('.search-input');
        input.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                buildApiQuery();
            }
        });
        initSearchContainer.style.display = 'block';
        wrapper.appendChild(initSearchContainer);
        enableUpdateQuery(initSearchContainer);
    }
    initiateForm();

    // Assign function to reset button
    const resetFormBtn = document.querySelector('.reset-form');
    resetFormBtn.addEventListener('click', function () {
        urlInput.value = '';
        const searchContainerArray =
            wrapper.querySelectorAll('.search-container');
        for (i = 1; i < searchContainerArray.length; i++) {
            const searchContainer = searchContainerArray[i];
            searchContainer.remove();
        }
        orderOption.value = 'newest';
        searchSpinner.style.display = 'none';
        resultsContainer.style.display = 'none';
        processMsg.textContent = '';
        outputContainer.textContent = '';
        fileList.textContent = '';
        extractOption.value = 'all';
        extractSelectContainer.style.display = 'none';
        extractSelect.value = '';
        formatSelector.value = 'txt';
        format = 'txt';
        initiateForm();
        // enableUpdateQuery();
    });

    // Function to enable updating the type of query element based on the dropdown menu
    function enableUpdateQuery(searchContainer) {
        let booleanOpt = searchContainer.querySelector('.boolean');
        let queryType = searchContainer.querySelector('.query-type');
        let input = searchContainer.querySelector('.search-input');
        let newsDeskOpt = searchContainer.querySelector('.newsdesk-option');
        let sectionOpt = searchContainer.querySelector('.section-option');
        let tomOpt = searchContainer.querySelector('.tom-option');
        let removeBtn = searchContainer.querySelector('.remove-search-term');
        let addBtn = searchContainer.querySelector('.add-search-term');
        queryType.addEventListener('change', function () {
            let queryOption = queryType.value;
            let previousQueryOption =
                searchContainer.previousElementSibling.querySelector(
                    '.query-type'
                ).value;
            if (queryOption === 'fromDate' || queryOption === 'toDate') {
                input.style.display = 'inline';
                newsDeskOpt.style.display = 'none';
                sectionOpt.style.display = 'none';
                tomOpt.style.display = 'none';
                input.setAttribute('type', 'date');
                booleanOpt.selectedIndex = 1;
                booleanOpt.options[2].disabled = true;
                booleanOpt.options[3].disabled = true;
            } else if (queryOption === 'newsdesk') {
                if (queryOption === previousQueryOption) {
                    booleanOpt.options[1].disabled = true;
                    booleanOpt.options[2].disabled = false;
                    booleanOpt.selectedIndex = 2;
                    booleanOpt.options[3].disabled = true;
                } else {
                    booleanOpt.options[1].disabled = false;
                    booleanOpt.selectedIndex = 1;
                    booleanOpt.options[2].disabled = true;
                    booleanOpt.options[3].disabled = true;
                }
                input.style.display = 'none';
                newsDeskOpt.style.display = 'inline';
                sectionOpt.style.display = 'none';
                tomOpt.style.display = 'none';
            } else if (queryOption === 'section') {
                if (queryOption === previousQueryOption) {
                    booleanOpt.options[1].disabled = true;
                    booleanOpt.options[2].disabled = false;
                    booleanOpt.selectedIndex = 2;
                    booleanOpt.options[3].disabled = true;
                } else {
                    booleanOpt.options[1].disabled = false;
                    booleanOpt.selectedIndex = 1;
                    booleanOpt.options[2].disabled = true;
                    booleanOpt.options[3].disabled = true;
                }
                input.style.display = 'none';
                newsDeskOpt.style.display = 'none';
                sectionOpt.style.display = 'inline';
                tomOpt.style.display = 'none';
            } else if (queryOption === 'tom') {
                if (queryOption === previousQueryOption) {
                    booleanOpt.options[1].disabled = true;
                    booleanOpt.options[2].disabled = false;
                    booleanOpt.selectedIndex = 2;
                    booleanOpt.options[3].disabled = true;
                } else {
                    booleanOpt.options[1].disabled = false;
                    booleanOpt.selectedIndex = 1;
                    booleanOpt.options[2].disabled = true;
                    booleanOpt.options[3].disabled = true;
                }
                input.style.display = 'none';
                newsDeskOpt.style.display = 'none';
                sectionOpt.style.display = 'none';
                tomOpt.style.display = 'inline';
            } else if (queryOption === 'keywords') {
                input.style.display = 'inline';
                newsDeskOpt.style.display = 'none';
                sectionOpt.style.display = 'none';
                tomOpt.style.display = 'none';
                input.setAttribute('type', 'text');
                booleanOpt.options[1].disabled = false;
                booleanOpt.options[2].disabled = false;
                booleanOpt.options[3].disabled = false;
            }
        });
        addClickListener(addBtn, searchContainer, removeBtn, input);
    }

    // Function to add a click listener to the 'add search term' button
    // and assign a function to the 'add search term' button
    function addClickListener(addBtn, searchContainer, removeBtn, input) {
        addBtn.addEventListener('click', function addClick() {
            try {
                let newSearchContainer = searchContainer.cloneNode(true);
                wrapper.appendChild(newSearchContainer);
                newSearchContainer.style.display = 'block';
                const booleanOpt = newSearchContainer.querySelector('.boolean');
                booleanOpt.selectedIndex = 1;
                booleanOpt.style.display = 'block';
                addBtn.style.display = 'none';
                addBtn.removeEventListener('click', addClick);
                let input =
                    newSearchContainer.querySelector('input.search-input');
                input.addEventListener('keydown', (event) => {
                    if (event.key === 'Enter') {
                        buildApiQuery();
                    }
                });
                let searchContainerArray;
                let firstRmvBtn;
                let firstBooleanOpt;
                // Function to dynamically update the array of search containers
                function updateSearchContainerArray() {
                    searchContainerArray =
                        wrapper.querySelectorAll('.search-container');
                    firstRmvBtn = searchContainerArray[1].querySelector(
                        '.remove-search-term'
                    );
                    firstBooleanOpt =
                        searchContainerArray[1].querySelector('.boolean');
                }
                updateSearchContainerArray();
                const index = searchContainerArray.length - 1;
                newSearchContainer.id = 'search-container-' + index;
                if (firstRmvBtn.style.display === 'none') {
                    firstRmvBtn.style.display = 'inline';
                    firstRmvBtn.addEventListener('click', function rmv1st() {
                        searchContainerArray[1].remove();
                        firstRmvBtn.removeEventListener('click', rmv1st);
                        updateSearchContainerArray();
                        firstBooleanOpt.value = '';
                        firstBooleanOpt.style.display = 'none';
                        if (searchContainerArray.length === 2) {
                            firstRmvBtn.style.display = 'none';
                        }
                    });
                }
                removeBtn = newSearchContainer.querySelector(
                    'button.remove-search-term'
                );
                removeBtn.style.display = 'inline';
                removeBtn.addEventListener('click', function removeClick() {
                    try {
                        if (newSearchContainer === wrapper.lastElementChild) {
                            const previousSearchContainer =
                                newSearchContainer.previousElementSibling;
                            const previousAddBtn =
                                previousSearchContainer.querySelector(
                                    'button.add-search-term'
                                );
                            previousAddBtn.style.display = 'inline';
                            const previousRemoveBtn =
                                previousSearchContainer.querySelector(
                                    'button.remove-search-term'
                                );
                            const previousInput =
                                previousSearchContainer.querySelector(
                                    '.search-input'
                                );
                            addClickListener(
                                previousAddBtn,
                                previousSearchContainer,
                                previousRemoveBtn,
                                previousInput
                            );
                        }
                        input.value = '';
                        addBtn.removeEventListener('click', addClick);
                        removeBtn.removeEventListener('click', removeClick);
                        newSearchContainer.remove();
                        updateSearchContainerArray();
                        firstBooleanOpt.value = '';
                        firstBooleanOpt.style.display = 'none';
                        if (searchContainerArray.length === 2) {
                            firstRmvBtn.style.display = 'none';
                        }
                    } catch (error) {
                        console.error(error);
                    }
                });
                input.setAttribute('type', 'text');
                input.value = '';
                let selects = newSearchContainer.querySelectorAll(
                    'select.search-option'
                );
                selects.forEach((s) => {
                    s.style.display = 'none';
                });
                input.style.display = 'inline';
                enableUpdateQuery(newSearchContainer);
            } catch (error) {
                console.error(error);
            }
        });
    }

    // Ascribe function to search button
    const searchBtn = document.querySelector('.trigger-search');
    searchBtn.addEventListener('click', function () {
        if (!apiKey) {
            window.alert('You need to enter your API key to continue');
        } else {
            buildApiQuery();
        }
    });

    // Function to build the query URL
    let queryUrl;
    let pagesTotal;
    let resultsTotal;
    let nextQueryUrl;
    let keywords = '';
    let newsdesk = '';
    let section = '';
    let tom = '';
    let fromDate = '';
    let toDate = '';

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
            keywords = '';
            newsdesk = '';
            section = '';
            tom = '';
            fromDate = '';
            toDate = '';
            const searchContainers =
                wrapper.querySelectorAll('.search-container');
            searchContainers.forEach((sc) => {
                const queryType = sc.querySelector('.query-type').value;
                const input = sc.querySelector('.search-input').value;
                const newsdeskOpt = sc.querySelector('.newsdesk-option').value;
                const sectionOpt = sc.querySelector('.section-option').value;
                const tomOpt = sc.querySelector('.tom-option').value;
                const booleanOpt = sc.querySelector('.boolean').value;
                if (queryType === 'keywords') {
                    if (keywords) {
                        keywords = `${keywords} ${booleanOpt} ${input.trim()}`;
                        keywords = keywords.trim();
                    } else {
                        keywords = `${input.trim()}`;
                    }
                } else if (queryType === 'newsdesk') {
                    if (newsdesk) {
                        newsdesk = `${newsdesk} ${booleanOpt} "${newsdeskOpt}"`;
                    } else {
                        newsdesk = `"${newsdeskOpt}"`;
                    }
                } else if (queryType === 'section') {
                    if (section) {
                        section = `${section} ${booleanOpt} "${sectionOpt}"`;
                    } else {
                        section = `"${sectionOpt}"`;
                    }
                } else if (queryType === 'tom') {
                    if (tom) {
                        tom = `${tom} ${booleanOpt} "${tomOpt}"`;
                    } else {
                        tom = `"${tomOpt}"`;
                    }
                } else if (queryType === 'fromDate') {
                    fromDate = input.replaceAll('-', '');
                } else if (queryType === 'toDate') {
                    toDate = input.replaceAll('-', '');
                }
            });
            queryUrl = baseUrl + '&api-key=' + apiKey + '&fq=';
            if (keywords) {
                queryUrl = queryUrl + '(' + keywords + ')';
            }
            if (newsdesk) {
                if (keywords) {
                    queryUrl = queryUrl + ' AND ';
                }
                queryUrl = queryUrl + ' AND news_desk:(' + newsdesk + ')';
            }
            if (section) {
                if (newsdesk) {
                    queryUrl = queryUrl + ' AND ';
                }
                queryUrl = queryUrl + 'section_name:(' + section + ')';
            }
            if (tom) {
                if (newsdesk || section) {
                    queryUrl = queryUrl + ' AND ';
                }
                queryUrl = queryUrl + 'type_of_material:(' + tom + ')';
            }
            if (fromDate) {
                queryUrl = queryUrl + '&begin_date=' + fromDate;
            }
            if (toDate) {
                queryUrl = queryUrl + '&end_date=' + toDate;
            }
            queryUrl = queryUrl + '&sort=' + orderOption.value + '&page=';
            queryUrl = encodeURI(queryUrl);
            if (
                !keywords &&
                !newsdesk &&
                !tom &&
                !section &&
                !fromDate &&
                !toDate
            ) {
                window.alert('Please enter search terms');
                return;
            }
            const queryLink = document.createElement('a');
            queryLink.id = 'query-link';
            queryLink.setAttribute('href', queryUrl);
            queryLink.setAttribute('target', '_blank');
            queryLink.textContent = queryUrl + '0';
            queryUrlDiv.textContent = 'Query URL: ';
            queryUrlDiv.appendChild(queryLink);
        }

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
                resultsOverview.textContent = `${resultsTotal} results found.`;
                resultsContainer.style.display = 'block';

                if (resultsTotal > 0) {
                    if (resultsTotal > 1000) {
                        resultsOverview.append(
                            ' Only the first 1,000 results will be processed. Consider refining your search before continuing.'
                        );
                    } else {
                        resultsOverview.append(' Begin extraction?');
                    }
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

    // Assign function to the output format selector
    let format = 'txt';
    formatSelector.addEventListener('change', function () {
        outputContainer.textContent = '';
        fileList.textContent = '';
        if (formatSelector.value === 'xml') {
            format = 'xml';
        } else if (formatSelector.value === 'txt') {
            format = 'txt';
        }
    });

    // Assign function to the extract option selector
    extractOption.addEventListener('change', function () {
        outputContainer.textContent = '';
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

    // Assign function to the extract button
    extractBtn.addEventListener('click', function () {
        extractArticles();
    });

    extractSelect.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
            extractArticles();
        }
    });

    // Function to extract results
    let rIndex = 1;
    async function extractArticles() {
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
        const zip = new JSZip();
        const addedArticles = new Set();
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
                    console.log('Number of results: ', results.length);
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

                let fileAuthorName = authorName
                    .replaceAll(/\p{P}/gu, '')
                    .replaceAll(/\s/g, '_');
                let baseFileName = `${date}_${fileAuthorName}.${format}`;
                let index = 1;
                while (addedArticles.has(baseFileName)) {
                    baseFileName = `${date}_${fileAuthorName}_${index}.${format}`;
                    index++;
                }

                let fileContent = `${title}\n\n${authorName}\n\n${date}\n\n${subhed}\n\n${text}`;

                if (format === 'xml') {
                    let xmltitle = title
                        .replaceAll('&', '&amp;')
                        .replaceAll('"', '&quot;')
                        .replaceAll(/<.+?>/g, '')
                        .trim();
                    let xmlauthor = authorName
                        .replaceAll('&', '&amp;')
                        .replaceAll('"', '&quot;')
                        .trim();
                    let xmlsubhed = subhed.replaceAll('&', '&amp;').trim();
                    let xmltext = text
                        .replaceAll('&', '&amp;')
                        .replaceAll('<', '&lt;')
                        .replaceAll('>', '&gt;')
                        .replaceAll('\n', '<lb></lb>');
                    fileContent = `<text source="The New York Times" title="${xmltitle}" author="${xmlauthor}" date="${date}">\n<ref target="${link}">Link to article</ref><lb></lb><lb></lb>${xmlsubhed}<lb></lb><lb></lb>${xmltext}<lb></lb></text>`;
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

        processContainer.style.display = 'none';
        extractionCounter.textContent = '';
        let downloadedFiles = Array.from(addedArticles);
        outputContainer.style.display = 'block';
        outputContainer.textContent = `${downloadedFiles.length} out of ${maxResults} articles downloaded:\n\n`;
        listWrapper.style.display = 'block';
        fileList.textContent = `${downloadedFiles.slice(0, 20).join(', ')}...`;
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
        extractBtn.style.display = 'inline';

        const searchTerm = keywords.replaceAll('"', '').replaceAll(' ', '_');
        const zipFileName = `NYT_${searchTerm}_${format}_archive.zip`;
        await downloadZip(zipBlob, zipFileName);
        extractSpinner.style.display = 'none';
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
