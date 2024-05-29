// window.onload = function () {
    console.log('Le Point PCS script injected');

    // -------- Début du code à modifier pour chaque site de presse -------- //

    // Pour les valeurs non existantes, indiquer 'null' (sans guillemets)

    // Indiquer le titre du journal
    const paperName = 'Le Point';

    // Désigner le point d'insertion de l'encadré de l'extension
    const anchorDef = 'form[name="sortForm"]';

    // --- Structure de la page de résultats --- //

    // Indiquer entre guillemets simples les attributs HTML (tag, class et/ou id) des éléments pertinents de la page. S'ils n'existent pas ou ne sont pas utiles, indiquer 'null' (sans guillemets)

    // Où retrouver les termes de recherche
    const searchTermContainerDef = 'input[name="query"]';
    const searchTerm = document
        .querySelector(searchTermContainerDef)
        .value.trim();
    // S'il est présent : élément contenant le nombre total de résultats
    const resultsNumberContainer = document.querySelector('div.col.w50.vm');
    console.log(
        'String containing number of results: ',
        resultsNumberContainer.textContent
    );
    const resultsNumberString = resultsNumberContainer.textContent
        .split('sur')[1]
        .replaceAll(/\D/gu, '')
        .trim();
    console.log('Clean numbers string: ', resultsNumberString);
    const resultsNumber = Number(resultsNumberString);
    console.log('Total number of results = ', resultsNumber);
    // S'il est pertinent : nombre de résultats par page
    const resultsNumberPerPageDef = 10;
    let pagesNumber; // S'il est présent sur la page (ex. boutons de pagination en bas de la page) : nombre total de pages de résultats. Sinon, passer les lignes suivantes en commentaire (les faire précéder de deux barres obliques //)
    pagesNumber = 1;
    const paginationContainer = document.querySelector('.pagination.bottom');
    let lastPageButton;
    if (paginationContainer) {
        let pageNumbers = paginationContainer.children;
        if (pageNumbers.length > 1) {
            lastPageButton = pageNumbers[pageNumbers.length - 2];
            pagesNumber = lastPageButton.textContent;
        }
    }
    // Elément contenant la liste des résultats de recherche
    const articleListDef = 'div.list-view';
    // Elément contenant chaque résultat
    const articlesDef = 'article.art-small';
    // Logique de pagination : si les pages sont numérotées dans l'URL (parfois seulement à partir de la 2e page de résultats, ex. https://www.journal.fr/recherche/?keywords=termes%20de%20recherche&page=2), indiquer 'true', sinon 'false' (sans guillemets), puis indiquer le nom du paramètre ('page', 'p' ou autre)
    const nextPageDef = true;
    const pageParam = 'page';
    // Logique de pagination : si les pages ne sont pas numérotées dans l'URL, identifier le bouton permettant de passer à la page suivante
    const nextButtonDef = null;

    // --- Structure des pages d'articles --- //

    // Identifier le bouton d'abonnement
    const aboBtnDef = 'a.Button.Button--premium';
    // Pour les articles réservés aux abonné.e.s : élément contenant la bannière "Réservé aux abonnés"
    const premiumBannerDef = 'aside#article-reserve-aux-abonnes';
    // Si la bannière se situe dans l'en-tête d'article : élément de l'en-tête
    const articleHeaderDef = 'header#haut';
    // Elément du titre de l'article
    const titleDivDef = 'h1';
    // Elément du chapô
    const subhedDivDef = 'p.chapo';
    // Elément du corps de l'article
    const bodyDivDef = 'div#contenu.article-styles, div.ArticleBody';
    // Elément du nom de l'auteur.e
    const authorElementDef = 'p.author';
    // Logique de date :
    // - si la date est présente dans l'URL (ex. https://www.journal.fr/2024/01/20/titre-de-larticle), indiquer 'url' ;
    // - si la date n'est pas présente dans l'URL mais dans un élément HTML de la page, indiquer 'node'. S'il existe, privilégier un élément contenant la date au format ISO (commençant par AAAA-MM-JJ).
    const dateLogic = 'node';
    // Si la logique de date est 'node', indiquer l'élément où se trouve la date. Si elle est codée comme attribut d'un élément (ex. <time datetime='AAAA-MM-JJTHH:MM:SS'>), préciser également le nom de l'attribut.
    const dateElementDef = 'time';
    const dateAttributeDef = null;
    // Logique de date de secours : indiquer un mot-clef permettant de trouver la date de l'article dans la page
    const dateStringDef = 'Publié';
    // Eléments textuels à inclure (paragraphes de texte, sous-titres, etc.)
    const textElementsDef = 'p, h2';
    // Éléments textuels à exclure (le cas échéant, publicités, liens vers d'autres contenus, etc. partageant les mêmes identifiants que les éléments à inclure) sous forme d'array de contenus de texte (ex. ['LIRE AUSSI', 'VOIR AUSSI']).
    const exclElementsText = [
        'À LIRE AUSSI',
        "Votre inscription a bien été prise en compte avec l'adresse email :",
        'Pour découvrir toutes nos autres newsletters, rendez-vous ici',
        'En vous inscrivant, vous acceptez les conditions générales d’utilisations',
        'Recevez en avant-première les informations et analyses politiques de la rédaction du Point',
        'Recevez l’information analysée et décryptée par la rédaction du Point.',
        'Recevez l’actualité culturelle de la semaine à ne pas manquer',
    ];
    // Éléments à exclure, sous forme d'array de classes d'éléments (ex. ['advert', 'ext-link'])
    const exclElementsDef = [
        'period',
        'msg-invalid wrong-email',
        'msg-invalid empty-email',
    ];

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

    // const event = new CustomEvent('script1Loaded');
    // window.dispatchEvent(event);
// };
