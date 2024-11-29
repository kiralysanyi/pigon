const {verifyToken} = require("../things/jwt")
let cookieParser = require("cookie-parser");


let socketAuthHandler = async (socket, next) => {
    const cookies = socket.handshake.headers.cookie;

    if (!cookies) {
        return next(new Error('No cookies found'));
    }

    const parsedCookies = cookieParser.JSONCookies(
        require('cookie').parse(cookies)
    );

    const token = parsedCookies.token; // Assuming your token is stored in 'token'

    if (!token) {
        return next(new Error('Authentication token is missing'));
    }

    try {
        let data = await verifyToken(token)
        socket.userInfo = data.data;
        next();
    } catch (err) {
        return next(new Error('Authentication failed'));
    }
}

module.exports = {socketAuthHandler}