([**Version française**](https://fmoncomble.github.io/press-corpus-scraper))  
 
An extension for extracting and downloading press articles for text mining.  
  
🚨 **New!** 🚨 Support for Europresse: log in via [your institutional portal](europresse-list.md).
### Cite this program
If you use this extension for your research, please reference it as follows:  
  
Moncomble, F. (2024). *Press Corpus Scraper* (Version 0.4) [JavaScript]. Arras, France: Université d'Artois. Available at: https://fmoncomble.github.io/press-corpus-scraper/


## Installation
### Firefox (recommended: automatic updates)
[![Firefox add-on](https://github.com/fmoncomble/Figaro_extractor/assets/59739627/e4df008e-1aac-46be-a216-e6304a65ba97)](https://github.com/fmoncomble/press-corpus-scraper/releases/latest/download/pcs.xpi)

### Chrome/Edge
- [Download .zip archive](https://github.com/fmoncomble/press-corpus-scraper/releases/latest/download/pcs.zip)
- Unzip the archive
- Open the extensions manager: `chrome://extensions` or `edge://extensions`
  - Activate "developer mode"
  - Click "Load unpacked".
  - Select the unzipped folder
 
## Instructions for use
- Navigate to the site of a supported newspaper:
    - [*Le Figaro*](https://recherche.lefigaro.fr/)
    - [*L'Humanité*](https://www.humanite.fr/)
    - [*Le Monde*](https://www.lemonde.fr/recherche/)
    - [*Le Point*](https://www.lepoint.fr/recherche/index.php)
    - [*The Guardian*](https://www.theguardian.com/)
    - [*The New York Times*](https://www.nytimes.com/)
- or your institution's Europresse portal: [list of supported institutions](europresse-list.md)
- **French websites and Europresse:**
    - Search by keyword
    - (Optional: refine your search)
    - A box appears at the top of the results page. Example for *Le Monde* :  
      <img width="704" alt="Screenshot 2024-02-03 at 08 09 21" src="https://github.com/fmoncomble/press-corpus-scraper/assets/59739627/07b0a58a-1730-4652-9eff-f2d010a0a9ec">  
- **English-language sites:**
    - Click on the `PCScraper` button in the top right-hand corner of the site's menu bar to open the search window  
        
      Example from the *New York Times* :  
      <img width="268" alt="Screenshot 2024-02-03 at 08 09 34" src="https://github.com/fmoncomble/press-corpus-scraper/assets/59739627/9c2a975d-6933-4489-970e-6d34bc1015c0">  
        
      Example from the *Guardian*:  
      <img width="303" alt="Screenshot 2024-02-03 at 08 09 46" src="https://github.com/fmoncomble/press-corpus-scraper/assets/59739627/625b57e9-79d0-44e1-a5a8-738a6f3b9de6">  
        
    - Build a query in the interface, then click `Search` 
- Select the desired file format: TXT or XML/XTZ (for import into [TXM](https://txm.gitpages.huma-num.fr/textometrie/) with the `XML-TEI Zero + CSV` module)
- Click 'Extract'
  - Paywalled articles are not downloaded but listed as links
  - Articles that the extension fails to process are listed as links
  - When extraction is complete :
    - Firefox: the .zip archive containing the files is automatically downloaded to the default folder
    - Chrome/Edge: select the destination folder for the .zip archive
- Unzip the resulting archive to load the files into text analysis software

### Known issues and limitations
- **French sites:** even with an active subscription, the extension may not have access to the full text of paywalled articles (if the cookie is not accepted by the remote server). In that case, only free-access articles are retrieved, the others being listed as links.
    - *L'Humanité:* without a subscription, it is advised to create a free account.
- **Europresse**
    - handles article metadata rather randomly, with no dedicated HTML elements, which can lead to some inconsistency in the way they are rendered in downloaded files (subheads where author name should belong, etc.). This is not a limitation of the add-on but of Europresse!
    - only allows scraping 20 pages of results (1000 articles) at a time.
- ***Guardian* and *New York Times*:** the query and extraction process relies on the APIs offered by these two publications. An access key is required, which can be obtained free of charge from the following links:
    - [*The Guardian*](https://bonobo.capi.gutools.co.uk/register/developer)
    - [*The New York Times*](https://developer.nytimes.com/get-started)
- ***The New York Times*:** an active subscription is required to access the full text of all articles, so you need to be logged into your account first. The remote server accepts the cookie sent by the extension (for the time being), but there are a number of limitations and security features:
    - requests can only return 10 results at a time, and the API only authorises 5 requests per minute: these are therefore spaced 12 seconds apart to avoid any blocking
    - the server blocks fetch requests that are too numerous and too fast: to avoid that, article content is only retrieved at a rate of 1 article per second. Despite this, a block may occur: the extension then invites you to click on a link to prove that you are not a robot...
    - the subscriber account can be disconnected at any time: the extension then pauses and prompts you to click on an authentication link before resuming content retrieval.
- ***The New York Times* on Firefox:** due to the way Firefox handles the dynamic loading of [the NYT's homepage](https://www.nytimes.com), it needs to be opened in a new tab or window for the button to appear. In any other case, the button is likely to pop up briefly before disappearing.
