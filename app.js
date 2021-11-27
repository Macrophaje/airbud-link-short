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

const port = process.env.PORT || 3000;

const db = require(process.cwd() + '/urls.json');

dbUtil.loadDatabase();

app.get('/', (req, res) => {
    res.sendFile(process.cwd() + '/views/index.html');
})

app.get('/:shortUrl', (req, res) => {
    const shortUrl = req.params.shortUrl;
    let urlToServe;
    if (db.urls.some(item => item.short === shortUrl)) {
        const index = db.urls.findIndex(item => item.short === shortUrl);
        urlToServe = db.urls[index].long;
        res.redirect(urlToServe);
    } else {
        res.json({"error": "Bad URL"});
    }
})

app.post('/api/shorturl', (req,res) => {
    const urlToShorten = req.body.url;
    let shortUrl;
    const findItem = url => url.long === urlToShorten;
    let host;

    if (db.urls.some(findItem)) {
        const index = db.urls.findIndex(findItem)
        shortUrl = db.urls[index].short;
        res.json({"Your short url": req.hostname + "/" + shortUrl});
    } else {
        try {
            host = new URL(urlToShorten).host
            dns.lookup(host, (err) => {
                if (err) {
                    res.json({"error": "Bad URL"});
                } else {
                    shortUrl = codeGenerator.generateShortUrlCode();
                    db.urls.push({"short": shortUrl, "long": urlToShorten});
                    dbUtil.writeToDatabase(db);
                    res.json({"Your short url": req.hostname + "/" + shortUrl});
                }
            });
        } catch (err) {
            res.json({"error": "Bad URL"});
        }
        
    }

})

app.listen(port, (err) => {
    if (err) throw err;
    console.log("App Running");
});
