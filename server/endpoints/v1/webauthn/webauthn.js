const {server} = require("@passwordless-id/webauthn");
const { verifyPass, userExists, sqlQuery, registerDevice, getUserFromID } = require("../../../things/db");
const jwt = require("jsonwebtoken");
const uid = require("uuid").v4;
const fs = require("fs");

let challenges = [];
const origin = process.env.ORIGIN;

const allowedOrigins = [origin, "android:apk-key-hash:8gym9SvvYCvHtXdlJaOKguZ6LGEJt5jY7IZL6jB32gc"]

const challengeHandler = async (req, res) => {
    const challenge = server.randomChallenge();
    challenges.push(challenge);
    res.json({ challenge })
}

const webauthnRegHandler = async (req, res) => {
let registration = req.body.registration;


    if (registration == undefined) {
        res.status(400).json({
            success: false,
            message: "Invalid request."
        });
        return;
    }




    const expected = {
        challenge: req.body.challenge,
        origin: origin
    }

    console.log(expected)

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


    const registrationParsed = await server.verifyRegistration(registration, expected)
    let credential = registrationParsed["credential"];
    let credentialString = JSON.stringify(credential);
    let userID = userdata["userID"];
    try {
        await sqlQuery(`INSERT INTO credentials (userID, credential, credentialID) VALUES (?,?,?)`, [userID, credentialString, credential["id"]]);
        await sqlQuery(`UPDATE userconfig SET passkey = 1 WHERE userID = ?`, [userID]);
        res.json({
            success: true,
            message: "Added passkey succesfully"
        })
    } catch (error) {
        res.json({
            success: false,
            message: "Something went wrong :("
        });
    }

}

const authHandler = async (req, res) => {
    let authentication = req.body.authentication;
    let challenge = req.body.challenge;
    let credentialID = authentication["id"];
    let deviceName = req.body.deviceName;

    console.log("Request body: ", req.body)

    if (deviceName == undefined) {
        deviceName = "N/A"
    }
    /*
    if (username == undefined || authentication == undefined) {
        res.json({
            success: false,
            data: {
                message: "Invalid request"
            }
        });
    }
        */
    /*
        if (await userExists(username) == false) {
            res.json({
                success: false,
                data: {
                    message: "User not found"
                }
            })
            return;
        }
    */
    let response = await sqlQuery(`SELECT userID, credential FROM credentials WHERE credentialID = ?`, [credentialID]);

    if (response.length == 0) {
        res.json({
            success: false,
            message: "Authentication failed"
        });
        return;
    }
    let userID = response[0]["userID"];


    let userdata;
    try {
        userdata = await getUserFromID(userID);
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to get user information, try another key."
        });
        return;
    }


    let credential = JSON.parse(response[0]["credential"]);
    //console.log(credential);
    const expected = {
        challenge: challenge,
        origin: (origin) => allowedOrigins.includes(origin)
    }

    try {
        console.log(authentication, credential, expected)
        
        const authenticationParsed = await server.verifyAuthentication(authentication, credential, expected, new URL(origin).hostname)
        console.log(authenticationParsed);
        let deviceID = uid();
        let deviceInfo = {
            "user-agent": req.headers["user-agent"],
            "deviceName": deviceName
        }

        try {
            let token = jwt.sign({
                userID: userdata["id"],
                username: userdata["username"],
                deviceID: deviceID,
                deviceInfo: deviceInfo,
            }, process.env.JWT_SECRET, { expiresIn: "7d" });

            await registerDevice(deviceID, userdata["id"], deviceInfo);
            res.cookie('token', token, {
                httpOnly: true,  // This makes the cookie HTTP-only
                secure: true,    // This ensures the cookie is only sent over HTTPS (recommended for production)
                maxAge: 365 * 24 * 60 * 60 * 1000,  // Cookie expiry time (1 year here)
            });

            res.status(200).json({
                success: true,
                message: "Authentication successful"
            });
        } catch (error) {
            console.log(error);
            res.status(500).json({
                success: false,
                message: "Failed to authenticate, contact system administrator to solve this issue."
            });
            return;
        }


    } catch (error) {
        console.log(error)
        res.json({
            success: false,
            message: "Verification failed"
        });
    }

}

const disablePasskeysHandler = async (req, res) => {
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

    try {
        let sqlResponse = await sqlQuery(`DELETE FROM credentials WHERE userID=?`, [userdata["userID"]]);

        sqlResponse = await sqlQuery(`UPDATE userconfig SET passkey=0 WHERE userID=?`, [userdata["userID"]]);
        res.json({
            success: true,
            message: "Successfully disabled passkeys"
        })
        return;
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Failed to disable passkeys"
        })
        return;
    }

}


module.exports = { challengeHandler, webauthnRegHandler, authHandler, disablePasskeysHandler }