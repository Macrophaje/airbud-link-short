require('dotenv').config()
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

//Redirect root requests to the front-end html page
app.get('/', (req, res) => {
    // eslint-disable-next-line no-undef
    res.sendFile(process.cwd() + '/views/index.html');
});

app.get('/favicon.ico', (req, res) => {
    res.send();
});

//Handle requests to a short url
app.get('/:shortUrl', async (req, res) => {
    const shortCode = req.params.shortUrl;
    if (shortCode === undefined) {
        return;
    }

    try {
        //fetch url from db
        const dbData = await dbUtil.getUrl(shortCode);
        //nothing came back
        if(dbData === null){
            sendError(res, "short code does not exist");
            return;
        } else {
            //redirect to the url
            res.redirect(dbData.url);
        }
    } catch (error) {
        sendError(res, error.message)
    }
});

//Handle API requests to shorten a URL
app.post('/api/shorturl', async (req,res) => {
    const urlToShorten = req.body.url;
    let shortCode = req.body.shortCode;
    // const findItem = url => url.long === urlToShorten;
    let host;

    //If the request includes a custom short code to use, don't check if the long URL is already in the DB.
    if (shortCode) {
        try {
            //Check that the short code is valid
            if (!codeGenerator.checkValidShortCode(shortCode)) {
                sendError(res, "Short code must only be alphanumeric characters");
            //Make sure the short code doesn't exist in DB already
            } else {
                const isShortCodeAvailable = await dbUtil.shortCodeAvailable(shortCode);
                if (!isShortCodeAvailable) {
                    sendError(res, "Short code already in use");
                } else {
                    //Check host is valid
                    host = new URL(urlToShorten).host;
                    dns.lookup(host, async (err) => {
                        if (err) {
                            sendError(res, "Bad URL");
                        } else {
                            //Commit to DB and return
                            await dbUtil.writeToDatabase(shortCode, urlToShorten, true);
                            sendShortUrl(req, res, shortCode);
                        }
                    });
                }
            }
        } catch (err) {
            sendError(res, err.message, err.code);
        }

    //If there is no provided short code, make one for the user
    } else {
        try {
            //Check the host is valid
            host = new URL(urlToShorten).host
            dns.lookup(host, async (err) => {
                if (err) {
                    sendError(res, "Bad URL");
                } else {
                    //Get an exitsing short code for this url if it exists
                    const existingShortCodes = await dbUtil.getExistingShortCodes(urlToShorten);
                    if (existingShortCodes.length > 0) {
                        //Resue first existing short code
                        shortCode = existingShortCodes[0].short_code;
                        sendShortUrl(req, res, shortCode);
                    } else {
                        //Generate a new short code and provide it to the user
                        shortCode = await generateUniqueShortCode();
                        await dbUtil.writeToDatabase(shortCode, urlToShorten, false);
                        sendShortUrl(req, res, shortCode);
                    }
                }
            });
        } catch (err) {
            sendError(res, err.message, err.code);
        }
    }
});

//Log the App starting successfully
app.listen(port, (err) => {
    if (err) throw err;
    console.log("App Running on port: " + port);
});

//Make sure short code does not exist in the DB
async function generateUniqueShortCode() {
    let loop = true;
    while (loop) {
        const shortCode = codeGenerator.generateShortUrlCode();
        if (await dbUtil.shortCodeAvailable(shortCode)) {
            return shortCode;
        }
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
