let url;
let doc;
let pageNo;
let pubNameDef;
let searchTerm;
let abortExtraction;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'performExtraction') {
        try {
            console.log('Message from content script: ', message);
            url = message.url;
            selectedFormat = message.format;
            extractAll = message.extractAll;
            console.log('Extract all? ', extractAll);
            paperName = message.paperName;
            aboBtnDef = message.aboBtnDef;
            searchTerm = message.searchTerm;
            resultsNumber = message.resultsNumber;
            resultsNumberPerPageDef = message.resultsNumberPerPageDef;
            articleListDef = message.articleListDef;
            articlesDef = message.articlesDef;
            articleHeaderDef = message.articleHeaderDef;
            pubNameDef = message.pubNameDef;
            premiumBannerDef = message.premiumBannerDef;
            titleDivDef = message.titleDivDef;
            euroLinkDef = message.euroLinkDef;
            euroLinkAttribute = message.euroLinkAttribute;
            subhedDivDef = message.subhedDivDef;
            bodyDivDef = message.bodyDivDef;
            authorElementDef = message.authorElementDef;
            dateLogic = message.dateLogic;
            dateElementDef = message.dateElementDef;
            dateAttributeDef = message.dateAttributeDef;
            dateStringDef = message.dateStringDef;
            textElementsDef = message.textElementsDef;
            exclElementsText = message.exclElementsText;
            exclElementsDef = message.exclElementsDef;
            nextPageDef = message.nextPageDef;
            pageParam = message.pageParam;
            firstPage = message.firstPage;
            nextButtonDef = message.nextButtonDef;
            console.log('Output format: ' + selectedFormat);
            performExtractAndSave(url)
                .then((results) => {
                    sendResponse({
                        success: true,
                        fetchedUrls: results[0],
                        downloadedFiles: results[1],
                        skippedFiles: results[2],
                        skippedTitles: results[3],
                        errorFiles: results[4],
                        errorMessages: results[5],
                    });
                })
                .catch((error) => {
                    console.error('Error:', error);
                    sendResponse({
                        success: false,
                        error: 'An error occurred',
                    });
                });

            return true; // Indicate that sendResponse will be called asynchronously
        } catch (error) {
            console.error('Error:', error);
            sendResponse({
                success: false,
                error: 'An error occurred',
            });
        }
    } else if (message.action === 'abortExtraction') {
        abortExtraction = true;
    }
});

