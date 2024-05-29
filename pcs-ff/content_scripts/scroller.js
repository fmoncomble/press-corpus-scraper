// ------------- Ne rien modifier sous cette ligne ---------------- //
console.log('PCS scroller script injected');

let variableDiv = document.querySelector('.pcs-variables');
let variables = JSON.parse(variableDiv.textContent);
let paperName = variables.paperName;
let anchorDef = variables.anchorDef;
let searchTerm = variables.searchTerm;
let resultsNumberContainer = variables.resultsNumberContainer;
let resultsNumber = variables.resultsNumber;
let resultsNumberPerPageDef = variables.resultsNumberPerPageDef;
let pagesNumber = variables.pagesNumber;
let articleListDef = variables.articleListDef;
let articlesDef = variables.articlesDef;
let nextPageDef = variables.nextPageDef;
let pageParam = variables.pageParam;
let nextButtonDef = variables.nextButtonDef;
let aboBtnDef = variables.aboBtnDef;
let premiumBannerDef = variables.premiumBannerDef;
let articleHeaderDef = variables.articleHeaderDef;
let titleDivDef = variables.titleDivDef;
let subhedDivDef = variables.subhedDivDef;
let bodyDivDef = variables.bodyDivDef;
let authorElementDef = variables.authorElementDef;
let dateLogic = variables.dateLogic;
let dateElementDef = variables.dateElementDef;
let dateAttributeDef = variables.dateAttributeDef;
let dateStringDef = variables.dateStringDef;
let textElementsDef = variables.textElementsDef;
let exclElementsText = variables.exclElementsText;
let exclElementsDef = variables.exclElementsDef;

const fieldset = document.createElement('fieldset');
fieldset.classList.add('pcs-ui');
const fieldsetText = document.createElement('div');
fieldsetText.classList.add('pcs-fs-text');
fieldsetText.textContent =
    'Extraire et télécharger les articles au format souhaité';
fieldset.appendChild(fieldsetText);
const anchor = document.querySelector(anchorDef);
if (!anchor) {
    window.alert(
        "Impossible d'afficher l'interface d'extraction :\nVeuillez charger la page dans un nouvel onglet."
    );
    location.reload();
}
anchor.appendChild(fieldset);

const legend = document.createElement('legend');
const legendText = document.createElement('div');
legendText.classList.add('legend-text');
legendText.textContent = `${paperName} corpus scraper`;
legend.appendChild(legendText);
fieldset.appendChild(legend);

const extractButtonsContainer = document.createElement('div');
extractButtonsContainer.style.display = 'inline';

let selectedFormat = 'txt';

const select = document.createElement('select');
select.classList.add('pcs-ui');
const txt = new Option('TXT', 'txt');
const xml = new Option('XML/XTZ', 'xml');
const ira = new Option('Iramuteq', 'ira');
select.appendChild(txt);
select.appendChild(xml);
select.appendChild(ira);

select.addEventListener('change', function () {
    selectedFormat = this.value;
});

const extractButton = document.createElement('button');
extractButton.classList.add('pcs-ui');
extractButton.id = 'extractButton';
extractButton.textContent = 'Extraire cette page';

extractButtonsContainer.appendChild(extractButton);
extractButtonsContainer.appendChild(select);
fieldset.appendChild(extractButtonsContainer);

// Create max results input
const maxInput = document.createElement('input');
maxInput.type = 'number';
maxInput.classList.add('pcs-ui');
const maxLegend = document.createElement('span');
maxLegend.textContent = 'Extraire maximum: ';
const maxDiv = document.createElement('div');
maxDiv.style.display = 'none';
maxDiv.appendChild(maxLegend);
maxDiv.appendChild(maxInput);

let maxResults;
maxInput.addEventListener('change', () => {
    maxResults = maxInput.value;
});

