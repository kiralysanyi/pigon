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

const sendNotification = (userID, title, body) => {
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
        let message = {
            data: {
                title: title,
                body: body
            },
            token: registrationTokens[i]
        };
        admin.messaging().send(message).then((result) => {
            console.log("Firebase send: ", result)
        }).catch((err) => {
            console.error("Firebase err: ", err)
        })
    }

}

module.exports = {sendNotification, registerFirebaseClient}