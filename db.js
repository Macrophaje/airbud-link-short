const { default: axios } = require('axios');
const dbUrl = "https://api.jsonbin.io/v3/b/61a26a5862ed886f9155b0b7";
const masterKey = "$2b$10$Axz1lWEAPJAcCk46p/IiTO0d.tL.Xh.2LaDwEzrz7.mPxZ3zy1ojq";

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
    return await db.one('SELECT url FROM link_relations WHERE short_code = $1', shortCode);
}

async function getShortCode(shortCode) {
    return await db.one('SELECT short_code FROM link_relations WHERE short_code = $1', shortCode);
}

async function writeToDatabase(shortCode, url, isCustom) {
    return await db.none('INSERT INTO link_relations(short_code, url, custom_code) VALUES($1, $2, $3)',
    [shortCode, url, isCustom]);
}

module.exports = {getUrl, getShortCode, writeToDatabase}