// Create extraction option checkbox
const checkboxDiv = document.createElement('div');
checkboxDiv.classList.add('checkbox-div');
const container = document.createElement('label');
container.classList.add('switch');
const slider = document.createElement('span');
slider.classList.add('slider');
const checkbox = document.createElement('input');
checkbox.type = 'checkbox';
checkbox.name = 'extractOption';
checkbox.id = 'extractOption';
checkbox.checked = 'checked';
container.appendChild(checkbox);
container.appendChild(slider);
const label = document.createElement('span');
label.id = 'extractOption';
label.htmlFor = 'extractOption';
label.appendChild(document.createTextNode(''));
let pagesTotal;
if (pagesNumber) {
    pagesTotal = pagesNumber;
} else if (resultsNumber) {
    pagesTotal = Math.ceil(resultsNumber / resultsNumberPerPageDef);
}
label.textContent = `Extraire tous les résultats`;
checkboxDiv.appendChild(container);
checkboxDiv.appendChild(label);
extractButton.before(checkboxDiv);
extractButton.textContent = 'Tout extraire';
extractButton.before(maxDiv);

let extractAll = true;

checkbox.addEventListener('change', function () {
    if (checkbox.checked) {
        extractButton.textContent = 'Tout extraire';
        label.style.opacity = '1';
        maxDiv.style.display = 'none';
        extractAll = true;
    } else {
        extractButton.textContent = `Extraire l'échantillon`;
        label.style.opacity = '0.6';
        maxDiv.style.display = 'block';
        extractAll = false;
    }
});

// Create abort button
const abortButton = document.createElement('button');
abortButton.classList.add('abort-button');
abortButton.textContent = 'Annuler';
abortButton.addEventListener('click', function (event) {
    event.preventDefault();
    abortButton.textContent = 'Annulation en cours...';
    abortExtraction = true;
});
fieldset.appendChild(abortButton);

// Create a container for the extraction message and spinner
const extractionContainer = document.createElement('div');
extractionContainer.id = 'extractionContainer';
extractionContainer.style.display = 'none'; // Hide initially
fieldset.appendChild(extractionContainer);

// Create the loading spinner element
const spinner = document.createElement('div');
spinner.classList.add('spinner'); // Add a class for styling
extractionContainer.appendChild(spinner);

// Create the extraction message element
const extractionMessage = document.createElement('div');
extractionMessage.id = 'extractionMessage';
extractionMessage.textContent = 'Extraction lancée...';
extractionContainer.appendChild(extractionMessage);

// Function to update the range of results being processed
let pageNo;

// Create container for downloaded files list
const downloadedFilesContainer = document.createElement('div');
downloadedFilesContainer.classList.add('fileList');
downloadedFilesContainer.style.display = 'none';
fieldset.appendChild(downloadedFilesContainer);

let url = window.location.href;
let pubNameDef;
let abortExtraction;

