const express = require('express');
const app = express();
const cors = require('cors');
const dns = require('node:dns');
require('url').URL;
const codeGenerator = require('./shortCodeGenerator');
const dbUtil = require('./db');

app.use(express.json());
app.use(express.urlencoded({extended: false}))
app.use(cors());
// eslint-disable-next-line no-undef
app.use('/public', express.static(`${process.cwd()}/public`));

// eslint-disable-next-line no-undef
const port = process.env.PORT || 3000;

//Load the JSON Databas into local memory
//TODO: Move to a SQL DB
let db; 
dbUtil.loadDatabase().then((res) => db = res);

//Redirect root requests to the front-end html page
app.get('/', (req, res) => {
    // eslint-disable-next-line no-undef
    res.sendFile(process.cwd() + '/views/index.html');
});

//Handle requests to a short url
app.get('/:shortUrl', (req, res) => {
    const shortUrl = req.params.shortUrl;
    let urlToServe;
    const findShortCode = item => item.short === shortUrl

    //Check if the short url is in the DB and redirect if so.
    if (db.urls.some(findShortCode)) {
        const index = db.urls.findIndex(findShortCode);
        urlToServe = db.urls[index].long;
        res.redirect(urlToServe);
    } else {
        sendError(res, "Bad URL");
    }
});

//Handle API requests to shorten a URL
app.post('/api/shorturl', (req,res) => {
    const urlToShorten = req.body.url;
    let shortCode = req.body.shortCode;
    const findItem = url => url.long === urlToShorten;
    let host;

    //If the request includes a custom short code to use, don't check if the long URL is already in the DB.
    if (shortCode) {
        try {
            //Check that the short code is valid
            if (!codeGenerator.checkValidShortCode(shortCode)){
                sendError(res, "Short code must only be alphanumeric characters");
            //Make sure the short code doesn't exist in DB already
            } else if(!checkShortCodeIsUnique(shortCode)) {
                sendError(res, "Short code already in use");
            } else {    
                //Check host is valid
                host = new URL(urlToShorten).host
                dns.lookup(host, (err) => {
                    if (err) {
                        sendError(res, "Bad URL");
                    } else {
                        //Save the association in the DB and return the short url.
                        updateDB(db, shortCode, urlToShorten);
                        sendShortUrl(req, res, shortCode);
                    }
                });
            }
        } catch (err) {
            sendError(res, "Bad URL");
        }

    //If not short code is provided, check to see if the long URL is in the DB already.
    } else if (db.urls.some(findItem)) {
        //Return the existing short url
        const index = db.urls.findIndex(findItem)
        shortCode = db.urls[index].short;
        sendShortUrl(req, res, shortCode);

    //If the long URL is new, get ready to generate a new short code
    } else {
        try {
            //Check the host is valid
            host = new URL(urlToShorten).host
            dns.lookup(host, (err) => {
                if (err) {
                    sendError(res, "Bad URL");
                } else {
                    //Generate a short code and make sure it is unique
                    shortCode = codeGenerator.generateShortUrlCode();
                    while (!checkShortCodeIsUnique(shortCode)) {
                        shortCode = codeGenerator.generateShortUrlCode();
                    }
                    //Save the association in the DB and return the short url.
                    updateDB(db, shortCode, urlToShorten);
                    sendShortUrl(req, res, shortCode);
                }
            });
        } catch (err) {
            sendError(res, "Bad URL");
        }
    }
});

//Log the App starting successfully
app.listen(port, (err) => {
    if (err) throw err;
    console.log("App Running");
});

//Check if the short code is present in the DB
function checkShortCodeIsUnique(shortCode) {
    if (db.urls.some(url => url.short === shortCode)){
        return false;
    } else {
        return true;
    }
}

//Send a server resonse with the short URL
function sendShortUrl(req, res, shortCode) {
    res.json({"shortUrl": "https://" + req.hostname + "/" + shortCode});
}

//Send a serveer response with the error reason
function sendError(res, errorReason) {
    res.json({"error": errorReason});
}

//Update the session DB and the remote DB
function updateDB(db, shortCode, urlToShorten) {
    db.urls.push({"short": shortCode, "long": urlToShorten});
    dbUtil.writeToDatabase(db);
}