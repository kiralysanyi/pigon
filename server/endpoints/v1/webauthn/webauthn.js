const { server } = require("@passwordless-id/webauthn");
const { verifyPass, userExists, sqlQuery, registerDevice } = require("../../../things/db");
const jwt = require("jsonwebtoken");
const uid = require("uuid").v4;
const fs = require("fs");
let config = JSON.parse(fs.readFileSync(__dirname + "/../../../config.json"));


let challenges = [];
const origin = "http://localhost:8080"

const challengeHandler = async (req, res) => {
    const challenge = server.randomChallenge();
    challenges.push(challenge);
    res.json({ challenge })
}

const webauthnRegHandler = async (req, res) => {
    let username = req.body.username;
    let password = req.body.password;
    let registration = req.body.registration;
    console.log(username, password, registration)

    if (username == undefined || password == undefined || registration == undefined) {
        res.json({
            success: false,
            data: {
                message: "Invalid request."
            }
        });
        return;
    }

    if (await userExists(username) == false) {
        res.json({
            success: false,
            data: {
                message: "User not found"
            }
        })
        return;
    }

    if (await verifyPass(username, password) == false) {
        res.json({
            success: false,
            data: {
                message: "Wrong password"
            }
        });
        return;
    }


    const expected = {
        challenge: req.body.challenge,
        origin: origin
    }

    console.log(expected)

    const registrationParsed = await server.verifyRegistration(registration, expected)
    let credential = registrationParsed["credential"];
    let credentialString = JSON.stringify(credential);
    let userID = (await sqlQuery(`SELECT id FROM users WHERE username = '${username}'`))[0]["id"];
    try {
        let query = `INSERT INTO credentials (userID, credential, credentialID) VALUES ('${userID}','${credentialString}', '${credential["id"]}')`;
        console.log(query);
        await sqlQuery(query);
        await sqlQuery(`UPDATE userconfig SET passkey = 1 WHERE userID = ${userID}`);
        res.json({
            success: true,
            data: {
                message: "Added passkey succesfully"
            }
        })
    } catch (error) {
        res.json({
            success: false,
            data: {
                message: "Something went wrong :("
            }
        });
    }

}

const authHandler = async (req, res) => {
    let username = req.body.username;
    let authentication = req.body.authentication;
    let challenge = req.body.challenge;
    let credentialID = authentication["id"];

    if (username == undefined || authentication == undefined) {
        res.json({
            success: false,
            data: {
                message: "Invalid request"
            }
        });
    }

    if (await userExists(username) == false) {
        res.json({
            success: false,
            data: {
                message: "User not found"
            }
        })
        return;
    }

    let response = await sqlQuery(`SELECT credential FROM credentials WHERE credentialID = '${credentialID}'`);
    if (response.length == 0) {
        res.json({
            success: false,
            data: {
                message: "Authentication failed"
            }
        });
        return;
    }

    let credential = JSON.parse(response[0]["credential"]);
    //console.log(credential);
    const expected = {
        challenge: challenge,
        origin: origin
    }

    try {
        const authenticationParsed = await server.verifyAuthentication(authentication, credential, expected)
        let deviceID = uid();
        let deviceInfo = {
            "user-agent": req.headers["user-agent"],
            "deviceName": "Webauthn authentication provider"
        }

        try {
            let userInfo = (await sqlQuery(`SELECT id, username FROM users WHERE username = '${username}'`))[0]

            let token = jwt.sign({
                userID: userInfo["id"],
                username: userInfo["username"],
                deviceID: deviceID,
                deviceInfo: deviceInfo,
            }, config["jwt"]["secret"], { expiresIn: "7d" });

            await registerDevice(deviceID, userInfo["id"], deviceInfo);
            res.json({
                success: true,
                data: {
                    message: "Logged in successfully",
                    token: token
                }
            });
        } catch (error) {
            console.log(error);
            res.status(500).json({
                success: false,
                data: {
                    message: "Failed to authenticate, contact system administrator to solve this issue."
                }
            });
            return;
        }


    } catch (error) {
        console.log(error)
        res.json({
            success: false,
            data: {
                message: "Verification failed"
            }
        });
    }

}


module.exports = { challengeHandler, webauthnRegHandler, authHandler }