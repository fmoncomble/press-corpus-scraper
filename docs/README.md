([**English version**](https://fmoncomble.github.io/press-corpus-scraper/README_EN.html))  

Une extension pour extraire et télécharger des articles de presse à des fins de fouille textuelle.  
  
🚨 **Nouveau !** 🚨 Prise en charge d'Europresse : connectez-vous via [le portail de votre établissement](europresse-list.md).
### Citer ce programme
Si vous utilisez cette extension pour vos travaux de recherche, merci de la référencer de la façon suivante :  
  
Moncomble, F. (2024). *Press Corpus Scraper* (Version 0.8) [JavaScript]. Arras, France : Université d’Artois. Disponible à l'adresse : https://fmoncomble.github.io/press-corpus-scraper/


## Installation
### Firefox (recommandé : mises à jour automatiques)
[![Firefox add-on](https://github.com/fmoncomble/Figaro_extractor/assets/59739627/e4df008e-1aac-46be-a216-e6304a65ba97)](https://github.com/fmoncomble/press-corpus-scraper/releases/latest/download/pcs.xpi)

### Chrome/Edge
- [Télécharger l'archive .zip](https://github.com/fmoncomble/press-corpus-scraper/releases/latest/download/pcs.zip)
- Décompresser l'archive
- Ouvrir le gestionnaire d'extensions : `chrome://extensions` ou `edge://extensions`
  - Activer le « mode développeur »
  - Cliquer sur « charger l'extension non empaquetée »
  - Sélectionner le dossier décompressé
  
Pensez à épingler l'extension à la barre d'outils :  
<img src="images/pin-firefox.png" style="display: inline"/><img src="images/pin-chrome.png" style="display: inline"/>
 
## Mode d'emploi
- Cliquer sur l'icône dans la barre d'outils et sélectionner une source,
- ou naviguer vers un site pris en charge :
    - [*Le Figaro*](https://recherche.lefigaro.fr/)
    - [*L'Humanité*](https://www.humanite.fr/)
    - [*Le Monde*](https://www.lemonde.fr/recherche/)
    - [*Le Point*](https://www.lepoint.fr/recherche/index.php)
    - [*The Guardian*](https://www.theguardian.com/)
    - [*The New York Times*](https://www.nytimes.com/)
    - [*Deutsches Zeitungsportal*](https://www.deutsche-digitale-bibliothek.de/newspaper)
    - ou le portail **Europresse** de votre établissement : [liste des établissements pris en charge](europresse-list.md)
- **Sites français / Europresse :**
    - Effectuer une recherche par mot-clef
    - (Facultatif : affiner la recherche)
    - Un encadré apparait en haut de la page de résultats. Exemple du *Monde* :
      <img width="704" alt="Screenshot 2024-02-03 at 08 09 21" src="https://github.com/fmoncomble/press-corpus-scraper/assets/59739627/07b0a58a-1730-4652-9eff-f2d010a0a9ec"> 
    - Choisir l'option d'extraction puis cliquer sur `Extraire`
      - Les articles réservés aux abonnés ne sont pas téléchargés mais listés sous forme de liens
      - Les articles que l'extension échoue à extraire sont listés sous forme de liens 
      - A l'issue de l'extraction :
        - Firefox : l'archive .zip contenant les fichiers est automatiquement téléchargée dans le dossier par défaut
        - Chrome/Edge : sélectionner le dossier de destination de l'archive .zip

- **Sites étrangers :**
    - Cliquer sur le bouton `PCScraper` en haut à droite dans la barre de menus du site pour ouvrir la fenêtre de recherche  
        
      Exemple du *New York Times* :  
      <img width="268" alt="Screenshot 2024-02-03 at 08 09 34" src="https://github.com/fmoncomble/press-corpus-scraper/assets/59739627/9c2a975d-6933-4489-970e-6d34bc1015c0">  
        
    - Construire une requête dans l'interface, puis cliquer sur `Search`
    - Choisir `Extract all` ou `Extract sample`
    - Cliquer sur `Extract articles`
    - Sélectionner le format de fichier souhaité : `TXT`, `XML/XTZ` (pour import dans [TXM](https://txm.gitpages.huma-num.fr/textometrie/) à l'aide du module `XML-TEI Zero + CSV`) ou `Iramuteq`
    - Cliquer sur `Download`
  
### Limites et problèmes connus
- **Sites français :** même avec un compte abonné actif, il se peut que l'extension n'ait pas accès au texte intégral des articles premium (lorsque le cookie n'est pas accepté par le serveur distant). Dans ce cas, seuls les articles en accès libre sont récupérés, les autres étant listés sous forme de liens.
    - *L'Humanité :* à défaut d'abonnement, il est conseillé de créer un compte gratuit sur le site.
- **Europresse :** 
    - affiche les métadonnées des articles de façon très aléatoire, sans éléments HTML dédiés, ce qui peut donner lieu à des incohérences dans la structure des fichiers téléchargés (chapô en lieu et place du nom d'auteur.e, etc.). Ce n'est pas un problème de l'extension mais d'Europresse !
    - n'autorise l'extraction que de 20 pages de résultats (1000 articles) à la fois.
- **Deutsches Zeitungsportal :** 
    - l'API renvoie des pages entières de journaux et non des articles individuels ;
    - les textes ayant numérisés par reconnaissance optique de caractères (OCR), les journaux imprimés en Fraktur donnent des résultats inégaux.
- ***Guardian* et *New York Times* :** la recherche s'appuie sur les API offertes par ces deux publications. Une clef d'accès est requise ; son obtention est gratuite et automatique aux liens suivants :
    - [*The Guardian*](https://bonobo.capi.gutools.co.uk/register/developer)
    - [*The New York Times*](https://developer.nytimes.com/get-started)
- ***New York Times* :** un abonnement actif est indispensable pour accéder au texte intégral de tous les articles, il faut donc être connecté à son compte au préalable. Le serveur distant accepte le cookie envoyé par l'extension (pour le moment), mais celle-ci doit composer avec certaines limitations et dispositifs de sécurité :
    - les requêtes ne renvoient que 10 résultats à la fois, et l'API n'autorise que 5 requêtes par minute : celles-ci sont donc espacées de 12 secondes pour éviter tout blocage
    - le serveur bloque les accès trop nombreux et trop rapides : le contenu des articles n'est donc extrait qu'à raison d'1 article par seconde. Malgré cela, un blocage peut survenir : l'extension invite alors à cliquer sur un lien pour prouver qu'on n'est pas un robot...
    - le compte abonné peut être déconnecté à tout moment : l'extension se met alors en pause et invite à cliquer sur un lien d'authentification afin de pouvoir reprendre la récupération de contenu.
- ***The New York Times* sous Firefox :** à cause de la façon dont Firefox gère le chargement dynamique de la [page d'accueil](https://www.nytimes.com), celle-ci doit être ouverte dans un nouvel onglet ou une nouvelle fenêtre. Dans le cas contraire, le bouton de l'extension apparait brièvement avant de disparaitre.
