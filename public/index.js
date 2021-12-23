// eslint-disable-next-line no-unused-vars
function getShortUrl(event) {
    event.preventDefault();
    const urlToShorten = document.getElementById("url-input").value;
    const endpoint = "http://localhost:3000/api/shortUrl";
    let req = JSON.stringify({
        'url': urlToShorten
    });
    const xhttp = new XMLHttpRequest();
    xhttp.onload = handleResponse;
    xhttp.open('POST', endpoint);
    xhttp.setRequestHeader('Content-type', 'application/json; charset=utf-8');
    xhttp.send(req);
}

function handleResponse() {
    if (this.status !== 200) {
        displayError(this.status);
    } else {
        const responseObject = JSON.parse(this.response);
        if (responseObject.error) {
            displayError(responseObject.error)
        } else {
            displayShortUrl(responseObject)
        }
    }
    clearForm();
}

function displayShortUrl(responseObject) {
    const shortUrlWrapperDiv = document.getElementById("short-url-text");
    const copyButton = document.getElementById("copy-button");
    let shortUrlDiv = document.getElementById("shortUrl");
    if (shortUrlDiv) {
        shortUrlWrapperDiv.removeChild(shortUrlDiv)
        shortUrlDiv = buildShortLinkHtml(responseObject.shortUrl);
        shortUrlWrapperDiv.appendChild(shortUrlDiv)
        copyButton.className = "visible-button";
    } else {
        shortUrlDiv = buildShortLinkHtml(responseObject.shortUrl)
        shortUrlWrapperDiv.appendChild(shortUrlDiv);
        copyButton.className = "visible-button";
    }
}

function displayError(error) {
    const shortUrlWrapperDiv = document.getElementById("short-url-text");
    const copyButton = document.getElementById("copy-button");
    let shortUrlDiv = document.getElementById("shortUrl");
    if (shortUrlDiv) {
        shortUrlDiv.innerHTML = "Whoops! There's been an error: " + error;
        copyButton.className = "hidden-button";
    } else {
        shortUrlDiv = document.createElement("p");
        shortUrlDiv.id = "shortUrl";
        shortUrlDiv.innerHTML = "Whoops! There's been an error: " + error;
        shortUrlWrapperDiv.appendChild(shortUrlDiv);
    }
}

function clearForm() {
    const formUrlField = document.getElementById("url-input");
    formUrlField.value = "";
}

function buildShortLinkHtml(shortUrl) {
    let textElement = document.createElement("p");
    let anchorElement = document.createElement("a");

    textElement.innerHTML = "Your short url: ";
    textElement.id = "shortUrl"

    anchorElement.href = shortUrl;
    anchorElement.innerHTML = shortUrl;
    anchorElement.id = "link-text"
    textElement.appendChild(anchorElement);

    return textElement;
}

// eslint-disable-next-line no-unused-vars
function copyLink() {
    const linkText = document.getElementById("link-text");
    navigator.clipboard.writeText(linkText.innerHTML)
}
