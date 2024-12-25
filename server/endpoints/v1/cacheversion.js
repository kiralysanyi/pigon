/**
 * What does this do?
 * Generates a random string on startup and serves it on an endpoint.
 * Why is this needed?
 * For cache versioning.
 * For more info take a look at the serviceworker
 */

const uuidv4 = require("uuid").v4;
const cacheVersion = uuidv4();

let versionHandler = (req, res) => {
    res.send(cacheVersion);
}

module.exports = {versionHandler}