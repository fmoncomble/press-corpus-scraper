# ![icon-96](https://github.com/fmoncomble/press_corpus_scraper/assets/59739627/d5d96847-4c02-4800-9419-ee1b39936ff5) Press Corpus Scraper
Une extension pour extraire et télécharger des articles de presse à des fins de fouille textuelle.
### Citer ce programme
Si vous utilisez cette extension pour vos travaux de recherche, merci de la référencer de la façon suivante :  
  
Moncomble, F. (2024). *Press Corpus Scraper* (Version 0.3) [JavaScript]. Arras, France : Université d’Artois. Disponible à l'adresse : https://github.com/fmoncomble/press-corpus-scraper


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
 
## Mode d'emploi
- Naviguer vers le site d'un journal pris en charge :
    - [Le Figaro](https://recherche.lefigaro.fr/)
    - [L'Humanité](https://www.humanite.fr/)
    - [Le Monde](https://www.lemonde.fr/recherche/)
    - [Le Point](https://www.lepoint.fr/recherche/index.php)
    - [The Guardian](https://www.theguardian.com/)
    - [The New York Times](https://www.nytimes.com/)
- Sites français :
    - Effectuer une recherche par mot-clef
    - (Facultatif : affiner la recherche)
- Sites anglophones :
    - Cliquer sur le bouton `PCScraper` en haut à droite dans la barre de menus du site pour ouvrir la fenêtre de recherche 
    - Construire une requête dans l'interface, puis cliquer sur `Search` 
- Sélectionner le format de fichier souhaité : TXT ou XML/XTZ (pour import dans [TXM](https://txm.gitpages.huma-num.fr/textometrie/))
- Cliquer sur « Extraire »
  - Les articles réservés aux abonnés ne sont pas téléchargés mais listés sous forme de liens
  - Les articles que l'extension échoue à extraire sont listés sous forme de liens
  - A l'issue de l'extraction :
    - Firefox : l'archive .zip contenant les fichiers est automatiquement téléchargée dans le dossier par défaut
    - Chrome/Edge : sélectionner le dossier de destination de l'archive .zip
- Décompresser l'archive obtenue pour charger les fichiers dans une application d'analyse textuelle
