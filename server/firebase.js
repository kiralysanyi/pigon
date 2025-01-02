const fs = require("fs")


let subs = {}

if (!fs.existsSync("./firebase_subs.json")) {
    fs.writeFileSync("./firebase_subs.json", "{}")
}

subs = JSON.parse(fs.readFileSync("./firebase_subs.json"))

let admin = require("firebase-admin");


let serviceAccount = require("./firebase.json");


admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const registerFirebaseClient = (userID, deviceID, registrationToken) => {
    if (subs[userID] == undefined) {
        subs[userID] = {}
    }

    subs[userID][deviceID] = registrationToken
    fs.writeFileSync("./firebase_subs.json", JSON.stringify(subs))
}

const sendCancelNotification = (userID, messageID) => {
    let registrationTokens = [];
    if (subs[userID] == undefined) {
        console.log("Firebase: userid not found ", userID)
        return;
    }
    for (let i in subs[userID]) {
        registrationTokens.push(subs[userID][i])
    }

    if (registrationTokens.length == 0) {
        return;
    }


    for (let i in registrationTokens) {
        let msg = {
            data: {
                type: "cancel",
                messageID: messageID.toString()
            },
            token: registrationTokens[i]
        }

        if (imageUrl != undefined) {
            msg.imageUrl = imageUrl;
        }

        admin.messaging().send(msg).then((result) => {
            console.log("Firebase send: ", result)
        }).catch((err) => {
            console.error("Firebase err: ", err)
        })
    }
}

const sendNotification = (userID, title, body, messageID, imageUrl = undefined) => {
    console.log("Firebase: ", userID, title, body, subs[userID]);
    let registrationTokens = [];
    if (subs[userID] == undefined) {
        console.log("Firebase: userid not found ", userID)
        return;
    }
    for (let i in subs[userID]) {
        registrationTokens.push(subs[userID][i])
    }

    if (registrationTokens.length == 0) {
        return;
    }


    for (let i in registrationTokens) {
        let msg = {
            notification: {
                title: title,
                body: body,
            },
            data: {
                type: "message",
                messageID: messageID.toString(),
                date: new Date().toISOString().toString()
            },
            token: registrationTokens[i]
        }

        admin.messaging().send(msg).then((result) => {
            console.log("Firebase send: ", result)
        }).catch((err) => {
            console.error("Firebase err: ", err)
        })
    }

}

let unsubscribe = (userID, deviceID) => {
    console.log("Unsubscribe: ", userID, deviceID);
    try {
        console.log(subs[userID][deviceID]);
        if (subs[userID] != undefined && subs[userID][deviceID] != undefined) {
            delete subs[userID][deviceID];
            fs.writeFileSync("./firebase_subs.json", JSON.stringify(subs))
        }

    } catch (error) {
        console.error("Unsubscribe: ", error);
    }

}

module.exports = { sendNotification, registerFirebaseClient, unsubscribe, sendCancelNotification }