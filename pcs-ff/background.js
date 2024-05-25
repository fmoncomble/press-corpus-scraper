chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'update') {
        chrome.tabs.create({ url: 'https://fmoncomble.github.io/press-corpus-scraper/changelog.html' });
    }
});

let url;
let doc;
let pageNo;
let pubNameDef;
let searchTerm;
let abortExtraction;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'performExtraction') {
        try {
            url = message.url;
            selectedFormat = message.format;
            extractAll = message.extractAll;
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
    if (typeof firstPage !== 'undefined') {
        pageNo = firstPage;
    } else {
        pageNo = 1;
    }
    abortExtraction = false;
    const parser = new DOMParser();
    let nextUrl;
    if (nextPageDef) {
        const pageQuery = url.split(`${pageParam}=`)[1];
        const queryString = url.split('?')[1];
        if (pageQuery) {
            if (extractAll) {
                const baseQuery = url.split(pageParam)[0];
                nextUrl = baseQuery + `${pageParam}=${pageNo}`;
            } else {
                nextUrl = url;
            }
        } else if (queryString) {
            nextUrl = url + `&${pageParam}=` + pageNo;
        } else if (!queryString) {
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
            let articles;

            for (let i = 1; i <= 3; i++) {
                const response = await fetch(nextUrl);
                const html = await response.text();
                doc = parser.parseFromString(html, 'text/html');

                let articleList = doc.querySelector(articleListDef);
                if (!articleList) {
                    throw new Error('Article list not found');
                } else if (articleList) {
                    articles = articleList.querySelectorAll(articlesDef);
                }

                if (articles.length >= 1) {
                    break;
                }

                await new Promise((resolve) => setTimeout(resolve, 1000));
            }

            if (articles.length === 0) {
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
                let currentTab;
                chrome.tabs.query(
                    { active: true, currentWindow: true },
                    function (tabs) {
                        currentTab = tabs[0];

                        let port = chrome.tabs.connect(currentTab.id, {
                            name: 'backgroundjs',
                        });
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
                    return new URL(articleUrl).href;
                })
                .filter((url) => url !== null);

            await Promise.all(
                urls.map(async (url) => {
                    try {
                        let errorMessage;
                        const contentResponse = await fetch(url);
                        if (!contentResponse.ok) {
                            errorMessage =
                                ' (' +
                                url.substring(0, 20) +
                                '... ne répond pas.)';
                            errorFiles.push(url);
                            errorMessages.push(errorMessage);
                            return;
                        }
                        const content = await contentResponse.text();
                        const contentDoc = parser.parseFromString(
                            content,
                            'text/html'
                        );

                        const titleDiv = contentDoc.querySelector(titleDivDef);
                        if (!titleDiv) {
                            errorMessage =
                                '< ' +
                                url.substring(0, 20) +
                                '... > n’est pas un article.';
                            errorFiles.push(url);
                            errorMessages.push(errorMessage);
                            return;
                        }

                        const articleHeader =
                            contentDoc.querySelector(articleHeaderDef);
                        let premiumBanner;
                        if (articleHeader) {
                            premiumBanner =
                                articleHeader.querySelector(premiumBannerDef);
                            if (!premiumBanner) {
                                premiumBanner =
                                    contentDoc.querySelector(premiumBannerDef);
                            }
                        } else if (!articleHeader) {
                            premiumBanner =
                                contentDoc.querySelector(premiumBannerDef);
                        }
                        // const aboBtn = contentDoc.querySelector(aboBtnDef);
                        // if (aboBtn) {
                        //     console.log('AboBtn found: ', aboBtn);
                        // }
                        if (premiumBanner) {
                            skippedFiles.push(url);
                            skippedTitles.push(titleDiv.textContent);
                            return;
                        }

                        const subhedDiv =
                            contentDoc.querySelector(subhedDivDef);

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
                            errorFiles.push(url);
                            errorMessages.push(errorMessage);
                            return;
                        }

                        let subhed = '';
                        if (subhedDiv) {
                            subhed = subhedDiv.textContent;
                        }

                        let textElements = Array.from(
                            bodyDiv.querySelectorAll(textElementsDef)
                        );

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
                                    }

                                    // Check if the node's identifier is in the exclElementsDef array
                                    if (exclElementsDef) {
                                        identifierExcluded =
                                            exclElementsDef.includes(
                                                node.className
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

                            return filteredElements;
                        }

                        let text;
                        if (exclElementsDef || exclElementsText) {
                            textElements = filterTextElements(
                                textElements,
                                exclElementsDef,
                                exclElementsText
                            );
                        }

                        text = textElements
                            .map((textElement) =>
                                textElement.textContent.trim()
                            )
                            .join('\n\n');

                        if (!text) {
                            errorMessage =
                                '“' +
                                titleDiv.textContent.trim() +
                                '...” n’est pas un article.';
                            errorFiles.push(url);
                            errorMessages.push(errorMessage);
                            return;
                        }

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

                        let date;
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
                            }
                            let dateString;
                            let frenchDateString;
                            if (dateElementValue && isIsoDate()) {
                                date = dateElement
                                    ? dateElementValue.split('T')[0]
                                    : 'date-inconnue';
                            } else if (
                                (dateElementValue && !isIsoDate()) ||
                                (dateElement && !dateElementValue)
                            ) {
                                dateString = dateElement.textContent
                                    .replace('Publié le', '')
                                    .trim();
                                if (isFrenchDate(dateString)) {
                                    date = convertFrenchDateToISO(dateString);
                                } else {
                                    try {
                                        date =
                                            buildDateFromNumberFormat(
                                                dateString
                                            );
                                    } catch (error) {
                                        'Error building date for ' + url, error;
                                    }
                                }
                            } else if (!dateElement) {
                                const divs = contentDoc.querySelectorAll('*');
                                const divArray = Array.from(divs);
                                const dateDiv = divArray.find((d) =>
                                    d.textContent.includes(dateStringDef)
                                );
                                if (isFrenchDate(dateDiv)) {
                                    frenchDateString = dateDiv.textContent
                                        .replace('Publié le', '')
                                        .trim();
                                    date =
                                        convertFrenchDateToISO(
                                            frenchDateString
                                        );
                                } else {
                                    dateString = dateDiv.textContent
                                        .replace('Publié le')
                                        .trim();
                                    date =
                                        buildDateFromNumberFormat(dateString);
                                }
                            } else if (
                                !dateElement &&
                                !isIsoDate() &&
                                !frenchDateString &&
                                !dateString
                            ) {
                                date = 'date-inconnue';
                            }
                        } else if (dateLogic === 'url') {
                            date = buildDateFromUrl(url);
                        }

                        function buildDateFromUrl(url) {
                            const datePattern =
                                /(%C2%B7)?(\d{4})\/?(\d{2})\/?(\d{2})/u;
                            const day = url.match(datePattern)[4];
                            const month = url.match(datePattern)[3];
                            const year = url.match(datePattern)[2];
                            let builtDate = year + '-' + month + '-' + day;
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
                                url = euroLink;
                            } else {
                                url = url.split('&')[0];
                            }
                            fileContent = `<text source="${pubName}" author="${author}" title="${title}" date="${date}">\n<ref target="${url}">Link to original document</ref><lb></lb><lb></lb>\n\n${subhed}<lb></lb><lb></lb>\n\n${text}\n</text>`;
                        }

                        if (selectedFormat === 'ira') {
                            extension = '.txt';
                            const title = titleDiv.textContent
                                .replaceAll(/[\.\?\!:;,\"'‘’“”«»]/g, ' ')
                                .trim()
                                .replaceAll(/\s/g, '_')
                                .replaceAll('__', '_');
                            author = author
                                .replaceAll(/[\.\?\!:;,\"'‘’“”«»]/g, ' ')
                                .trim()
                                .replaceAll(/\s/g, '_')
                                .replaceAll('__', '_');
                            pubName = pubName
                                .replaceAll(/[\.\?\!:;,\"'‘’“”]/g, ' ')
                                .trim()
                                .replaceAll(/\s/g, '_')
                                .replaceAll('__', '_');
                            fileContent = `\n**** *source_${pubName} *title_${title} *author_${author} *date_${date}\n\n${subhed}\n\n${text}`;
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
                break;
            }
            if (extractAll) {
                if (nextPageDef) {
                    nextUrl = await getNextPageUrl(nextUrl);
                }
            } else {
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
    if (response.redirected || !response.ok) {
        return null;
    } else {
        return nextPageUrl;
    }
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
