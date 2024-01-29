console.log('Guardian API script loaded');

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
    const formatSelector = document.querySelector('#format');
    const orderOption = document.querySelector('.order-option');
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
        processContainer.textContent = '';
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
        let sectionOpt = searchContainer.querySelector('.section-option');
        let tagOpt = searchContainer.querySelector('.tag-option');
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
                sectionOpt.style.display = 'none';
                tagOpt.style.display = 'none';
                input.setAttribute('type', 'date');
                booleanOpt.selectedIndex = 1;
                booleanOpt.options[2].disabled = true;
                booleanOpt.options[3].disabled = true;
            } else if (queryOption === 'sections') {
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
                sectionOpt.style.display = 'inline';
                tagOpt.style.display = 'none';
            } else if (queryOption === 'tags') {
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
                sectionOpt.style.display = 'none';
                tagOpt.style.display = 'inline';
            } else if (queryOption === 'keywords') {
                input.style.display = 'inline';
                sectionOpt.style.display = 'none';
                tagOpt.style.display = 'none';
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
                input = newSearchContainer.querySelector('input.search-input');
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

    // Assign function to search button
    const searchBtn = document.querySelector('.trigger-search');
    searchBtn.addEventListener('click', function () {
        buildApiQuery();
    });

    // Function to build the query URL
    let queryUrl;
    let pagesTotal;
    let resultsTotal;
    let results;
    let nextQueryUrl;
    let keywords = '';
    let section = '';
    let tag = '';
    let fromDate = '';
    let toDate = '';

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
            keywords = '';
            section = '';
            tag = '';
            fromDate = '';
            toDate = '';
            const searchContainers =
                wrapper.querySelectorAll('.search-container');
            searchContainers.forEach((sc) => {
                const queryType = sc.querySelector('.query-type').value;
                const input = sc.querySelector('.search-input').value;
                const sectionOpt = sc.querySelector('.section-option').value;
                const tagOpt = sc.querySelector('.tag-option').value;
                const booleanOpt = sc.querySelector('.boolean').value;
                if (queryType === 'keywords') {
                    if (keywords) {
                        keywords = `${keywords} ${booleanOpt} ${input}`;
                        keywords = keywords.trim();
                    } else {
                        keywords = input.trim();
                    }
                } else if (queryType === 'sections') {
                    if (section) {
                        section = `${section} ${booleanOpt} ${sectionOpt}`;
                    } else {
                        section = sectionOpt;
                    }
                } else if (queryType === 'tags') {
                    if (tag) {
                        tag = `${tag} ${booleanOpt} ${tagOpt}`;
                    } else {
                        tag = tagOpt;
                    }
                } else if (queryType === 'fromDate') {
                    fromDate = input;
                } else if (queryType === 'toDate') {
                    toDate = input;
                }
            });
            queryUrl = baseUrl + '&api-key=' + apiKey;
            if (keywords) {
                queryUrl = queryUrl + '&q=' + keywords;
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
            if (!keywords && !tag && !section && !fromDate && !toDate) {
                window.alert('Please enter search terms');
                return;
            }
            const queryLink = document.createElement('a');
            queryLink.id = 'query-link';
            queryLink.setAttribute('href', queryUrl);
            queryLink.setAttribute('target', '_blank');
            queryLink.textContent = queryUrl;
            queryUrlDiv.textContent = 'Query URL: ';
            queryUrlDiv.appendChild(queryLink);
        }
        try {
            searchSpinner.style.display = 'inline-block';
            const response = await fetch(queryUrl);
            if (!response || !response.ok) {
                window.alert('Error fetching results');
                throw new Error('HTTP error, could not fetch search results');
            }
            const data = await response.json();
            const dataContent = data.response;
            pagesTotal = dataContent.pages;
            resultsTotal = dataContent.total;
            pageNo = dataContent.currentPage;
            resultsOverview.textContent = `Search returned ${resultsTotal} results over ${pagesTotal} pages.`;
            if (resultsTotal > 0) {
                resultsOverview.append(' Begin extraction?');
                resultsOverview.style.display = 'block';
                resultsContainer.style.display = 'block';
                extractContainer.style.display = 'block';
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
    const abortBtn = document.querySelector('.abort-button');
    abortBtn.addEventListener('click', function () {
        abort = true;
        abortBtn.textContent = 'Aborting...';
    });

    const processContainer = document.querySelector('#process-container');
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
        extractBtn.style.display = 'none';
        processContainer.textContent = '';
        outputContainer.textContent = '';
        fileList.textContent = '';
        extractSpinner.style.display = 'inline-block';
        const zip = new JSZip();
        const addedArticles = new Set();
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
                    const paragraphs = doc.querySelectorAll('p');
                    let text = '';
                    for (p of paragraphs) {
                        const pText = p.textContent;
                        text = text + `\n${pText}\n`;
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

                    let fileContent = `${title}\n\n${author}\n\n${date}\n\n${subhed}\n\n${text}`;

                    if (format === 'xml') {
                        let xmltitle = title
                            .replaceAll('&', '&amp;')
                            .replaceAll('"', '&quot;');
                        let xmlauthor = authorName
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

                    addedArticles.add(baseFileName);

                    zip.file(baseFileName, fileContent);

                    rIndex++;
                    if (rIndex > maxResults) {
                        return;
                    }
                }
            } catch (error) {
                console.error(error);
            }
        }

        const zipBlob = await zip.generateAsync({
            type: 'blob',
        });

        processContainer.style.display = 'none';
        const downloadedFiles = Array.from(addedArticles);
        outputContainer.textContent = `${downloadedFiles.length} out of ${maxResults} downloaded:\n\n`;
        fileList.textContent = `${downloadedFiles.slice(0, 20).join(', ')}...`;
        abortBtn.style.display = 'none';
        extractBtn.style.display = 'inline';

        const searchTerm = keywords.replaceAll('"', '').replaceAll(' ', '_');
        const zipFileName = `Guardian_${searchTerm}_${format}_archive.zip`;
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
