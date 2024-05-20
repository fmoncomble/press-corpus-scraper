// ------------- Ne rien modifier sous cette ligne ---------------- //
console.log('PCS config script injected');

if (document.readyState !== 'loading') {
    console.log('Page ready, firing function');
    updateRange();
} else {
    document.addEventListener('DOMContentLoaded', () => {
        console.log('Page was not ready, placing code here');
        updateRange();
    });
}

(function () {
    var variableDiv = document.querySelector('.pcs-variables');
    var variables = JSON.parse(variableDiv.textContent);
    var paperName = variables.paperName;
    var anchor = variables.anchor;
    var searchTerm = variables.searchTerm;
    var resultsNumberContainer = variables.resultsNumberContainer;
    var resultsNumber = variables.resultsNumber;
    var resultsNumberPerPageDef = variables.resultsNumberPerPageDef;
    var pagesNumber = variables.pagesNumber;
    var articleListDef = variables.articleListDef;
    var nextPageDef = variables.nextPageDef;
    var pageParam = variables.pageParam;
    var nextButtonDef = variables.nextButtonDef;
    var aboBtnDef = variables.aboBtnDef;
    var premiumBannerDef = variables.premiumBannerDef;
    var articleHeaderDef = variables.articleHeaderDef;
    var titleDivDef = variables.titleDivDef;
    var subhedDivDef = variables.subhedDivDef;
    var bodyDivDef = variables.bodyDivDef;
    var authorElementDef = variables.authorElementDef;
    var dateLogic = variables.dateLogic;
    var dateElementDef = variables.dateElementDef;
    var dateAttributeDef = variables.dateAttributeDef;
    var dateStringDef = variables.dateStringDef;
    var textElementsDef = variables.textElementsDef;
    var exclElementsText = variables.exclElementsText;
    var exclElementsDef = variables.exclElementsDef;
})();

const fieldset = document.createElement('fieldset');
fieldset.classList.add('pcs-ui');
const fieldsetText = document.createElement('div');
fieldsetText.classList.add('pcs-fs-text');
fieldsetText.textContent =
    'Extraire et télécharger les articles au format souhaité';
fieldset.appendChild(fieldsetText);
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
select.appendChild(txt);
select.appendChild(xml);

console.log('Output format: ', selectedFormat);

select.addEventListener('change', function () {
    selectedFormat = this.value;
    console.log('Output format: ', selectedFormat);
});

const extractButton = document.createElement('button');
extractButton.classList.add('pcs-ui');
extractButton.id = 'extractButton';
extractButton.textContent = 'Extraire cette page';

extractButtonsContainer.appendChild(extractButton);
extractButtonsContainer.appendChild(select);
fieldset.appendChild(extractButtonsContainer);

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
label.textContent = `Extraire les ${pagesTotal} pages de résultats`;
checkboxDiv.appendChild(container);
checkboxDiv.appendChild(label);
if (pagesTotal > 1) {
    extractButton.before(checkboxDiv);
    extractButton.textContent = 'Tout extraire';
}

let extractAll = true;

checkbox.addEventListener('change', function () {
    if (checkbox.checked) {
        console.log('Full extraction ahead');
        extractButton.textContent = 'Tout extraire';
        label.style.opacity = '1';
        extractAll = true;
    } else {
        console.log('Single page extraction');
        extractButton.textContent = 'Extraire cette page';
        label.style.opacity = '0.6';
        extractAll = false;
    }
});

