const express = require('express');
const app = express();
const fs = require('fs');
const cors = require('cors')
const codeGenerator = require('./shortCodeGenerator');

app.use(express.json());
app.use(express.urlencoded({extended: false}))
app.use(cors());

const port = process.env.PORT || 3000;

const db = require(process.cwd() + '/urls.json');

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

    if (db.urls.some(findItem)) {
        const index = db.urls.findIndex(findItem)
        shortUrl = db.urls[index].short;
    } else {
        shortUrl = codeGenerator.generateShortUrlCode();
        db.urls.push({"short": shortUrl, "long": urlToShorten})
        fs.writeFile("urls.json", JSON.stringify(db), (err) => {
            if (err) throw err;
            console.log("Link Database Updated");
        })
    }
    res.json({"Your short url": req.hostname + "/" + shortUrl});
})

app.listen(port, (err) => {
    if (err) throw err;
    console.log("App Running");
})