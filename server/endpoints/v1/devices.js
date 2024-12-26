const {sqlQuery} = require("../../things/db")

const devicesHandler = async (req, res) => {
    let userdata = req.userdata;
    let userID = userdata["userID"];
    let devices = await sqlQuery(`SELECT deviceID, deviceInfo, registerDate FROM devices WHERE userID=?`, [userID]);
    if (devices.length == 0) {
        res.status(500).json({
            success: false,
            data: {
                message: "Failed to fetch devices"
            }
        })
        return;
    } else {
        for(let i in devices) {
            console.log(devices[i]["deviceID"], currentDevID)
            if (devices[i]["deviceID"] == currentDevID) {
                devices[i]["current"] = true;
            } else {
                devices[i]["current"] = false;
            }
        }
        res.status(200).json({
            success: true,
            data: devices
        });
    }

}

module.exports = {devicesHandler}