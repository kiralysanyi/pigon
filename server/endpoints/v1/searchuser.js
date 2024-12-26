const { sqlQuery } = require("../../things/db");

let searchHandler = async (req, res) => {
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
    let userdata = req.userdata;

    let searchQuery = req.query.search;

    let results = await sqlQuery(`SELECT id, username, registerDate FROM users WHERE username LIKE ?`, [`%${searchQuery}%`]);


    res.json({
        success: true,
        message: "Search results",
        data: results
    });
}

module.exports = { searchHandler }