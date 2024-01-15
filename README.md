# ![icon-48](https://github.com/fmoncomble/Figaro_extractor/assets/59739627/22593db5-a498-45f6-bb10-799ca73249a2) Figaro_extractor
Une extension pour extraire et télécharger des articles du Figaro à des fins de fouille textuelle.
### Citer ce programme
Si vous utilisez cette extension pour vos travaux de recherche, merci de la référencer de la façon suivante :  
  
Moncomble, F. (2024). *Figaro_Extractor* (Version 0.1) [JavaScript]. Arras, France : Université d’Artois. Disponible à l'adresse : https://github.com/fmoncomble/Figaro_extractor


## Installation
### Firefox
[![Firefox add-on](https://github.com/fmoncomble/Figaro_extractor/assets/59739627/e4df008e-1aac-46be-a216-e6304a65ba97)](https://github.com/fmoncomble/Figaro_extractor/releases/latest/download/Figaro_extractor_firefox.xpi)
### Chrome/Edge
- ![Télécharger l'archive .zip](https://github.com/fmoncomble/Figaro_extractor/releases/latest/download/Figaro_extractor_chrome.zip)
- Décompresser l'archive
- Ouvrir le gestionnaire d'extensions : `chrome://extensions` ou `edge://extensions`
  - Activer le « mode développeur »
  - Cliquer sur « charger l'extension non empaquetée »
  - Sélectionner le dossier décompressé
 
## Mode d'emploi
- Naviguer vers https://recherche.lefigaro.fr/
- Effectuer une recherche par mot-clef
- (Facultatif : filtrer les résultats grâce aux outils situés à droite de la page)
- Sélectionner le format de fichier souhaité : TXT ou XML
- Cliquer sur « Extraire »
  - Les articles réservés aux abonnés ne sont pas téléchargés mais listés sous forme de liens
  - Les articles que l'extension échoue à extraire sont listés sous forme de liens
  - Il arrive que le nombre de résultats annoncés par le site soit approximatif...
  - A l'issue de l'extraction :
    - Firefox : l'archive .zip contenant les fichiers est automatiquement téléchargée dans le dossier par défaut
    - Chrome/Edge : sélectionner le dossier de destination de l'archive .zip
- Décompresser l'archive obtenue pour charger les fichiers dans une application d'analyse textuelle

 
