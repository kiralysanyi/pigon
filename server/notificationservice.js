//push notification service
const { authMiddleWare } = require('./things/auth_middleware');
const fs = require("fs");

let { sendNotification, registerFirebaseClient, fbunsubscribe, sendCancelNotification } = require("./firebase");
const cancelNotification = sendCancelNotification;
let addRoute = (app) => {
    // Create route for allow client to subscribe to push notification.

    app.get("/api/v1/push/pubkey", (req, res) => {
        res.json({
            success: true,
            data: {
                pubkey: VAPID_PUB
            }
        });
    })

    app.use("/api/v1/firebase/register", authMiddleWare)
    app.post("/api/v1/firebase/register", (req, res) => {
        if (req.body.registrationToken == undefined) {
            res.status(400).json({
                success: false,
                message: "registrationToken not provided"
            })
            return;
        }
        registerFirebaseClient(req.userdata.userID, req.userdata.deviceID, req.body.registrationToken)
        res.json({
            success: true,
            message: "Added client to service"
        });
    })

}


let sendPushNotification = (target, title, message, url, messageID) => {
    sendNotification(target, title, message.content, messageID, url);
}


let unsubscribe = (userID, deviceID) => {
    console.log("Unsubscribe: ", userID, deviceID);
    try {
        fbunsubscribe(userID, deviceID)
    } catch (error) {
        console.error("Fb unsubscribe: ",error)
    }

}

module.exports = { unsubscribe, sendPushNotification, addRoute, cancelNotification }