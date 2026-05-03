const pgp = require('pg-promise')();
const cn = {
    connectionString: process.env.DATABASE_URL,
    //for local testing
    // ssl: {rejectUnauthorized: false}
};
const db = pgp(cn);

//Get the URL from the database with the provided short code
async function getUrl(shortCode) {
    return await db.oneOrNone('SELECT url FROM link_relations WHERE short_code = $1', shortCode);
}

//Get all short codes in the database ties to the provided url
async function getExistingShortCodes(url) {
    return await db.manyOrNone('SELECT short_code FROM link_relations WHERE url = $1', url)
}

//Make sure no URL in the database it tied to the provided short code
async function shortCodeAvailable(shortCode) {
    return await getUrl(shortCode) === null;
}

//Write a new line to the database
async function writeToDatabase(shortCode, url, isCustom) {
    return await db.none('INSERT INTO link_relations(short_code, url, custom_code) VALUES($1, $2, $3)',
    [shortCode, url, isCustom]);
}

module.exports = {getUrl, getExistingShortCodes, shortCodeAvailable, writeToDatabase}