// Listen to extraction button
extractButton.addEventListener('click', async function (event) {
    event.preventDefault();
    // Hide the extraction buttons
    extractButtonsContainer.style.display = 'none';
    abortButton.style.display = 'inline';

    // Show the extraction container
    extractionContainer.style.display = 'block';
    fieldset.style.cursor = 'wait';
    downloadedFilesContainer.textContent = '';
    downloadedFilesContainer.style.display = 'none';

    // Launch extraction
    const results = await performExtractAndSave(url);

    // Hide extraction tools
    checkboxDiv.style.display = 'none';
    maxDiv.style.display = 'none';
    select.style.display = 'none';
    extractButton.style.display = 'none';

    // Create reset button
    const resetBtn = document.createElement('button');
    resetBtn.classList.add('pcs-ui');
    resetBtn.textContent = 'Recommencer';
    resetBtn.onclick = function () {
        location.reload();
    };
    extractButtonsContainer.appendChild(resetBtn);

    // Collect extraction data
    let fetchedUrls = results[0];
    let downloadedFiles = results[1];
    let skippedFiles = results[2];
    let skippedTitles = results[3];
    let errorFiles = results[4];
    let errorMessages = results[5];

    // Hide the extraction container
    extractionContainer.style.display = 'none';
    extractionMessage.textContent = 'Extraction lancée...';
    fieldset.style.cursor = '';

    // Reset abort button
    abortButton.style.display = 'none';
    abortButton.textContent = 'Annuler';

    // Restore extraction buttons
    extractButtonsContainer.style.display = 'inline';

    // Display number and selection of downloaded articles
    downloadedFilesContainer.style.display = 'block';
    const downloadedFileLinks = fetchedUrls;
    downloadedFilesContainer.textContent = `\nFini !\n\n${downloadedFiles.length} article(s) téléchargé(s) :\n\n`;
    const downloadedFilesList = document.createElement('div');
    downloadedFilesList.style.fontWeight = 'normal';
    for (let i = 0; i < 20; i++) {
        let downloadedFileName = document.createElement('a');
        downloadedFileName.classList.add('dl-article');
        downloadedFileName.setAttribute('target', '_blank');
        let downloadedFileUrl = downloadedFileLinks[i];
        try {
            if (i === downloadedFiles.length) {
                break;
            } else if (i === 19 || i === downloadedFiles.length - 1) {
                downloadedFileName.textContent = downloadedFiles[i] + '...';
            } else {
                downloadedFileName.textContent = downloadedFiles[i] + ', ';
            }
            downloadedFileName.setAttribute('href', downloadedFileUrl);
            downloadedFilesList.appendChild(downloadedFileName);
        } catch (error) {
            console.error(
                'Error creating list of downloaded articles: ',
                error
            );
        }
    }
    downloadedFilesContainer.appendChild(downloadedFilesList);
    let fileTotal = downloadedFiles.length;

    // Display the number of premium articles skipped
    if (skippedFiles.length >= 1) {
        const skippedFilesWrapper = document.createElement('div');
        skippedFilesWrapper.classList.add('list-wrapper');
        skippedFilesWrapper.style.color = '#ffa500';
        if (skippedFiles.length === 1) {
            skippedFilesWrapper.textContent = `\n1 article réservé aux abonné·e·s a été ignoré.\n\n`;
        } else {
            skippedFilesWrapper.textContent = `\n${skippedFiles.length} articles réservés aux abonné·e·s ont été ignorés.\n\n`;
        }
        downloadedFilesContainer.appendChild(skippedFilesWrapper);
        const skippedFilesContainer = document.createElement('div');
        skippedFilesContainer.classList.add('list-container');
        skippedFilesWrapper.appendChild(skippedFilesContainer);
        const showSkippedListButton = document.createElement('div');
        showSkippedListButton.classList.add('show-article-list-button');
        showSkippedListButton.textContent = '🔽 Afficher la liste';
        const hideSkippedListButton = document.createElement('div');
        hideSkippedListButton.classList.add('hide-article-list-button');
        hideSkippedListButton.textContent = '🔼 Masquer la liste';
        hideSkippedListButton.style.display = 'none';
        skippedFilesContainer.appendChild(showSkippedListButton);
        skippedFilesContainer.appendChild(hideSkippedListButton);
        const skippedFilesLinksContainer = document.createElement('ul');
        skippedFilesLinksContainer.classList.add('article-list-container');
        skippedFilesLinksContainer.style.display = 'none';
        skippedFilesContainer.appendChild(skippedFilesLinksContainer);
        const skippedArticleList = skippedFiles;
        const skippedTitleList = skippedTitles;
        for (let i = 0; i < skippedArticleList.length; i++) {
            let skippedArticleUrl = skippedArticleList[i];
            try {
                const skippedArticleItem = document.createElement('li');
                skippedArticleItem.style.listStyleType = 'disc';
                skippedArticleItem.style.marginLeft = '2em';
                const skippedArticleLink = document.createElement('a');
                skippedArticleLink.classList.add('skipped-link');
                skippedArticleLink.setAttribute('href', skippedArticleUrl);
                skippedArticleLink.setAttribute('target', '_blank');
                skippedArticleItem.appendChild(skippedArticleLink);
                if (skippedArticleUrl.startsWith('http:')) {
                    skippedArticleUrl = skippedArticleUrl.replace(
                        'http',
                        'https'
                    );
                }
                skippedArticleLink.textContent = skippedTitleList[i].trim();
                skippedFilesLinksContainer.appendChild(skippedArticleItem);
            } catch (error) {
                console.error('Error creating skipped list item: ', error);
            }
        }
        showSkippedListButton.addEventListener('click', function () {
            skippedFilesLinksContainer.style.display = 'block';
            hideSkippedListButton.style.display = 'block';
            showSkippedListButton.style.display = 'none';
        });
        hideSkippedListButton.addEventListener('click', function () {
            skippedFilesLinksContainer.style.display = 'none';
            hideSkippedListButton.style.display = 'none';
            showSkippedListButton.style.display = 'block';
        });
        fileTotal += skippedFiles.length;
    }

    // Display the number of results in error
    if (errorFiles.length >= 1) {
        const errorFilesWrapper = document.createElement('div');
        errorFilesWrapper.classList.add('list-wrapper');
        errorFilesWrapper.style.color = '#e60000';
        errorFilesWrapper.textContent = `\n${errorFiles.length} résultat(s) en erreur.\n\n`;
        downloadedFilesContainer.appendChild(errorFilesWrapper);
        const errorFilesContainer = document.createElement('div');
        errorFilesContainer.classList.add('list-container');
        errorFilesWrapper.appendChild(errorFilesContainer);
        const showErrorListButton = document.createElement('div');
        showErrorListButton.classList.add('show-article-list-button');
        showErrorListButton.textContent = '🔽 Afficher la liste';
        const hideErrorListButton = document.createElement('div');
        hideErrorListButton.classList.add('hide-article-list-button');
        hideErrorListButton.textContent = '🔼 Masquer la liste';
        hideErrorListButton.style.display = 'none';
        errorFilesContainer.appendChild(showErrorListButton);
        errorFilesContainer.appendChild(hideErrorListButton);
        const errorFilesLinksContainer = document.createElement('ul');
        errorFilesLinksContainer.classList.add('article-list-container');
        errorFilesLinksContainer.style.display = 'none';
        const errorArticleList = errorFiles;
        const errorMessageList = errorMessages;
        for (let i = 0; i < errorArticleList.length; i++) {
            const errorFileItem = document.createElement('li');
            errorFileItem.style.listStyleType = 'disc';
            errorFileItem.style.marginLeft = '2em';
            const errorFileLink = document.createElement('a');
            errorFileLink.classList.add('error-file-link');
            errorFileLink.setAttribute('href', errorArticleList[i]);
            errorFileLink.setAttribute('target', '_blank');
            errorFileLink.textContent = errorMessageList[i] + '\n';
            errorFileItem.appendChild(errorFileLink);
            errorFilesLinksContainer.appendChild(errorFileItem);
        }
        errorFilesContainer.appendChild(errorFilesLinksContainer);

        showErrorListButton.addEventListener('click', function () {
            errorFilesLinksContainer.style.display = 'block';
            hideErrorListButton.style.display = 'block';
            showErrorListButton.style.display = 'none';
        });
        hideErrorListButton.addEventListener('click', function () {
            errorFilesLinksContainer.style.display = 'none';
            hideErrorListButton.style.display = 'none';
            showErrorListButton.style.display = 'block';
        });
        fileTotal += errorFiles.length;
    }

    // Display total number of results processed
    const totalFilesContainer = document.createElement('div');
    totalFilesContainer.textContent = `\n${fileTotal} résultats traités.`;
    downloadedFilesContainer.appendChild(totalFilesContainer);

    // Calculate and display the number of lost results
    if (resultsNumber) {
        if (fileTotal < resultsNumber) {
            const fileDiff = resultsNumber - fileTotal;
            const lostFilesContainer = document.createElement('div');
            lostFilesContainer.style.color = 'blue';
            lostFilesContainer.textContent = `\n${fileDiff} résultat(s) non traité(s)`;
            downloadedFilesContainer.appendChild(lostFilesContainer);
        }
    }
});

