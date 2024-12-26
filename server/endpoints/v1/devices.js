const {sqlQuery} = require("../../things/db")
const {verifyToken} = require("../../things/jwt")

const devicesHandler = async (req, res) => {
    let token;
    try {
        token = req.cookies.token
    } catch (error) {
        res.status(400)
            .json(
                {
                    success: false,
                    data: {
                        message: "Token was not provided"
                    }
                }
            );
        return;
    }
    //Authorization: 'Bearer TOKEN'
    if (!token) {
        res.status(400)
            .json(
                {
                    success: false,
                    data: {
                        message: "Token was not provided"
                    }
                }
            );
        return;
    }

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
    let decoded;
    let currentDevID;
    try {
        decoded = await verifyToken(token);
        currentDevID = decoded["data"]["deviceID"];
    } catch (error) {
        res.status(200).json({
            success: false,
            data: {
                message: "Failed to verify token"
            }
        })
        return;
    }
    if (decoded.success == false) {
        res.status(200).json({
            success: false,
            data: {
                message: decoded.message
            }
        })
        return;
    }

    let userID = decoded["data"]["userID"];
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