async function performExtractAndSave(url) {
    console.log('First page no = ', firstPage);
    if (typeof firstPage !== 'undefined') {
        pageNo = firstPage;
        console.log('First page is defined -> ', pageNo);
    } else {
        pageNo = 1;
        console.log('First page is not defined -> ', pageNo);
    }
    abortExtraction = false;
    const parser = new DOMParser();
    let nextUrl;
    console.log(
        'Pagination logic: page number? ' +
            nextPageDef +
            ' / Next button? ' +
            nextButtonDef
    );
    if (nextPageDef) {
        const pageQuery = url.split(`${pageParam}=`)[1];
        const queryString = url.split('?')[1];
        if (pageQuery) {
            console.log('Query string exists and already includes page number');
            if (extractAll) {
                const baseQuery = url.split('page')[0];
                nextUrl = baseQuery + `${pageParam}=${pageNo}`;
            } else {
                nextUrl = url;
            }
        } else if (queryString) {
            console.log(
                'Query string = ' + queryString + '. Appending page number'
            );
            nextUrl = url + `&${pageParam}=` + pageNo;
        } else if (!queryString) {
            console.log('No existing query string, creating');
            nextUrl = url + `?${pageParam}=` + pageNo;
        }
    } else if (nextButtonDef) {
        nextUrl = url;
    }

    const zip = new JSZip();
    const fetchedUrls = new Set();
    const addedFileNames = new Set();
    const skippedFiles = [];
    const skippedTitles = [];
    const errorFiles = [];
    const errorMessages = [];

    loop: while (nextUrl) {
        try {
            console.log('Search page URL = ' + nextUrl);
            let articles;

            for (let i = 1; i <= 3; i++) {
                console.log(
                    'Attempt #' + i + ' to fetch articles at ' + nextUrl
                );
                const response = await fetch(nextUrl);
                const html = await response.text();
                doc = parser.parseFromString(html, 'text/html');
                console.log('Search page structure: ', doc);

                let articleList = doc.querySelector(articleListDef);
                if (!articleList) {
                    throw new Error('Article list not found');
                } else if (articleList) {
                    console.log('Article list: ', articleList);
                    articles = articleList.querySelectorAll(articlesDef);
                }

                if (articles.length >= 1) {
                    console.log(
                        'Articles found on attempt #' + i + '!',
                        articles
                    );
                    break;
                } else {
                    console.log(
                        'No articles found on attempt #' + i + ', trying again'
                    );
                }

                await new Promise((resolve) => setTimeout(resolve, 1000));
            }

            if (articles.length === 0) {
                console.log('Last article reached');
                break loop;
            }

            let resultsPageNumber;
            if (resultsNumber) {
                resultsNumber = Number(resultsNumber);
                resultsPageNumber = Math.ceil(
                    resultsNumber / resultsNumberPerPageDef
                );
            }

            let sentPageNo;
            if (typeof firstPage !== 'undefined' && firstPage === 0) {
                sentPageNo = pageNo + 1;
            } else {
                sentPageNo = pageNo;
            }

            function sendRange() {
                console.log('sendRange function invoked');
                let currentTab;
                chrome.tabs.query(
                    { active: true, currentWindow: true },
                    function (tabs) {
                        currentTab = tabs[0];

                        let port = chrome.tabs.connect(currentTab.id, {
                            name: 'backgroundjs',
                        });
                        console.log('PageNo sent: ', sentPageNo);
                        port.postMessage({
                            sentPageNo,
                            resultsPageNumber,
                        });
                        pageNo += 1;
                    }
                );
            }

            sendRange();

            const nextUrlURL = new URL(nextUrl);
            console.log('URL origin: ', nextUrlURL.origin);
            const urls = Array.from(articles)
                .map(function (p) {
                    let articleAnchor = p.querySelector('a');
                    if (!articleAnchor) {
                        return null;
                    }
                    let articleUrl = articleAnchor.getAttribute('href');
                    if (!articleUrl.startsWith('http')) {
                        articleUrl = nextUrlURL.origin + articleUrl;
                    }
                    console.log('Article URL: ', articleUrl);
                    return new URL(articleUrl).href;
                })
                .filter((url) => url !== null);
            console.log('Article URLs: ', urls);

            await Promise.all(
                urls.map(async (url) => {
                    try {
                        let errorMessage;

                        const contentResponse = await fetch(url);
                        console.log('Content response: ', contentResponse);
                        console.log('Article URL = ', contentResponse.url);
                        if (!contentResponse.ok) {
                            errorMessage =
                                ' (' +
                                url.substring(0, 20) +
                                '... ne répond pas.)';
                            errorFiles.push(url);
                            errorMessages.push(errorMessage);
                            console.error(url + errorMessage);
                            throw new Error(errorMessage);
                        }
                        const content = await contentResponse.text();
                        const contentDoc = parser.parseFromString(
                            content,
                            'text/html'
                        );

                        const titleDiv = contentDoc.querySelector(titleDivDef);
                        console.log('Title div: ', titleDiv);
                        if (!titleDiv) {
                            errorMessage =
                                '< ' +
                                url.substring(0, 20) +
                                '... > n’est pas un article.';
                            errorFiles.push(url);
                            errorMessages.push(errorMessage);
                            console.error(
                                errorMessage,
                                url + ': title not found.'
                            );
                            throw errorMessage;
                        }

                        const articleHeader =
                            contentDoc.querySelector(articleHeaderDef);
                        console.log(
                            'Premium banner element definition: ',
                            premiumBannerDef
                        );
                        let premiumBanner;
                        if (articleHeader) {
                            console.log('Article header: ', articleHeader);
                            premiumBanner =
                                articleHeader.querySelector(premiumBannerDef);
                            if (premiumBanner) {
                                console.log(
                                    'Premium banner found in header: ',
                                    premiumBanner
                                );
                            } else {
                                console.log(
                                    'No premium banner in header, trying elsewhere'
                                );
                                premiumBanner =
                                    contentDoc.querySelector(premiumBannerDef);
                                console.log(
                                    'Premium banner found in doc: ',
                                    premiumBanner
                                );
                            }
                        } else if (!articleHeader) {
                            premiumBanner =
                                contentDoc.querySelector(premiumBannerDef);
                            console.log(
                                'Premium banner found in doc: ',
                                premiumBanner
                            );
                        }
                        // const aboBtn = contentDoc.querySelector(aboBtnDef);
                        // if (aboBtn) {
                        //     console.log('AboBtn found: ', aboBtn);
                        // }
                        if (premiumBanner) {
                            console.log(
                                '“' +
                                    url +
                                    '”' +
                                    ' is a premium article, skipping'
                            );
                            skippedFiles.push(url);
                            skippedTitles.push(titleDiv.textContent);
                            return;
                        } else {
                            console.log(
                                'No premium banner, continuing extraction'
                            );
                        }

                        const subhedDiv =
                            contentDoc.querySelector(subhedDivDef);
                        console.log('Subhed div: ', subhedDiv);

                        const bodyDiv = contentDoc.querySelector(bodyDivDef);

                        let authorElement =
                            contentDoc.querySelector(authorElementDef);
                        if (!authorElement) {
                            authorElement =
                                contentDoc.querySelector(
                                    titleDivDef
                                ).nextElementSibling;
                        }

                        if (!bodyDiv) {
                            errorMessage =
                                '“' +
                                titleDiv.textContent.trim() +
                                '...” n’est pas un article.';
                            console.error(
                                errorMessage,
                                url + ' does not contain text.'
                            );
                            errorFiles.push(url);
                            errorMessages.push(errorMessage);
                            throw errorMessage;
                        }

                        let subhed = '';
                        if (subhedDiv) {
                            subhed = subhedDiv.textContent;
                        }
                        console.log('Subhed: ', subhed);

                        let textElements = Array.from(
                            bodyDiv.querySelectorAll(textElementsDef)
                        );
                        console.log('Text elements = ', textElements);

                        function filterTextElements(
                            textElements,
                            exclElementsDef,
                            exclElementsText
                        ) {
                            let excludedNodes = [];
                            let filteredElements = textElements.filter(
                                function (node) {
                                    let textContentExcluded = false;
                                    let identifierExcluded = false;
                                    // Check if the node's textContent includes any of the exclElementsText
                                    if (exclElementsText) {
                                        textContentExcluded =
                                            exclElementsText.some(function (e) {
                                                return node.textContent.includes(
                                                    e
                                                );
                                            });
                                        console.log(
                                            'Node containing text to exclude? ',
                                            textContentExcluded
                                        );
                                    }

                                    // Check if the node's identifier is in the exclElementsDef array
                                    if (exclElementsDef) {
                                        identifierExcluded =
                                            exclElementsDef.includes(
                                                node.className
                                            );
                                        console.log(
                                            'Node to exclude on identifier? ',
                                            identifierExcluded
                                        );
                                    }

                                    if (
                                        textContentExcluded ||
                                        identifierExcluded
                                    ) {
                                        excludedNodes.push(
                                            node + ', ' + node.textContent
                                        );
                                    }

                                    // Exclude the node if either condition is true
                                    return !(
                                        textContentExcluded ||
                                        identifierExcluded
                                    );
                                }
                            );

                            console.log('Excluded nodes: ', excludedNodes);
                            return filteredElements;
                        }

                        let text;
                        if (exclElementsDef || exclElementsText) {
                            console.log(
                                'Elements to exclude: ',
                                exclElementsDef + exclElementsText
                            );
                            textElements = filterTextElements(
                                textElements,
                                exclElementsDef,
                                exclElementsText
                            );
                            console.log(
                                'Text elements after filtering: ',
                                textElements
                            );
                        }

                        text = textElements
                            .map((textElement) =>
                                textElement.textContent.trim()
                            )
                            .join('\n\n');

                        let author;
                        if (authorElement) {
                            author = authorElement.textContent
                                .replace('Par', '')
                                .replace('par', '')
                                .replaceAll('"', '&quot;')
                                .replaceAll('&', '&amp;')
                                .trim();
                        } else {
                            author = 'auteur-inconnu';
                        }
                        console.log('Author: ', author);

                        let date;
                        console.log('Date logic: ', dateLogic);
                        if (dateLogic === 'node') {
                            let dateElement =
                                contentDoc.querySelector(dateElementDef);
                            let dateElementValue;
                            if (dateElement && dateAttributeDef) {
                                dateElementValue =
                                    dateElement.getAttribute(dateAttributeDef);
                                function isIsoDate() {
                                    if (
                                        /\d{4}-\d{2}-\d{2}/.test(
                                            dateElementValue
                                        )
                                    ) {
                                        return true;
                                    } else {
                                        return false;
                                    }
                                }
                                console.log('ISO Date?', isIsoDate());
                            }
                            let dateString;
                            let frenchDateString;
                            if (dateElementValue && isIsoDate()) {
                                console.log(
                                    'ISO date for ' + url,
                                    dateElementValue
                                );
                                date = dateElement
                                    ? dateElementValue.split('T')[0]
                                    : 'date-inconnue';
                                console.log('Article date from ISO: ', date);
                            } else if (
                                (dateElementValue && !isIsoDate()) ||
                                (dateElement && !dateElementValue)
                            ) {
                                dateString = dateElement.textContent
                                    .replace('Publié le', '')
                                    .trim();
                                console.log(
                                    'Non ISO date for ' + url,
                                    dateString
                                );
                                if (isFrenchDate(dateString)) {
                                    console.log(
                                        'French date identified for ' + url
                                    );
                                    date = convertFrenchDateToISO(dateString);
                                    console.log(
                                        'Article date from French format: ',
                                        date
                                    );
                                } else {
                                    try {
                                        console.log(
                                            'Date string exists for ' + url,
                                            dateString
                                        );
                                        date =
                                            buildDateFromNumberFormat(
                                                dateString
                                            );
                                        console.log(
                                            'Article date from number format: ',
                                            date
                                        );
                                    } catch (error) {
                                        'Error building date for ' + url, error;
                                    }
                                }
                            } else if (!dateElement) {
                                const divs = contentDoc.querySelectorAll('*');
                                console.log('Divs:', divs);
                                const divArray = Array.from(divs);
                                console.log('Div array: ', divArray);
                                const dateDiv = divArray.find((d) =>
                                    d.textContent.includes(dateStringDef)
                                );
                                console.log('Date div: ', dateDiv);
                                if (isFrenchDate(dateDiv)) {
                                    frenchDateString = dateDiv.textContent
                                        .replace('Publié le', '')
                                        .trim();
                                    date =
                                        convertFrenchDateToISO(
                                            frenchDateString
                                        );
                                    console.log(
                                        'Article date from text in French format: ',
                                        date
                                    );
                                } else {
                                    dateString = dateDiv.textContent
                                        .replace('Publié le')
                                        .trim();
                                    date =
                                        buildDateFromNumberFormat(dateString);
                                    console.log(
                                        'Article date from text in number format: ',
                                        date
                                    );
                                }
                            } else if (
                                !dateElement &&
                                !isIsoDate() &&
                                !frenchDateString &&
                                !dateString
                            ) {
                                date = 'date-inconnue';
                                console.log('Date fallback for ' + url, date);
                            }
                        } else if (dateLogic === 'url') {
                            date = buildDateFromUrl(url);
                            console.log('Date from URL: ', date);
                        }

                        function buildDateFromUrl(url) {
                            const datePattern =
                                /(%C2%B7)?(\d{4})\/?(\d{2})\/?(\d{2})/u;
                            const day = url.match(datePattern)[4];
                            const month = url.match(datePattern)[3];
                            const year = url.match(datePattern)[2];
                            let builtDate = year + '-' + month + '-' + day;
                            console.log('Built date: ', builtDate);
                            return builtDate;
                        }

                        let extension = '.txt';
                        let pubName;
                        if (pubNameDef) {
                            let pubNameSpan =
                                contentDoc.querySelector(pubNameDef);
                            const brIndex =
                                pubNameSpan.innerHTML.indexOf('<br>');
                            if (brIndex !== -1) {
                                pubNameSpan = pubNameSpan.innerHTML.substring(
                                    0,
                                    brIndex
                                );
                                pubName = pubNameSpan
                                    .replaceAll(/[,-].+/g, '')
                                    .replaceAll(/\s+/g, ' ')
                                    .replace(/\(.+/, '')
                                    .trim();
                            } else {
                                pubName = pubNameSpan.textContent
                                    .replaceAll(/[,-].+/g, '')
                                    .replaceAll(/\s+/g, ' ')
                                    .replace(/\(.+/, '')
                                    .trim();
                            }
                        }
                        if (!pubNameDef) {
                            pubName = paperName;
                        }

                        let fileContent = `${pubName}\n\n${author}\n\n${date}\n\n${titleDiv.textContent}\n\n${subhed}\n\n${text}`;

                        if (selectedFormat === 'xml') {
                            extension = '.xml';
                            const title = titleDiv.textContent
                                .replaceAll('&', '&amp;')
                                .replaceAll('"', '&quot;')
                                .trim();
                            subhed = subhed.replaceAll('&', '&amp;');
                            text = text
                                .replaceAll('&', '&amp;')
                                .replaceAll('<', '&lt;')
                                .replaceAll('>', '&gt;')
                                .replaceAll('\n', '<lb></lb>');
                            const euroLinkBtn =
                                contentDoc.querySelector(euroLinkDef);
                            let euroLink;
                            if (euroLinkBtn) {
                                euroLink =
                                    euroLinkBtn.getAttribute(euroLinkAttribute);
                                console.log(
                                    'Article Europresse link = ',
                                    euroLink
                                );
                                url = euroLink;
                            } else {
                                url = url.split('&')[0];
                            }
                            fileContent = `<text source="${pubName}" author="${author}" title="${title}" date="${date}">\n<ref target="${url}">Link to original document</ref><lb></lb><lb></lb>\n\n${subhed}<lb></lb><lb></lb>\n\n${text}\n</text>`;
                        }

                        let baseFileName = `${date}_${pubName.replaceAll(
                            /\s/g,
                            '_'
                        )}_${author
                            .replaceAll(/\p{P}/gu, '')
                            .replaceAll(/\s+/g, '_')
                            .trim()
                            .substring(0, 20)}${extension}`;
                        let index = 1;

                        // Append a number to the file name to make it unique
                        while (addedFileNames.has(baseFileName)) {
                            baseFileName = `${date}_${pubName.replaceAll(
                                /\s/g,
                                '_'
                            )}_${author
                                .replaceAll(/\p{P}/gu, '')
                                .replaceAll(/\s+/g, '_')
                                .trim()
                                .substring(0, 20)}_${index}${extension}`;
                            index++;
                        }

                        function sanitizeFileName(fileName) {
                            const illegalRe = /[\/\\:*?"<>|]/g;
                            const controlRe = /[\x00-\x1f\x80-\x9f]/g;
                            const reservedRe =
                                /^\.+$|^(con|prn|aux|nul|com[0-9]|lpt[0-9])(\..*)?$/i;
                            const windowsRe =
                                /^(con|prn|aux|nul|com[0-9]|lpt[0-9]|[\s\.]+)$/gi;

                            return fileName
                                .replace(illegalRe, '_') // Replace illegal characters
                                .replace(controlRe, '_') // Replace control characters
                                .replace(reservedRe, '_reserved') // Replace reserved words
                                .replace(windowsRe, '_'); // Replace Windows reserved words
                        }

                        baseFileName = sanitizeFileName(baseFileName);
                        baseFileName = baseFileName
                            .normalize('NFD')
                            .replace(/[\u0300-\u036f]/g, '');

                        fetchedUrls.add(url);
                        addedFileNames.add(baseFileName);

                        zip.file(baseFileName, fileContent);
                    } catch (error) {
                        console.error('Error: ', error);
                    }
                })
            );

            if (abortExtraction) {
                console.log('Extraction aborted');
                break;
            }
            if (extractAll) {
                if (nextPageDef) {
                    nextUrl = await getNextPageUrl(nextUrl);
                    console.log('Next page URL = ' + nextUrl);
                }
            } else {
                console.log('Single page extraction finished');
                break;
            }
        } catch (error) {
            console.error('Error: ' + error);
        }
    }

    const zipBlob = await zip.generateAsync({
        type: 'blob',
    });

    searchTerm = searchTerm
        .replaceAll(/\|/gu, ' OR')
        .replaceAll(/&/gu, ' AND')
        .replaceAll(/!/gu, ' NOT')
        .replaceAll(/\p{P}/gu, '')
        .trim()
        .replaceAll(/\s/gu, '_');

    const zipFileName = `${paperName.replaceAll(
        /\s/g,
        '_'
    )}_${searchTerm}_${selectedFormat}_archive.zip`;

    await downloadZip(zipBlob, zipFileName);

    return [
        Array.from(fetchedUrls),
        Array.from(addedFileNames),
        skippedFiles,
        skippedTitles,
        errorFiles,
        errorMessages,
    ];
}

async function getNextPageUrl(nextUrl) {
    const urlParts = nextUrl.split(`${pageParam}=`);
    const currentPageNo = Number(urlParts[1]);
    const newPageNo = currentPageNo + 1;
    const nextPageUrl = urlParts[0] + `${pageParam}=` + newPageNo;
    const response = await fetch(nextPageUrl);
    console.log('Next page fetch OK? ', response.ok);
    if (response.redirected || !response.ok) {
        console.log('Last page reached');
        return null;
    }
    console.log('Next page found: ' + nextPageUrl);
    return nextPageUrl;
}

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

// Function to construct a date from a number format DD/MM/YYYY
function buildDateFromNumberFormat(dateString) {
    const datePattern = /(\d+)\/(\d+)\/(\d+)/u;
    const day = dateString.match(datePattern)[1];
    const month = dateString.match(datePattern)[2];
    const year = dateString.match(datePattern)[3];
    date = year + '-' + month + '-' + day;
    return date;
}

// Function to check if a date is in French format
function isFrenchDate(div) {
    if (/\d{1,2}\s[/p{L}]{3,}\s\d{4}/u.test(div.textContent)) {
        console.log('French date located for ' + url);
        return true;
    } else {
        return false;
    }
}

// Function to convert date into ISO format (YYYY-MM-DD)
function convertFrenchDateToISO(dateString) {
    const monthMap = {
        janvier: '01',
        février: '02',
        mars: '03',
        avril: '04',
        mai: '05',
        juin: '06',
        juillet: '07',
        août: '08',
        septembre: '09',
        octobre: '10',
        novembre: '11',
        décembre: '12',
    };
    const dayPattern = /(\d{1,2})\s/u;
    const monthPattern = /([\p{L}]{3,})/u;
    const yearPattern = /(\d{4})/u;
    let dayArray = dateString.match(dayPattern);
    let day;
    if (dayArray) {
        day = dayArray[1];
        if (day.length === 1) {
            day = '0' + day;
        }
    }
    let monthArray = dateString.match(monthPattern);
    let month;
    if (monthArray) {
        month = monthMap[monthArray[0].toLowerCase()];
    }
    let year = dateString.match(yearPattern)[0];
    if (day && month && year) {
        return `${year}-${month}-${day}`;
    } else if (month && year) {
        return `${year}-${month}`;
    } else if (year) {
        return year;
    }
    return null;
}
