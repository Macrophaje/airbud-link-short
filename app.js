const express = require('express');
const app = express();
const cors = require('cors');
const dns = require('dns');
require('url').URL;
const codeGenerator = require('./shortCodeGenerator');
const dbUtil = require('./db');
const { url } = require('inspector');

app.use(express.json());
app.use(express.urlencoded({extended: false}))
app.use(cors());
// eslint-disable-next-line no-undef
app.use('/public', express.static(`${process.cwd()}/public`));

// eslint-disable-next-line no-undef
const port = process.env.PORT || 3000;

//Load the JSON Databas into local memory
//TODO: Move to a SQL DB
// let db; 
// dbUtil.loadDatabase().then((res) => db = res);

//Redirect root requests to the front-end html page
app.get('/', (req, res) => {
    // eslint-disable-next-line no-undef
    res.sendFile(process.cwd() + '/views/index.html');
});

app.get('/favicon.ico', (req, res) => {
    return null;
});

//Handle requests to a short url
app.get('/:shortUrl', (req, res) => {
    const shortCode = req.params.shortUrl;
    if (shortCode === 'undefined') {
        return;
    }
    let urlToServe;

    //Check if the short url is in the DB and redirect if so.
    dbUtil.getUrl(shortCode).then(
        //Short code exists in DB
        (dbData) => {
            urlToServe = dbData.url;
            res.redirect(urlToServe);
        },
        //No short code in DB
        () => {
            sendError(res, "Bad Short Code")
        });
});

//Handle API requests to shorten a URL
app.post('/api/shorturl', (req,res) => {
    const urlToShorten = req.body.url;
    let shortCode = req.body.shortCode;
    // const findItem = url => url.long === urlToShorten;
    let host;

    //If the request includes a custom short code to use, don't check if the long URL is already in the DB.
    if (shortCode) {
        try {
            //Check that the short code is valid
            if (!codeGenerator.checkValidShortCode(shortCode)){
                sendError(res, "Short code must only be alphanumeric characters");
            //Make sure the short code doesn't exist in DB already
            } else {
                dbUtil.getShortCode(shortCode).then(
                //Existing Short Code was found
                () => {
                    sendError(res, "Short code already in use");
                },
                //No single Short Code was found
                (err) => {
                    //No existing code returned
                    if (err.code === 0) {
                        //Check host is valid
                        host = new URL(urlToShorten).host
                        dns.lookup(host, (err) => {
                            if (err) {
                                sendError(res, "Bad URL");
                            } else {
                                //Save the association in the DB and return the short url.
                                dbUtil.writeToDatabase(shortCode, urlToShorten, true).then(
                                    //DB write successul
                                    () => {
                                        sendShortUrl(req, res, shortCode);
                                    },
                                    //Something went wrong
                                    (err) => {
                                        sendError(res, "DB insertion error: " + err.message);
                                    }
                                )
                            }
                        });
                    //Multiple rows returned or some other error
                    } else {
                        sendError(res, "DB error: " + err.message);
                    }
                });
            }
        } catch (err) {
            sendError(res, "Bad URL");
        }

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
                    generateUniqueShortCode().then((result) => {
                        shortCode = result;
                        dbUtil.writeToDatabase(shortCode, urlToShorten, false).then(
                            //Write to DB successful
                            () => {
                                sendShortUrl(req, res, shortCode)
                            },
                            //Something went wrong
                            (err) => {
                                sendError(res, "DB write error: " + err.message);
                            }
                        )
                    });
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

async function generateUniqueShortCode() {
    let short_code = codeGenerator.generateShortUrlCode();
    let unique = false;
    while (!unique) {
        await dbUtil.getShortCode(short_code).then(
            () => {
                short_code = codeGenerator.generateShortUrlCode();
            },
            () => {
                unique = true
            }
        )
    }
    return short_code;
}
//Send a server resonse with the short URL
function sendShortUrl(req, res, shortCode) {
    res.json({"shortUrl": "https://" + req.hostname + "/" + shortCode});
}

//Send a serveer response with the error reason
function sendError(res, errorReason) {
    res.json({"error": errorReason});
}
