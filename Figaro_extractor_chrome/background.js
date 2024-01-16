let url;
let doc;
let pageNo = 1;
let abortExtraction = false;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'performExtraction') {
        try {
            url = message.url;
            selectedFormat = message.format;
            console.log('Output format: ' + selectedFormat);
            performExtractAndSave(url)
                .then((results) => {
                    sendResponse({
                        success: true,
                        downloadedFiles: results[0],
                        skippedFiles: results[1],
                        errorFiles: results[2],
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
    const parser = new DOMParser();
    let nextUrl;
    const queryString = url.split('?')[1];
    if (queryString) {
        console.log('Query string = ' + queryString);
        nextUrl = url + '&page=' + pageNo;
    } else if (!queryString) {
        console.log('No existing query string, creating');
        nextUrl = url + '?page=' + pageNo;
    }
    const fetchedUrls = new Set();

    const zip = new JSZip();
    const addedFileNames = new Set();
    const skippedFiles = new Set();
    const errorFiles = new Set();

    loop: while (nextUrl) {
        try {
            console.log('Search page URL = ' + nextUrl);
            const response = await fetch(nextUrl);
            const html = await response.text();
            doc = parser.parseFromString(html, 'text/html');

            const resultsNumberContainer = doc.querySelector(
                'div.resultats div.facettes__nombre'
            );
            const resultsNumberString = resultsNumberContainer.textContent
                .replace('résultats', '')
                .trim();
            const resultsNumber = Number(resultsNumberString);
            const resultsPageNumber = Math.ceil(resultsNumber / 20);

            let articleList = doc.querySelector('div.articles');
            if (!articleList) {
                throw new Error('Article list not found');
            }

            const articles = articleList.querySelectorAll(
                'article.fig-profil'
            );
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
                        const contentResponse = await fetch(url);
                        console.log('Article URL = ' + contentResponse.url);
                        const content = await contentResponse.text();
                        const contentDoc = parser.parseFromString(
                            content,
                            'text/html'
                        );

                        const premiumBanner = contentDoc.querySelector(
                            'div.fig-premium-mark-article'
                        );
                        if (premiumBanner) {
                            console.log(
                                '« ' +
                                    url +
                                    ' »' +
                                    ' is a premium article, skipping'
                            );
                            skippedFiles.add(url);
                            return;
                        }

                        const titleDiv = contentDoc.querySelector('h1');

                        const subhedDiv = contentDoc.querySelector(
                            'p[class*="standfirst"], .chapo, .text-xl'
                        );

                        const bodyDiv = contentDoc.querySelector(
                            'div.fig-content-body, div.stack, div.block.content, div.article-body'
                        );

                        let authorElement = contentDoc.querySelector(
                            'div.authors, span[class*="authors"], .info-pub div span'
                        );
                        if (!authorElement) {
                            authorElement =
                                contentDoc.querySelector(
                                    'h1'
                                ).nextElementSibling;
                        }
                        if (authorElement) {
                            console.log('Author: ' + authorElement.textContent);
                        }

                        let dateString =
                            contentDoc.querySelector('div.info-pub');
                        if (!dateString && authorElement) {
                            dateString = authorElement.nextElementSibling;
                        }
                        if (dateString) {
                            dateString = dateString.lastElementChild.textContent
                                .replace('Publié le', '')
                                .trim();
                        }

                        let dateElement = contentDoc.querySelector(
                            '.fig-content-metas__pub-date time'
                        );
                        if (dateElement) {
                            console.log('Date: ' + dateElement.textContent);
                        }

                        const authorNode =
                            contentDoc.querySelector('div.authors');
                        let dateContainer;
                        if (authorNode) {
                            dateContainer = authorNode.nextElementSibling;
                        }

                        if (!bodyDiv) {
                            errorFiles.add(url);
                            throw new Error(
                                'Text container not found for ' + url
                            );
                        }

                        let subhed = subhedDiv.textContent;

                        let textElements = Array.from(
                            bodyDiv.querySelectorAll(
                                'p:not(.fig-crosslinking):not(.fig-body-link), h2'
                            )
                        );

                        const readAlso = 'LIRE AUSSI';
                        const seeAlso = 'VOIR AUSSI';

                        function filterTextElements(
                            textElements,
                            readAlso,
                            seeAlso
                        ) {
                            return textElements.filter(function (node) {
                                return (
                                    !node.textContent.includes(readAlso) &&
                                    !node.textContent.includes(seeAlso)
                                );
                            });
                        }

                        textElements = filterTextElements(
                            textElements,
                            readAlso,
                            seeAlso
                        );

                        let text = textElements
                            .map((textElement) =>
                                textElement.textContent.trim()
                            )
                            .join('\n\n');

                        let author;
                        if (authorElement) {
                            author = authorElement.textContent
                                .replace('Par', '')
                                .trim();
                        } else {
                            author = 'auteur-inconnu';
                        }

                        let date;
                        if (dateElement) {
                            date = dateElement
                                ? dateElement
                                      .getAttribute('datetime')
                                      .split('T')[0]
                                : 'Unknown Date';
                        } else if (dateContainer) {
                            const frenchDate = dateContainer.textContent
                                .replace('Publié le', '')
                                .trim();
                            date = convertFrenchDateToISO(frenchDate);
                        } else if (dateString) {
                            const datePattern = /(\d+)\/(\d+)\/(\d+)/u;
                            const day = dateString.match(datePattern)[1];
                            const month = dateString.match(datePattern)[2];
                            const year = dateString.match(datePattern)[3];
                            date = year + '-' + month + '-' + day;
                        } else if (
                            !dateElement &&
                            !dateContainer &&
                            !dateString
                        ) {
                            date = 'date-inconnue';
                        }

                        let extension = '.txt';

                        let fileContent = `${author}\n${date}\n${titleDiv.textContent}\n${subhed}\n${text}`;

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
                            .replaceAll(/\s/g, '_')}${extension}`;
                        let index = 1;

                        // Append a number to the file name to make it unique
                        while (addedFileNames.has(baseFileName)) {
                            baseFileName = `${date}_${author}_${index}${extension}`;
                            index++;
                        }

                        addedFileNames.add(baseFileName);

                        zip.file(baseFileName, fileContent);
                    } catch (error) {
                        console.error(error);
                    }
                })
            );

            if (abortExtraction) {
                console.log('Extraction aborted');
                break;
            }

            nextUrl = await getNextPageUrl(nextUrl);
            console.log('Next page URL = ' + nextUrl);
        } catch (error) {
            console.error('Error: ' + error);
        }
    }

    const zipBlob = await zip.generateAsync({
        type: 'blob',
    });

    const searchTerm = doc
        .querySelector('h1')
        .textContent.replace('Résultats de la recherche :', '')
        .trim();

    const zipFileName = `Figaro_${searchTerm.replace(
        /\s/,
        '_'
    )}_${selectedFormat}_archive.zip`;

    await downloadZip(zipBlob, zipFileName);

    pageNo = 1;

    return [
        Array.from(addedFileNames),
        Array.from(skippedFiles),
        Array.from(errorFiles),
    ];
}

async function getNextPageUrl(nextUrl) {
    const urlParts = nextUrl.split('page=');
    const currentPageNo = Number(urlParts[1]);
    const newPageNo = currentPageNo + 1;
    const nextPageUrl = urlParts[0] + 'page=' + newPageNo;
    const response = await fetch(nextPageUrl);
    if (response.redirected) {
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
