const {sqlQuery} = require("../../things/db");

const removedeviceHandler = async (req, res) => {
    let userdata = req.userdata;
    let deviceID = req.body.deviceID;
    if (deviceID == undefined) {
        res.json({
            success: false,
            data: {
                message: "deviceID hasn't been provided by the client"
            }
        })
        return;
    }

    try {
        req.unsubscribe(userdata.userID, deviceID)
        await sqlQuery(`DELETE FROM devices WHERE deviceID = ?`, [deviceID]);
        res.json({
            success: true,
            data: {
                message: "Device removed"
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            data: {
                message: "Failed to remove device"
            }
        });
    }
}

module.exports = {removedeviceHandler}