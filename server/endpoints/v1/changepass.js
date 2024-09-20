const {updatePass} = require("../../things/db");
const {verifyToken} = require("../../things/jwt");

const changepassHandler = async (req, res) => {
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

    if (req.body.oldpass == undefined || req.body.newpass == undefined) {
        res.json({
            success: false,
            data: {
                message: "Old password or new password was not provided by the client"
            }
        })
        return;
    }

    let username = decoded["data"]["username"];
    let userID = decoded["data"]["userID"]
    res.json(await updatePass(username, userID, req.body.oldpass, req.body.newpass));
}

module.exports = {changepassHandler}