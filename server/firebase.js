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

const registerFirebaseClient = (userID, registrationToken) => {
    if (subs[userID] == undefined) {
        subs[userID] = []
    }

    subs[userID].push(registrationToken)
}

const sendNotification = (userID, title, body) => {
    let registrationTokens = subs[userID];
    if (registrationTokens == undefined) {
        return;
    }
    const message = {
        data: {
            title: title,
            body: body
        },
        tokens: registrationTokens
    };

    admin.messaging().sendMulticast(message)
        .then((response) => {
            console.log('Multicast notification sent:', response);
        })
        .catch((error) => {
            console.error('Error sending multicast notification:', error);
        });

}

module.exports = {sendNotification, registerFirebaseClient}