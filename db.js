const { default: axios } = require('axios');
const dbUrl = process.env.DB_URL;
const masterKey = process.env.JSON_BIN_KEY;

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