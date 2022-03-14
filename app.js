const express = require('express');
const app = express();
const cors = require('cors');
const dns = require('dns');
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
        res.json({"error": "Bad URL"});
    }
});

//Handle API requests to shorten a URL
app.post('/api/shorturl', (req,res) => {
    const urlToShorten = req.body.url;
    let shortUrl = req.body.shortCode;
    const findItem = url => url.long === urlToShorten;
    let host;

    //If the request includes a custom short code to use, don't check if the long URL is already in the DB.
    if (shortUrl) {
        try {
            //Check host is valid
            host = new URL(urlToShorten).host
            dns.lookup(host, (err) => {
                if (err) {
                    res.json({"error": "Bad URL"});
                } else {
                    //Make sure the short code doesn't exist in DB already
                    if(!checkShortCodeIsUnique(shortUrl)) {
                        res.json({"error": "Short URL already in use"});
                    } else {
                        //Save the association in the DB and return the short url.
                        db.urls.push({"short": shortUrl, "long": urlToShorten});
                        dbUtil.writeToDatabase(db);
                        res.json({"shortUrl": req.hostname + "/" + shortUrl});
                    }
                }
            });
        } catch (err) {
            res.json({"error": "Bad URL"});
        }

    //If not short code is provided, check to see if the long URL is in the DB already.
    } else if (db.urls.some(findItem)) {
        //Return the existing short url
        const index = db.urls.findIndex(findItem)
        shortUrl = db.urls[index].short;
        res.json({"shortUrl": req.hostname + "/" + shortUrl});

    //If the long URL is new, get ready to generate a new short code
    } else {
        try {
            //Check the host is valid
            host = new URL(urlToShorten).host
            dns.lookup(host, (err) => {
                if (err) {
                    res.json({"error": "Bad URL"});
                } else {
                    //Generate a short code and make sure it is unique
                    shortUrl = codeGenerator.generateShortUrlCode();
                    while (!checkShortCodeIsUnique(shortUrl)) {
                        shortUrl = codeGenerator.generateShortUrlCode();
                    }

                    //Save the association in the DB and return the short url.
                    db.urls.push({"short": shortUrl, "long": urlToShorten});
                    dbUtil.writeToDatabase(db);
                    res.json({"shortUrl": req.hostname + "/" + shortUrl});
                }
            });
        } catch (err) {
            res.json({"error": "Bad URL"});
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
