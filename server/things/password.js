let crypto = require("crypto");

function hashPass(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
}

module.exports = {hashPass};