// Create abort button
const abortButton = document.createElement('button');
abortButton.classList.add('abort-button');
abortButton.textContent = 'Annuler';
abortButton.addEventListener('click', function (event) {
    event.preventDefault();
    console.log('Abort button clicked');
    abortButton.textContent = 'Annulation en cours...';
    chrome.runtime.sendMessage(
        {
            action: 'abortExtraction',
        },
        (response) => {
            console.log('Extraction aborted');
        }
    );
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
function updateRange() {
    console.log('updateRange function invoked');
    let port;
    chrome.runtime.onConnect.addListener(connect);
    function connect(p) {
        port = p;
        console.assert(port.name === 'backgroundjs');
        port.onMessage.addListener((msg) => respond(msg));
        function respond(msg) {
            if (msg) {
                console.log('Message from background: ', msg);
                console.log('Updating range');
                pageNo = msg.sentPageNo;
                extractionMessage.textContent = `Extraction de la page ${msg.sentPageNo} sur ${pagesTotal} au format ${selectedFormat}...`;
            } else {
                console.error('No message from background');
            }
        }
    }
}

// Create container for downloaded files list
const downloadedFilesContainer = document.createElement('div');
downloadedFilesContainer.classList.add('fileList');
downloadedFilesContainer.style.display = 'none';
fieldset.appendChild(downloadedFilesContainer);

// Message passing to notify the background script when the button is clicked
extractButton.addEventListener('click', function (event) {
    event.preventDefault();
    console.log('Button clicked: firing extraction');
    // Hide the extraction buttons
    extractButtonsContainer.style.display = 'none';
    abortButton.style.display = 'inline';

    // Show the extraction container
    extractionContainer.style.display = 'block';
    fieldset.style.cursor = 'wait';
    downloadedFilesContainer.textContent = '';
    downloadedFilesContainer.style.display = 'none';

    chrome.runtime.sendMessage(
        {
            action: 'performExtraction',
            url: window.location.href,
            format: selectedFormat,
            extractAll: extractAll,
            paperName: paperName,
            aboBtnDef: aboBtnDef,
            searchTerm: searchTerm,
            resultsNumber: resultsNumber,
            resultsNumberPerPageDef: resultsNumberPerPageDef,
            articleListDef: articleListDef,
            articlesDef: articlesDef,
            articleHeaderDef: articleHeaderDef,
            premiumBannerDef: premiumBannerDef,
            titleDivDef: titleDivDef,
            subhedDivDef: subhedDivDef,
            bodyDivDef: bodyDivDef,
            authorElementDef: authorElementDef,
            dateLogic: dateLogic,
            dateElementDef: dateElementDef,
            dateAttributeDef: dateAttributeDef,
            dateStringDef: dateStringDef,
            textElementsDef: textElementsDef,
            exclElementsText: exclElementsText,
            exclElementsDef: exclElementsDef,
            nextPageDef: nextPageDef,
            pageParam: pageParam,
            nextButtonDef: nextButtonDef,
        },
        (response) => {
            console.log('Response object:', response); // Log the entire response object

            // Hide the extraction container
            extractionContainer.style.display = 'none';
            extractionMessage.textContent = 'Extraction lancée...';
            fieldset.style.cursor = '';

            // Reset abort button
            abortButton.style.display = 'none';
            abortButton.textContent = 'Annuler';

            // Restore extraction buttons
            extractButtonsContainer.style.display = 'inline';

            if (response.success) {
                // Display number and selection of downloaded articles
                downloadedFilesContainer.style.display = 'block';
                const downloadedFiles = response.downloadedFiles;
                console.log('Downloaded files: ', downloadedFiles);
                const downloadedFileLinks = response.fetchedUrls;
                console.log('Downloaded file links: ', downloadedFileLinks);
                downloadedFilesContainer.textContent = `\nFini !\n\n${pageNo} page(s) traitée(s), ${downloadedFiles.length} article(s) téléchargé(s) :\n\n`;
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
                        } else if (
                            i === 19 ||
                            i === downloadedFiles.length - 1
                        ) {
                            downloadedFileName.textContent =
                                downloadedFiles[i] + '...';
                        } else {
                            downloadedFileName.textContent =
                                downloadedFiles[i] + ', ';
                        }
                        downloadedFileName.setAttribute(
                            'href',
                            downloadedFileUrl
                        );
                        downloadedFilesList.appendChild(downloadedFileName);
                    } catch (error) {
                        console.error(
                            'Error creating list of downloaded articles: ',
                            error
                        );
                    }
                }
                downloadedFilesContainer.appendChild(downloadedFilesList);
                let fileTotal = response.downloadedFiles.length;

                // Display the number of premium articles skipped
                if (response.skippedFiles.length >= 1) {
                    const skippedFilesWrapper = document.createElement('div');
                    skippedFilesWrapper.classList.add('list-wrapper');
                    skippedFilesWrapper.style.color = '#ffa500';
                    if (response.skippedFiles.length === 1) {
                        skippedFilesWrapper.textContent = `\n1 article réservé aux abonné·e·s a été ignoré.\n\n`;
                    } else {
                        skippedFilesWrapper.textContent = `\n${response.skippedFiles.length} articles réservés aux abonné·e·s ont été ignorés.\n\n`;
                    }
                    downloadedFilesContainer.appendChild(skippedFilesWrapper);
                    const skippedFilesContainer = document.createElement('div');
                    skippedFilesContainer.classList.add('list-container');
                    skippedFilesWrapper.appendChild(skippedFilesContainer);
                    const showSkippedListButton = document.createElement('div');
                    showSkippedListButton.classList.add(
                        'show-article-list-button'
                    );
                    showSkippedListButton.textContent = '🔽 Afficher la liste';
                    const hideSkippedListButton = document.createElement('div');
                    hideSkippedListButton.classList.add(
                        'hide-article-list-button'
                    );
                    hideSkippedListButton.textContent = '🔼 Masquer la liste';
                    hideSkippedListButton.style.display = 'none';
                    skippedFilesContainer.appendChild(showSkippedListButton);
                    skippedFilesContainer.appendChild(hideSkippedListButton);
                    const skippedFilesLinksContainer =
                        document.createElement('ul');
                    skippedFilesLinksContainer.classList.add(
                        'article-list-container'
                    );
                    skippedFilesLinksContainer.style.display = 'none';
                    skippedFilesContainer.appendChild(
                        skippedFilesLinksContainer
                    );
                    const skippedArticleList = response.skippedFiles;
                    const skippedTitleList = response.skippedTitles;
                    for (let i = 0; i < skippedArticleList.length; i++) {
                        let skippedArticleUrl = skippedArticleList[i];
                        console.log('skipped URL: ' + skippedArticleUrl);
                        try {
                            const skippedArticleItem =
                                document.createElement('li');
                            skippedArticleItem.style.listStyleType = 'disc';
                            skippedArticleItem.style.marginLeft = '2em';
                            const skippedArticleLink =
                                document.createElement('a');
                            skippedArticleLink.classList.add('skipped-link');
                            skippedArticleLink.setAttribute(
                                'href',
                                skippedArticleUrl
                            );
                            skippedArticleLink.setAttribute('target', '_blank');
                            skippedArticleItem.appendChild(skippedArticleLink);
                            if (skippedArticleUrl.startsWith('http:')) {
                                skippedArticleUrl = skippedArticleUrl.replace(
                                    'http',
                                    'https'
                                );
                            }
                            skippedArticleLink.textContent =
                                skippedTitleList[i].trim();
                            skippedFilesLinksContainer.appendChild(
                                skippedArticleItem
                            );
                        } catch (error) {
                            console.error(
                                'Error creating skipped list item: ',
                                error
                            );
                        }
                    }
                    showSkippedListButton.addEventListener(
                        'click',
                        function () {
                            skippedFilesLinksContainer.style.display = 'block';
                            hideSkippedListButton.style.display = 'block';
                            showSkippedListButton.style.display = 'none';
                        }
                    );
                    hideSkippedListButton.addEventListener(
                        'click',
                        function () {
                            skippedFilesLinksContainer.style.display = 'none';
                            hideSkippedListButton.style.display = 'none';
                            showSkippedListButton.style.display = 'block';
                        }
                    );
                    fileTotal += response.skippedFiles.length;
                }

                // Display the number of results in error
                if (response.errorFiles.length >= 1) {
                    const errorFilesWrapper = document.createElement('div');
                    errorFilesWrapper.classList.add('list-wrapper');
                    errorFilesWrapper.style.color = '#e60000';
                    errorFilesWrapper.textContent = `\n${response.errorFiles.length} résultat(s) en erreur.\n\n`;
                    downloadedFilesContainer.appendChild(errorFilesWrapper);
                    const errorFilesContainer = document.createElement('div');
                    errorFilesContainer.classList.add('list-container');
                    errorFilesWrapper.appendChild(errorFilesContainer);
                    const showErrorListButton = document.createElement('div');
                    showErrorListButton.classList.add(
                        'show-article-list-button'
                    );
                    showErrorListButton.textContent = '🔽 Afficher la liste';
                    const hideErrorListButton = document.createElement('div');
                    hideErrorListButton.classList.add(
                        'hide-article-list-button'
                    );
                    hideErrorListButton.textContent = '🔼 Masquer la liste';
                    hideErrorListButton.style.display = 'none';
                    errorFilesContainer.appendChild(showErrorListButton);
                    errorFilesContainer.appendChild(hideErrorListButton);
                    const errorFilesLinksContainer =
                        document.createElement('ul');
                    errorFilesLinksContainer.classList.add(
                        'article-list-container'
                    );
                    errorFilesLinksContainer.style.display = 'none';
                    const errorArticleList = response.errorFiles;
                    console.log('Error article list: ', errorArticleList);
                    const errorMessageList = response.errorMessages;
                    console.log('Error message list: ', errorMessageList);
                    for (let i = 0; i < errorArticleList.length; i++) {
                        console.log('Error file URL: ' + errorArticleList[i]);
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
                    fileTotal += response.errorFiles.length;
                }

                // Display total number of results processed
                const totalFilesContainer = document.createElement('div');
                totalFilesContainer.textContent = `\n${fileTotal} résultats traités.`;
                downloadedFilesContainer.appendChild(totalFilesContainer);

                // Calculate and display the number of lost results
                if (resultsNumber) {
                    if (fileTotal < resultsNumber) {
                        const fileDiff = resultsNumber - fileTotal;
                        const lostFilesContainer =
                            document.createElement('div');
                        lostFilesContainer.style.color = 'blue';
                        lostFilesContainer.textContent = `\n${fileDiff} résultat(s) non traité(s)`;
                        downloadedFilesContainer.appendChild(
                            lostFilesContainer
                        );
                    }
                }
            } else {
                console.error('Error:', response.error);
            }
        }
    );
});
