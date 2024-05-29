// window.onload = function () {
    console.log(`L'Humanité PCS script injected`);

    // -------- Début du code à modifier pour chaque site de presse -------- //

    // Pour les valeurs non existantes, indiquer 'null' (sans guillemets)

    // Indiquer le titre du journal
    const paperName = `L'Humanité`;

    // Désigner le point d'insertion de l'encadré de l'extension
    const anchorDef = 'form[action*="?s="]';

    // --- Structure de la page de résultats --- //

    // Indiquer entre guillemets simples les attributs HTML (tag, class et/ou id) des éléments pertinents de la page. S'ils n'existent pas ou ne sont pas utiles, indiquer 'null' (sans guillemets)

    // Où retrouver les termes de recherche
    const searchTermContainerDef = 'input.t-base-medium[value]';
    const searchTerm = document
        .querySelector(searchTermContainerDef)
        .value.trim();
    // S'il est présent : élément contenant le nombre total de résultats
    const resultsNumberContainer = null;
    const resultsNumber = null;
    // S'il est pertinent : nombre de résultats par page
    const resultsNumberPerPageDef = null;
    let pagesNumber; // S'il est présent sur la page (ex. boutons de pagination en bas de la page) : nombre total de pages de résultats. Sinon, passer les lignes suivantes en commentaire (les faire précéder de deux barres obliques //)
    pagesNumber = 1;
    const paginationContainer = document.querySelector(
        'div.u-fill-space.u-flex.u-justify-content-center'
    );
    let lastPageButton;
    if (paginationContainer) {
        lastPageButton = paginationContainer.lastElementChild;
        pagesNumber = lastPageButton.textContent;
    }
    // Elément contenant la liste des résultats de recherche
    const articleListDef = 'div.gs-container.single__content.search__content';
    // Elément contenant chaque résultat
    const articlesDef = 'article.article-card.article-small.u-relative';
    // Logique de pagination : si les pages sont numérotées dans l'URL (parfois seulement à partir de la 2e page de résultats, ex. https://www.journal.fr/recherche/?keywords=termes%20de%20recherche&page=2), indiquer 'true', sinon 'false' (sans guillemets), puis indiquer le nom du paramètre ('page', 'p' ou autre)
    const nextPageDef = true;
    const pageParam = 'page';
    // Logique de pagination : si les pages ne sont pas numérotées dans l'URL, identifier le bouton permettant de passer à la page suivante
    const nextButtonDef = null;

    // --- Structure des pages d'articles --- //

    // Identifier le bouton d'abonnement
    const aboBtnDef = 'a.header_abo';
    // Pour les articles réservés aux abonné.e.s : élément contenant la bannière "Réservé aux abonnés"
    const premiumBannerDef = '.--paywall';
    // Si la bannière se situe dans l'en-tête d'article : élément de l'en-tête
    const articleHeaderDef = null;
    // Elément du titre de l'article
    const titleDivDef = 'h1';
    // Elément du chapô
    const subhedDivDef = 'p.chapo';
    // Elément du corps de l'article
    const bodyDivDef =
        'div.rich-text:not(.u-margin-b-3.u-padding-b-0.u-padding-t-0';
    // Elément du nom de l'auteur.e
    const authorElementDef = 'span.single__author__name';
    // Logique de date :
    // - si la date est présente dans l'URL (ex. https://www.journal.fr/2024/01/20/titre-de-larticle), indiquer 'url' ;
    // - si la date n'est pas présente dans l'URL mais dans un élément HTML de la page, indiquer 'node'. S'il existe, privilégier un élément contenant la date au format ISO (commençant par AAAA-MM-JJ).
    const dateLogic = 'node';
    // Si la logique de date est 'node', indiquer l'élément où se trouve la date. Si elle est codée comme attribut d'un élément (ex. <time datetime='AAAA-MM-JJTHH:MM:SS'>), préciser également le nom de l'attribut.
    const dateElementDef = 'meta[property="article:published_time"]';
    const dateAttributeDef = 'content';
    // Logique de date de secours : indiquer un mot-clef permettant de trouver la date de l'article dans la page
    const dateStringDef = 'Publié';
    // Eléments textuels à inclure (paragraphes de texte, sous-titres, etc.)
    const textElementsDef = 'p, h2';
    // Éléments textuels à exclure (le cas échéant, publicités, liens vers d'autres contenus, etc. partageant les mêmes identifiants que les éléments à inclure) sous forme d'array de contenus de texte (ex. ['LIRE AUSSI', 'VOIR AUSSI']).
    const exclElementsText = ['Inscrivez-vous et recevez chaque matin '];
    // Éléments à exclure, sous forme d'array de classes (ex. ['.advert', '.ext-link'])
    const exclElementsDef = null;

    // ------------- Fin du code à modifier ----------------------------//
    //////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////
    // ------------- Ne rien modifier sous cette ligne ---------------- //
    var variableDiv = document.createElement('div');
    variableDiv.classList.add('pcs-variables');
    variableDiv.style.display = 'none';
    var variables = {
        paperName: paperName,
        anchorDef: anchorDef,
        searchTerm: searchTerm,
        resultsNumberContainer: resultsNumberContainer,
        resultsNumber: resultsNumber,
        resultsNumberPerPageDef: resultsNumberPerPageDef,
        pagesNumber: pagesNumber,
        articleListDef: articleListDef,
        articlesDef: articlesDef,
        nextPageDef: nextPageDef,
        pageParam: pageParam,
        nextButtonDef: nextButtonDef,
        aboBtnDef: aboBtnDef,
        premiumBannerDef: premiumBannerDef,
        articleHeaderDef: articleHeaderDef,
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
    };
    variableDiv.textContent = JSON.stringify(variables);
    document.body.appendChild(variableDiv);

//     const event = new CustomEvent('script1Loaded');
//     window.dispatchEvent(event);
// };
