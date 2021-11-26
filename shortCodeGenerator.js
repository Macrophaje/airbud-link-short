function generateShortUrlCode() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let shortCode = "";
    for (let i = 0; i < 5; i++) {
        shortCode += characters.charAt(Math.floor(Math.random() * characters.length))
    }
    return shortCode;
}

module.exports = {generateShortUrlCode}