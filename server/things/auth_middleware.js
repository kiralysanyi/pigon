const {verifyToken} = require("./jwt");

let authMiddleWare = async (req, res, next) => {
        if (!req.cookies.token) {
            res.status(403).json({
                success: false,
                message: "Failed to verify user"
            });
            return;
        }
    
        let verificationResponse = await verifyToken(req.cookies.token);
        if (verificationResponse.success == false) {
            res.status(403).json({
                success: false,
                message: "Failed to verify token"
            });
            return;
        }
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
        let userdata = verificationResponse.data;
        req.userdata = userdata;
        next();
}

module.exports = {authMiddleWare}