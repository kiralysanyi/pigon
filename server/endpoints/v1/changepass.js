const {updatePass} = require("../../things/db");

const changepassHandler = async (req, res) => {
    //verifying token
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

    if (req.body.oldpass == undefined || req.body.newpass == undefined) {
        res.json({
            success: false,
            data: {
                message: "Old password or new password was not provided by the client"
            }
        })
        return;
    }

    let username = userdata["username"];
    let userID = userdata["userID"]
    res.json(await updatePass(username, userID, req.body.oldpass, req.body.newpass));
}

module.exports = {changepassHandler}