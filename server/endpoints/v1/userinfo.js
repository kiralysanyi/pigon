const {verifyToken} = require("../../things/jwt")
const {sqlQuery} = require("../../things/db")


const userinfoHandler = async (req, res) => {
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
    data:
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

    let loggedinuserID = decoded["data"]["userID"];
    let searchedID = req.body.userID;

    if (searchedID == undefined) {
        //no userID provided by the client so we respond with the requestor's information
        let response = await sqlQuery(`SELECT id, username, registerDate FROM users WHERE id = '${loggedinuserID}'`);

        res.json({
            success: true,
            data: response[0]
        });
        return;
    }

    //the user has provided a userID so we search for it and send it back to the client
    let response = await sqlQuery(`SELECT username, registerDate FROM users WHERE id = '${searchedID}'`);

    if (response.length == 0) {
        res.json({
            success: false,
            data: {
                message: "User not found"
            }
        });
        return;
    }

    res.json({
        success: true,
        data: response[0]
    });
}

module.exports = {userinfoHandler}