let url;
let doc;
let pageNo;
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
            searchTermContainerDef = message.searchTermContainerDef;
            resultsNumber = message.resultsNumber;
            resultsNumberPerPageDef = message.resultsNumberPerPageDef;
            articleListDef = message.articleListDef;
            articlesDef = message.articlesDef;
            articleHeaderDef = message.articleHeaderDef;
            premiumBannerDef = message.premiumBannerDef;
            titleDivDef = message.titleDivDef;
            subhedDivDef = message.subhedDivDef;
            bodyDivDef = message.bodyDivDef;
            authorElementDef = message.authorElementDef;
            dateLogic = message.dateLogic;
            dateElementDef = message.dateElementDef;
            dateAttributeDef = message.dateAttributeDef;
            dateStringDef = message.dateStringDef;
            textElementsDef = message.textElementsDef;
            exclElementsDef = message.exclElementsDef;
            nextPageDef = message.nextPageDef;
            nextButtonDef = message.nextButtonDef;
            console.log('Output format: ' + selectedFormat);
            performExtractAndSave(url)
                .then((results) => {
                    sendResponse({
                        success: true,
                        downloadedFiles: results[0],
                        skippedFiles: results[1],
                        skippedTitles: results[2],
                        errorFiles: results[3],
                        errorMessages: results[4],
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
    pageNo = 1;
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
        const pageQuery = url.split('page=')[1];
        const queryString = url.split('?')[1];
        if (pageQuery) {
            console.log('Query string exists and already includes page number');
            if (extractAll) {
                const baseQuery = url.split('page')[0];
                nextUrl = baseQuery + 'page=1';
            } else {
                nextUrl = url;
            }
        } else if (queryString) {
            console.log(
                'Query string = ' + queryString + '. Appending page number'
            );
            nextUrl = url + '&page=' + pageNo;
        } else if (!queryString) {
            console.log('No existing query string, creating');
            nextUrl = url + '?page=' + pageNo;
        }
    } else if (nextButtonDef) {
        nextUrl = url;
    }
    const fetchedUrls = new Set();

    const zip = new JSZip();
    const addedFileNames = new Set();
    const skippedFiles = [];
    const skippedTitles = [];
    const errorFiles = [];
    const errorMessages = [];

    loop: while (nextUrl) {
        try {
            console.log('Search page URL = ' + nextUrl);
            const response = await fetch(nextUrl);

            const html = await response.text();
            doc = parser.parseFromString(html, 'text/html');

            let resultsPageNumber;
            if (resultsNumber) {
                resultsNumber = Number(resultsNumber);
                resultsPageNumber = Math.ceil(
                    resultsNumber / resultsNumberPerPageDef
                );
            }

            let articleList = doc.querySelector(articleListDef);
            if (!articleList) {
                throw new Error('Article list not found');
            }

            const articles = articleList.querySelectorAll(articlesDef);
            if (articles.length === 0) {
                console.log('Last article reached');
                break loop;
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
                        port.postMessage({
                            pageNo,
                            resultsPageNumber,
                        });
                        pageNo += 1;
                    }
                );
            }

            sendRange();

            const urls = Array.from(articles).map(
                (p) => new URL(p.querySelector('a').getAttribute('href')).href
            );

            fetchedUrls.add(...urls);

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
                        const aboBtn = contentDoc.querySelector(aboBtnDef);
                        if (aboBtn) {
                            console.log('AboBtn found: ', aboBtn);
                        }
                        if (premiumBanner && aboBtn) {
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
                        if (authorElement) {
                            console.log('Author: ', authorElement.textContent);
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
                            exclElementsDef
                        ) {
                            return textElements.filter(function (node) {
                                return !exclElementsDef.some(function (e) {
                                    return node.textContent.includes(e);
                                });
                            });
                        }

                        let text;
                        if (exclElementsDef) {
                            console.log(
                                'Elements to exclude: ',
                                exclElementsDef
                            );
                            textElements = filterTextElements(
                                textElements,
                                exclElementsDef
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
                                .replaceAll('"', '&quot;')
                                .replaceAll('&', '&amp;')
                                .trim();
                        } else {
                            author = 'auteur-inconnu';
                        }

                        let date;
                        console.log('Date logic: ', dateLogic);
                        if (dateLogic === 'node') {
                            let dateElement =
                                contentDoc.querySelector(dateElementDef);
                            let dateElementValue;
                            if (dateElement) {
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
                            if (dateElement && isIsoDate()) {
                                console.log(
                                    'ISO date for ' + url,
                                    dateElementValue
                                );
                            } else if (dateElement && !isIsoDate()) {
                                console.log(
                                    'Non ISO date for ' + url,
                                    dateElement.textContent
                                );
                            } else {
                                const divs = contentDoc.querySelectorAll('div');
                                console.log('Divs:', divs);
                                const divArray = Array.from(divs);
                                console.log('Div array: ', divArray);
                                const dateDiv = divArray.find((d) =>
                                    d.textContent.includes(dateStringDef)
                                );
                                console.log('Date div: ', dateDiv);
                                function isFrenchDate() {
                                    if (
                                        /\d{1,2}\s[/p{L}]{3,}\s\d{4}/u.test(
                                            dateDiv.textContent
                                        )
                                    ) {
                                        console.log('French date for ' + url);
                                        return true;
                                    } else {
                                        return false;
                                    }
                                }
                                if (isFrenchDate()) {
                                    frenchDateString = dateDiv.textContent;
                                } else {
                                    dateString = dateDiv.textContent;
                                }
                            }

                            if (dateElement && isIsoDate()) {
                                console.log('Date element exists for ' + url);
                                date = dateElement
                                    ? dateElementValue
                                          //   .getAttribute(dateAttributeDef)
                                          .split('T')[0]
                                    : 'date-inconnue';
                                console.log('Date: ', date);
                            } else if (dateElement && !isIsoDate()) {
                                const frenchDate = dateElement.textContent
                                    .replace('Publié le ', '')
                                    .trim();
                                console.log(
                                    'French date for ' + url,
                                    frenchDate
                                );
                                date = convertFrenchDateToISO(frenchDate);
                                console.log('Date: ', date);
                            } else if (frenchDateString) {
                                console.log('French date exists for ' + url);
                                const frenchDate = frenchDateString.textContent
                                    .replace('Publié le', '')
                                    .trim();
                                date = convertFrenchDateToISO(frenchDate);
                                console.log('Date: ', date);
                            } else if (dateString) {
                                try {
                                    console.log(
                                        'Date string exists for ' + url
                                    );
                                    const datePattern = /(\d+)\/(\d+)\/(\d+)/u;
                                    const day =
                                        dateString.match(datePattern)[1];
                                    const month =
                                        dateString.match(datePattern)[2];
                                    const year =
                                        dateString.match(datePattern)[3];
                                    date = year + '-' + month + '-' + day;
                                    console.log('Date: ', date);
                                } catch (error) {
                                    'Error building date for ' + url, error;
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
                            const datePattern = /(\d+)\/(\d+)\/(\d+)/u;
                            const day = url.match(datePattern)[3];
                            const month = url.match(datePattern)[2];
                            const year = url.match(datePattern)[1];
                            let builtDate = year + '-' + month + '-' + day;
                            console.log('Built date: ', builtDate);
                            return builtDate;
                        }

                        let extension = '.txt';

                        let fileContent = `${author}\n\n${date}\n\n${titleDiv.textContent}\n\n${subhed}\n\n${text}`;

                        if (selectedFormat === 'xml') {
                            extension = '.xml';
                            const title = titleDiv.textContent
                                .replaceAll('"', '&quot;')
                                .replaceAll('&', '&amp;');
                            subhed = subhed.replaceAll('&', '&amp;');
                            text = text
                                .replaceAll('&', '&amp;')
                                .replaceAll('\n', '<lb></lb>');
                            fileContent = `<text author="${author}" title="${title}" date="${date}">\n<ref target="${url}">Link to original document</ref><lb></lb><lb></lb>\n\n${subhed}<lb></lb><lb></lb>\n\n${text}\n</text>`;
                        }

                        let baseFileName = `${date}_${author
                            .replaceAll(/\p{P}/gu, '')
                            .replaceAll(/\s+/g, '_')
                            .substring(0, 20)}${extension}`;
                        let index = 1;

                        // Append a number to the file name to make it unique
                        while (addedFileNames.has(baseFileName)) {
                            baseFileName = `${date}_${author}_${index}${extension}`;
                            index++;
                        }

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

    const searchTerm = doc.querySelector(searchTermContainerDef).value.trim();

    const zipFileName = `${paperName.replaceAll(
        /\s/g,
        '_'
    )}_${searchTerm.replace(/\s/, '_')}_${selectedFormat}_archive.zip`;

    await downloadZip(zipBlob, zipFileName);

    return [
        Array.from(addedFileNames),
        skippedFiles,
        skippedTitles,
        errorFiles,
        errorMessages,
    ];
}

async function getNextPageUrl(nextUrl) {
    const urlParts = nextUrl.split('page=');
    const currentPageNo = Number(urlParts[1]);
    const newPageNo = currentPageNo + 1;
    const nextPageUrl = urlParts[0] + 'page=' + newPageNo;
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
