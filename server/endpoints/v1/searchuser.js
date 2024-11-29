const { sqlQuery } = require("../../things/db");
const { verifyToken } = require("../../things/jwt");

let searchHandler = async (req, res) => {
    if (!req.cookies.token) {
        res.status(403).json({
            success: false,
            message: "Failed to verify user"
        });
        return;
    }

    let verificationResponse = await verifyToken(req.cookies.token);
    if (verificationResponse.success == false) {
        res.status(403).json({
            success: false,
            message: "Failed to verify token"
        });
        return;
    }
    /*
    {
            userID: 69,
            username: "lakatos rikárdinnyó",
            deviceID: "aaa",
            deviceInfo: {
                "user-agent": "xy",
                "deviceName": "xyz"
            }
    }
    */
    let userdata = verificationResponse.data;

    let searchQuery = req.query.search;

    let results = await sqlQuery(`SELECT id, username, registerDate FROM users WHERE username LIKE '%${searchQuery}%'`);
    console.log(results);

    res.json({
        success: true,
        message: "Search results",
        data: results
    });
}

module.exports = { searchHandler }