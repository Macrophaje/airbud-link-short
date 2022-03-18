const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'

function generateShortUrlCode() {
    let shortCode = "";
    for (let i = 0; i < 5; i++) {
        shortCode += characters.charAt(Math.floor(Math.random() * characters.length))
    }
    return shortCode;
}

function checkValidShortCode(shortCode) {
    for (const char of shortCode) {
        if (!characters.includes(char)) {
            return false;
        }
    }
    return true;
}

module.exports = {generateShortUrlCode, checkValidShortCode}