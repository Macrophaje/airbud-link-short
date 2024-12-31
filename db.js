const pgp = require('pg-promise')();
const cn = {
    connectionString: process.env.DATABASE_URL,
    //for local testing
    // ssl: {rejectUnauthorized: false}
    ssl: true
};
const db = pgp(cn);

async function getUrl(shortCode) {
    return await db.oneOrNone('SELECT url FROM link_relations WHERE short_code = $1', shortCode);
}

async function getShortCode(shortCode) {
    return await db.oneOrNone('SELECT short_code FROM link_relations WHERE short_code = $1', shortCode)
}

async function shortCodeAvailable(shortCode) {
    return await getShortCode(shortCode) === null;
}

async function writeToDatabase(shortCode, url, isCustom) {
    return await db.none('INSERT INTO link_relations(short_code, url, custom_code) VALUES($1, $2, $3)',
    [shortCode, url, isCustom]);
}

module.exports = {getUrl, getShortCode, shortCodeAvailable, writeToDatabase}
