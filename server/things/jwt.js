const jwt = require("jsonwebtoken");
const fs = require("fs");
const {sqlQuery} = require("./db")


const verifyToken = (token) => {
    return new Promise(async (resolved) => {
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
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (error) {
            resolved({
                success: false,
                message: "Failed to verify token"
            })
            return;
        }
        let res = await sqlQuery(`SELECT 1 FROM devices WHERE deviceID = '${decoded["deviceID"]}'`);
        if (res.length == 0) {
            resolved({
                success: false,
                message: "Device not registered."
            })
        }

        resolved({
            success: true,
            data: decoded
        })
    })
}

module.exports = {verifyToken}