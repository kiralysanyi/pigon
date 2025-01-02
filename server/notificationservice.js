//push notification service
const webpush = require('web-push');
const { authMiddleWare } = require('./things/auth_middleware');
const fs = require("fs");

const VAPID_PUB = process.env.VAPID_PUB;
const VAPID_PRIV = process.env.VAPID_PRIV;

webpush.setVapidDetails("mailto:nan@null.null", VAPID_PUB, VAPID_PRIV);



let subscriptions = {}
const subscriptions_path = __dirname + "/subscriptions.json";

if (fs.existsSync(subscriptions_path) == false) {
    fs.writeFileSync(subscriptions_path, "{}");
}

try {
    subscriptions = JSON.parse(fs.readFileSync(subscriptions_path));
} catch (error) {
    console.error("Failed to read saved subscriptions", error);
}

let saveSubscriptions = () => {
    fs.writeFileSync(subscriptions_path, JSON.stringify(subscriptions));
}

let firebaseNotify, firebaseUnsubscribe, cancelNotification;
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

    app.use("/api/v1/push/subscribe", authMiddleWare)
    app.post('/api/v1/push/subscribe', async (req, res) => {
        console.log("Subscribe: ", req.userdata);

        let userdata = req.userdata;

        if (subscriptions[userdata["userID"]] == undefined) {
            subscriptions[userdata["userID"]] = {};
        }

        const subscription = req.body;
        console.log(subscription);
        subscriptions[userdata["userID"]][userdata.deviceID] = subscription;
        saveSubscriptions();
        res.status(201).json({});
    })

    //check if firebase enabled

    if (fs.existsSync("./firebase.json")) {
        let { sendNotification, registerFirebaseClient, unsubscribe, sendCancelNotification } = require("./firebase");
        firebaseUnsubscribe = unsubscribe;
        firebaseNotify = sendNotification;
        cancelNotification = sendCancelNotification;
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
}


let sendPushNotification = (target, title, message, url) => {
    if (firebaseNotify != undefined) {
        firebaseNotify(target, title, message.content);
    }
    let payload = { title, body: message.content };
    if (message.type != "text") {
        payload.body = "New message";
    }

    if (url != undefined) {
        payload.url = url;
    }

    payload = JSON.stringify(payload);

    console.log(subscriptions, subscriptions[target], target);
    for (let i in subscriptions[target]) {
        webpush.sendNotification(subscriptions[target][i], payload, { urgency: "high" }).catch((err) => {
            console.error(err);
        });
    }
}


let unsubscribe = (userID, deviceID) => {
    console.log("Unsubscribe: ", userID, deviceID);
    try {
        console.log(subscriptions[userID][deviceID]);
        if (subscriptions[userID] != undefined && subscriptions[userID][deviceID] != undefined) {
            delete subscriptions[userID][deviceID];
            saveSubscriptions();
        }

    } catch (error) {
        console.error("Unsubscribe: ", error);
    }

    try {
        if (firebaseUnsubscribe != undefined) {
            firebaseUnsubscribe()
        }
    } catch (error) {
        console.error(error)
    }

}

module.exports = { unsubscribe, sendPushNotification, addRoute, cancelNotification }