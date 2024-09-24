const {sqlQuery} = require("../../things/db");
const {verifyToken} = require("../../things/jwt");

const logoutHandler = async (req, res) => {
    console.log(req.cookies.token);
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

    let deviceID = decoded["data"]["deviceID"];

    try {
        await sqlQuery(`DELETE FROM devices WHERE deviceID = '${deviceID}'`);
        res.json({
            success: true,
            data: {
                message: "Logout procedure completed successfully"
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            data: {
                message: "Failed to logout"
            }
        });
    }
}

module.exports = {logoutHandler}