// Extraction function
async function performExtractAndSave(url) {
    const searchInput = document.querySelector('input[name="search"]');
    searchTerm = searchInput.value;
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

    resultsNumberContainer = document.querySelector('p.css-1ycagq6');
    if (!resultsNumberContainer) {
        window.alert("Effectuez la recherche avant l'extraction");
        location.reload();
    }
    resultsNumber = Number(
        resultsNumberContainer.textContent.replaceAll(/\D/gu, '').trim()
    );

    if (extractAll) {
        maxResults = resultsNumber;
    }
    let resultIndex = 0;

    const zip = new JSZip();
    fetchedUrls = new Set();
    addedFileNames = new Set();
    skippedFiles = [];
    skippedTitles = [];
    errorFiles = [];
    errorMessages = [];

    try {
        let processedArticles = new Set();
        while (resultIndex <= maxResults) {
            let articles;

            let articleList = document.querySelector(articleListDef);
            articles = articleList.querySelectorAll(articlesDef);

            if (articles.length === 0) {
                return;
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

            for (u of urls) {
                if (resultIndex >= maxResults || abortExtraction) {
                    break;
                }
                try {
                    if (processedArticles.has(u)) {
                        continue;
                    }
                    processedArticles.add(u);
                    let errorMessage;
                    const contentResponse = await fetch(u);
                    if (!contentResponse.ok) {
                        errorMessage =
                            ' (' + u.substring(0, 20) + '... ne répond pas.)';
                        errorFiles.push(u);
                        errorMessages.push(errorMessage);
                        continue;
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
                            u.substring(0, 20) +
                            '... > n’est pas un article.';
                        errorFiles.push(u);
                        errorMessages.push(errorMessage);
                        continue;
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
                    if (premiumBanner) {
                        skippedFiles.push(u);
                        skippedTitles.push(titleDiv.textContent);
                        continue;
                    }

                    const subhedDiv = contentDoc.querySelector(subhedDivDef);

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
                        errorFiles.push(u);
                        errorMessages.push(errorMessage);
                        continue;
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
                        let filteredElements = textElements.filter(function (
                            node
                        ) {
                            let textContentExcluded = false;
                            let identifierExcluded = false;
                            // Check if the node's textContent includes any of the exclElementsText
                            if (exclElementsText) {
                                textContentExcluded = exclElementsText.some(
                                    function (e) {
                                        return node.textContent.includes(e);
                                    }
                                );
                            }

                            // Check if the node's identifier is in the exclElementsDef array
                            if (exclElementsDef) {
                                identifierExcluded = exclElementsDef.includes(
                                    node.className
                                );
                            }

                            if (textContentExcluded || identifierExcluded) {
                                excludedNodes.push(
                                    node + ', ' + node.textContent
                                );
                            }

                            // Exclude the node if either condition is true
                            return !(textContentExcluded || identifierExcluded);
                        });

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
                        .map((textElement) => textElement.textContent.trim())
                        .join('\n\n');

                    if (!text) {
                        errorMessage =
                            '“' +
                            titleDiv.textContent.trim() +
                            '...” n’est pas un article.';
                        errorFiles.push(u);
                        errorMessages.push(errorMessage);
                        continue;
                    }

                    let author;
                    if (authorElement) {
                        author = authorElement.textContent
                            .replace(/(von)|(Von)/gu, '')
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
                                    /\d{4}-\d{2}-\d{2}/.test(dateElementValue)
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
                                        buildDateFromNumberFormat(dateString);
                                } catch (error) {
                                    'Error building date for ' + u, error;
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
                                date = convertFrenchDateToISO(frenchDateString);
                            } else {
                                dateString = dateDiv.textContent
                                    .replace('Publié le')
                                    .trim();
                                date = buildDateFromNumberFormat(dateString);
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
                        date = buildDateFromUrl(u);
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
                        let pubNameSpan = contentDoc.querySelector(pubNameDef);
                        const brIndex = pubNameSpan.innerHTML.indexOf('<br>');
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
                        url = url.split('&')[0];
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

                    // Append a number to the file name to make it unique
                    while (addedFileNames.has(baseFileName)) {
                        baseFileName = `${
                            baseFileName.split(/_?\d?\./gu)[0]
                        }_${index}${extension}`;
                        index++;
                    }

                    fetchedUrls.add(u);
                    addedFileNames.add(baseFileName);

                    zip.file(baseFileName, fileContent);
                    resultIndex++;
                    extractionMessage.textContent = `Extraction de l'article ${resultIndex} sur ${maxResults} au format ${selectedFormat}...`;
                } catch (error) {
                    console.error('Error: ', error);
                }
            }
            if (abortExtraction) {
                break;
            } else if (
                resultIndex >= maxResults ||
                Array.from(processedArticles).length >= resultsNumber
            ) {
                break;
            } else {
                await clickNext();
            }
        }
    } catch (error) {
        console.error('Error: ' + error);
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
function clickNext() {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            try {
                const nextButton = document.querySelector(nextButtonDef);
                if (!nextButton) {
                    resolve();
                }
                nextButton.click();
                extractionMessage.textContent = `Expansion de la liste de résultats...`;
                resolve();
            } catch (error) {
                reject(error);
            }
        }, 1000);
        // }
    });
}

async function downloadZip(zipBlob, zipFileName) {
    let url = window.URL.createObjectURL(zipBlob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = zipFileName;
    anchor.click();
    window.URL.revokeObjectURL(url);
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
