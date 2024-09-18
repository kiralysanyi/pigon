const {registerDevice, createUser, userExists, sqlQuery, verifyPass} = require("../../things/db")
const {verifyToken} = require("../../things/jwt")

const devicesHandler = async (req, res) => {
    console.log(req.headers.authorization);
    let token;
    try {
        token = req.headers.authorization.split(' ')[1];
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
    try {
        decoded = await verifyToken(token);
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
    console.log(userID)
    let devices = await sqlQuery(`SELECT deviceID, deviceInfo, registerDate FROM devices WHERE userID='${userID}'`);
    console.log("A KURVA ANYÁD: ", devices)
    if (devices.length == 0) {
        res.status(500).json({
            success: false,
            data: {
                message: "Failed to fetch devices"
            }
        })
        return;
    } else {
        res.status(200).json({
            success: true,
            data: devices
        });
    }

}

module.exports = {devicesHandler}