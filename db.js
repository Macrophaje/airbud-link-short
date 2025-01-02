const pgp = require('pg-promise')();
const cn = {
    connectionString: process.env.DATABASE_URL,
    //for local testing
    // ssl: {rejectUnauthorized: false}
};
const db = pgp(cn);

async function loadDatabase() {
    const getUrl = dbUrl + "/latest";
    const config = {
        headers : {
            "X-Master-Key" : masterKey
        }
    }
    let response = await axios.get(getUrl, config)
        .then((res) => {
            let db = res.data.record;
            return db;
        });
    return response;
}

function writeToDatabase(db) {
    const config = {
        headers : {
            "X-Master-Key" : masterKey,
            "Content-Type" : "application/json"
        }
    }

    axios.put(dbUrl, db, config)
}

module.exports = {loadDatabase, writeToDatabase}