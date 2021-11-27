const fs = require('fs');
const { default: axios } = require('axios');
const dbUrl = process.env.DB_URL;
const masterKey = process.env.JSON_BIN_KEY;

function loadDatabase() {
    const config = {
        headers : {
            "X-Master-Key" : masterKey
        }
    }
    let response
    axios.get(dbUrl, config)
        .then((res) => {
            response = res.data.record;
            fs.writeFile("urls.json", JSON.stringify(response), (err) => {
                if (err) throw err;
            });
        });

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