const pgp = require('pg-promise')();
const cn = {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
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
    return await getShortCode(shortCode).then((response) => {
        //No rows returned from DB
        if (response === null) {
            return true;
        } else {
            return false;
        }
    });
}

async function writeToDatabase(shortCode, url, isCustom) {
    return await db.none('INSERT INTO link_relations(short_code, url, custom_code) VALUES($1, $2, $3)',
    [shortCode, url, isCustom]);
}

module.exports = {getUrl, getShortCode, shortCodeAvailable, writeToDatabase}
