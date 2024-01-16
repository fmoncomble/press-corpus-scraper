// contentScript.js
console.log('Figaro content script injected');

if (document.readyState !== 'loading') {
    console.log('Page ready, firing function');
    updateRange();
} else {
    document.addEventListener('DOMContentLoaded', () => {
        console.log('Page was not ready, placing code here');
        updateRange();
    });
}

// Inject the button into the page
const anchor = document.querySelector('.resultats');

const fieldset = document.createElement('fieldset');
fieldset.textContent = 'Extraire et télécharger les articles au format désiré';
anchor.appendChild(fieldset);

const legend = document.createElement('legend');
const legendText = document.createElement('div');
legendText.classList.add('legend-text');
legendText.textContent = 'Figaro extractor';
legend.appendChild(legendText);
fieldset.appendChild(legend);

const extractButtonsContainer = document.createElement('div');
extractButtonsContainer.style.display = 'inline';

let selectedFormat = 'txt';

const select = document.createElement('select');
const txt = new Option('TXT', 'txt');
const xml = new Option('XML', 'xml');
select.appendChild(txt);
select.appendChild(xml);

console.log('Output format: ', selectedFormat);

select.addEventListener('change', function () {
    selectedFormat = this.value;
    console.log('Output format: ', selectedFormat);
});

const extractButton = document.createElement('button');
extractButton.id = 'extractButton';
extractButton.textContent = 'Extraire';

extractButtonsContainer.appendChild(extractButton);
extractButtonsContainer.appendChild(select);
fieldset.appendChild(extractButtonsContainer);

// Create abort button
const abortButton = document.createElement('button');
abortButton.classList.add('abort-button');
abortButton.textContent = 'Annuler';
abortButton.addEventListener('click', () => {
    console.log('Abort button clicked');
    abortButton.textContent = 'Annulation en cours...';
    browser.runtime.sendMessage(
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

function updateRange() {
    console.log('updateRange function invoked');
    let port;
    browser.runtime.onConnect.addListener(connect);
    function connect(p) {
        port = p;
        console.assert(port.name === 'backgroundjs');
        port.onMessage.addListener((msg) => respond(msg));
        function respond(msg) {
            if (msg) {
                console.log('Message from background: ', msg);
                console.log('Updating range');
                extractionMessage.textContent = `Extraction de la page ${msg.pageNo} sur ${msg.resultsPageNumber} au format ${selectedFormat}...`;
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
extractButton.addEventListener('click', () => {
    // Hide the extraction buttons
    extractButtonsContainer.style.display = 'none';
    abortButton.style.display = 'inline';

    // Show the extraction container
    extractionContainer.style.display = 'block';
    downloadedFilesContainer.textContent = '';
    downloadedFilesContainer.style.display = 'none';

    browser.runtime.sendMessage(
        {
            action: 'performExtraction',
            url: window.location.href,
            format: selectedFormat,
        },
        (response) => {
            console.log('Response object:', response); // Log the entire response object

            // Hide the extraction container
            extractionContainer.style.display = 'none';
            extractionMessage.textContent = 'Launching extraction...';

            // Reset abort button
            abortButton.style.display = 'none';
            abortButton.textContent = 'Abort';

            // Restore extraction buttons
            extractButtonsContainer.style.display = 'inline';

            if (response.success) {
                // Display number and selection of downloaded articles
                downloadedFilesContainer.style.display = 'block';
                downloadedFilesContainer.textContent = `\nFini !\n\n${response.downloadedFiles.length} article(s) téléchargé(s) :\n`;
                const downloadedFilesList = document.createElement('div');
                downloadedFilesList.style.fontWeight = 'normal';
                downloadedFilesList.textContent = `${response.downloadedFiles
                    .slice(0, 20)
                    .join(', ')}...\n`;
                downloadedFilesContainer.appendChild(downloadedFilesList);
                let fileTotal = response.downloadedFiles.length;
                // Display the number of premium articles skipped
                if (response.skippedFiles.length >= 1) {
                    const skippedFilesWrapper = document.createElement('div');
                    skippedFilesWrapper.classList.add('list-wrapper');
                    skippedFilesWrapper.style.color = '#ffa500';
                    skippedFilesWrapper.textContent = `\n${response.skippedFiles.length} articles réservés aux abonné·e·s ont été ignorés.\n`;
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
                    skippedArticleList.forEach(async (articleUrl) => {
                        console.log('skipped URL: ' + articleUrl);

                        try {
                            const skippedArticleItem =
                                document.createElement('li');
                            skippedArticleItem.style.listStyleType = 'disc';
                            skippedArticleItem.style.marginLeft = '2em';
                            const skippedArticleLink =
                                document.createElement('a');
                            skippedArticleLink.setAttribute('href', articleUrl);
                            skippedArticleLink.setAttribute('target', '_blank');
                            skippedArticleItem.appendChild(skippedArticleLink);
                            const response = await fetch(articleUrl);
                            const html = await response.text();

                            const parser = new DOMParser();
                            const doc = parser.parseFromString(
                                html,
                                'text/html'
                            );

                            const titleElement = doc.querySelector('h1');
                            if (titleElement) {
                                const title = titleElement.textContent;
                                skippedArticleLink.textContent = title + '\n';
                            } else {
                                skippedArticleLink.textContent = 'Untitled\n';
                            }

                            skippedFilesLinksContainer.appendChild(
                                skippedArticleItem
                            );
                        } catch (error) {
                            console.error(
                                'Error fetching or parsing the article:',
                                error
                            );
                        }
                    });

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
                    errorFilesWrapper.textContent = `\n${response.errorFiles.length} résultat(s) en erreur.\n`;
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
                    errorArticleList.forEach((errorFileUrl) => {
                        console.log('Error file URL: ' + errorFileUrl);
                        const errorFileItem = document.createElement('li');
                        errorFileItem.style.listStyleType = 'disc';
                        errorFileItem.style.marginLeft = '2em';
                        const errorFileLink = document.createElement('a');
                        errorFileLink.classList.add('error-file-link');
                        errorFileLink.setAttribute('href', errorFileUrl);
                        errorFileLink.setAttribute('target', '_blank');
                        errorFileLink.textContent = errorFileUrl + '\n';
                        errorFileItem.appendChild(errorFileLink);
                        errorFilesLinksContainer.appendChild(errorFileItem);
                    });
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
                // Calculate and display the number of lost results
                const resultsNumberContainer = document.querySelector(
                    'div.resultats div.facettes__nombre'
                );
                const resultsNumberString = resultsNumberContainer.textContent
                    .replace('résultats', '')
                    .trim();
                const resultsNumber = Number(resultsNumberString);
                if (fileTotal < resultsNumber) {
                    const fileDiff = resultsNumber - fileTotal;
                    const lostFilesContainer = document.createElement('div');
                    lostFilesContainer.style.color = 'blue';
                    lostFilesContainer.textContent = `\n${fileDiff} résultat(s) introuvable(s)... 👀`;
                    downloadedFilesContainer.appendChild(lostFilesContainer);
                }
            } else {
                console.error('Error:', response.error);
                // Handle error
            }
        }
    );
});
