const {sqlQuery, userExists, verifyPass, registerDevice} = require("../../things/db");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const uid = require("uuid").v4;
const {validateUsername} = require("../../things/usernameRegex");


//login handler
const loginHandler = async (req = app.request, res = app.response, next = () => { }) => {
    let username = req.body.username;
    let password = req.body.password;

    if(validateUsername(username) == false) {
        res.status(200).json({
            success: false,
            data: {
                message: "Username can not contain special characters and whitespaces."

            }
        })
        return;
    }

    if (await userExists(username) == false) {
        //user not existing
        res.status(404).json({
            success: false,
            data: {
                message: "User not found"
            }
        });
        return
    }



    let response = await sqlQuery(`SELECT id, username FROM users WHERE username='${username}'`)
    console.log(response)
    //id, username;
    let userInfo = response[0];
    let deviceName = "N/A"

    if (req.body.deviceName) {
        deviceName = req.body.deviceName;
    }
    if (await verifyPass(username, password)) {
        //password verified

        //generating a unique device ID

        let deviceID = uid();
        let deviceInfo = {
            "user-agent": req.headers["user-agent"],
            "deviceName": deviceName
        }

        //creating jwt token
        //the token will expire after 7 days
        //TODO: make the expirity modifiable by the user
        let token;
        try {
            token = jwt.sign({
                userID: userInfo["id"],
                username: userInfo["username"],
                deviceID: deviceID,
                deviceInfo: deviceInfo,
            }, process.env.JWT_SECRET, { expiresIn: "7d" });

            await registerDevice(deviceID, userInfo["id"], deviceInfo);
        } catch (error) {
            res.status(500).json({
                success: false,
                data: {
                    message: "Failed to authenticate, contact system administrator to solve this issue."
                }
            });
            return;
        }

        res.cookie('token', token, {
            httpOnly: true,  // This makes the cookie HTTP-only
            secure: true,    // This ensures the cookie is only sent over HTTPS (recommended for production)
            maxAge: 365 * 24 * 60 * 60 * 1000,  // Cookie expiry time (1 year here)
        });

        res.status(200).json({
            success: true,
            data: {
                userInfo: userInfo
            }
        });
    } else {
        //bad password
        res.status(500).json({
            success: false,
            data: {
                message: "Wrong password."
            }
        });
    }
}

module.exports = {loginHandler}