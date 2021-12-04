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
app.use('/public', express.static(`${process.cwd()}/public`));

const port = process.env.PORT || 3000;

let db; 
dbUtil.loadDatabase().then((res) => db = res);

app.get('/.well-known/acme-challenge/NVJfTOCrMJO6YV0zA6-EruE4pimWqc6rxxxgEtBTGr0', (req, res) => {
    res.sendFile(process.cwd() + '/public/cert');
});

app.get('/', (req, res) => {
    res.sendFile(process.cwd() + '/views/index.html');
});

app.get('/:shortUrl', (req, res) => {
    const shortUrl = req.params.shortUrl;
    let urlToServe;
    const findShortCode = item => item.short === shortUrl

    if (db.urls.some(findShortCode)) {
        const index = db.urls.findIndex(findShortCode);
        urlToServe = db.urls[index].long;
        res.redirect(urlToServe);
    } else {
        res.json({"error": "Bad URL"});
    }
});

app.post('/api/shorturl', (req,res) => {
    const urlToShorten = req.body.url;
    let shortUrl;
    const findItem = url => url.long === urlToShorten;
    let host;

    if (db.urls.some(findItem)) {
        const index = db.urls.findIndex(findItem)
        shortUrl = db.urls[index].short;
        res.json({"short-url": req.hostname + "/" + shortUrl});
    } else {
        try {
            host = new URL(urlToShorten).host
            dns.lookup(host, (err) => {
                if (err) {
                    res.json({"error": "Bad URL"});
                } else {
                    shortUrl = codeGenerator.generateShortUrlCode();
                    while (checkShortCodeIsUnique(shortUrl)) {
                        shortUrl = codeGenerator.generateShortUrlCode();
                    }

                    db.urls.push({"short": shortUrl, "long": urlToShorten});
                    dbUtil.writeToDatabase(db);
                    res.json({"short-url": req.hostname + "/" + shortUrl});
                }
            });
        } catch (err) {
            res.json({"error": "Bad URL"});
        }
        
    }

});

app.listen(port, (err) => {
    if (err) throw err;
    console.log("App Running");
});

function checkShortCodeIsUnique(shortCode) {
    if (db.urls.some(url => url.short === shortCode)){
        return true;
    } else {
        return false
    }
}
