const fs = require("fs")


const firebaseEnabled = fs.existsSync("./firebase.json")

let subs = {}

if (!fs.existsSync("./firebase_subs.json")) {
    fs.writeFileSync("./firebase_subs.json", "{}")
}

subs = JSON.parse(fs.readFileSync("./firebase_subs.json"))

let admin = require("firebase-admin");


let serviceAccount;

if (firebaseEnabled) {
    serviceAccount = require("./firebase.json");
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}




const registerFirebaseClient = (userID, deviceID, registrationToken) => {
    if (!firebaseEnabled) {
        return;
    }
    if (subs[userID] == undefined) {
        subs[userID] = {}
    }

    subs[userID][deviceID] = registrationToken
    fs.writeFileSync("./firebase_subs.json", JSON.stringify(subs))
}

const sendCancelNotification = (userID, messageID) => {
    if (!firebaseEnabled) {
        return;
    }
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

        admin.messaging().send(msg).then((result) => {
            console.log("Firebase send: ", result)
        }).catch((err) => {
            console.error("Firebase err: ", err)
        })
    }
}

const sendNotification = (userID, title, body, messageID = 0) => {
    if (!firebaseEnabled) {
        return;
    }
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
            data: {
                title: title,
                body: body,
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

let getfbclients = (userid) => {
    if (!firebaseEnabled) {
        return [];
    }
    try {
        return Object.keys(subs[userid])
    } catch (error) {
        return [];
    }
}

let sendCallSignal = (userID, callid, displayName, chatid) => {
    if (!firebaseEnabled) {
        return;
    }
    try {
        for (let i in subs[userID]) {
            let registrationToken = subs[userID][i]
            let msg = {
                data: {
                    type: "call",
                    username: displayName,
                    callid: callid,
                    date: new Date().toISOString().toString()
                },
                token: registrationToken
            }
            admin.messaging().send(msg).then((result) => {
                console.log("Callsignal: ", result)
            }).catch((error) => {
                console.error("Callsignal: ", error)
            })
        }
    } catch (error) {
        console.error("Failed to send callsignal", userID, callid, error)
    }
}

let cancelCallSignal = (userID, callid) => {
    if (!firebaseEnabled) {
        return;
    }
    try {
        for (let i in subs[userID]) {
            let registrationToken = subs[userID][i]
            let msg = {
                data: {
                    type: "cancelcall",
                    callid: callid,
                    date: new Date().toISOString().toString()
                },
                token: registrationToken
            }
            admin.messaging().send(msg).then((result) => {
                console.log("Callsignal (cancel): ", result)
            }).catch((error) => {
                console.error("Callsignal (cancel): ", error)
            })
        }
    } catch (error) {
        console.error("Failed to send callsignal cancellation", userID, callid, error)
    }
}

let fbunsubscribe = (userID, deviceID) => {
    if (!firebaseEnabled) {
        return;
    }
    console.log("FB Unsubscribe: ", userID, deviceID);
    try {
        
        if (subs[userID] != undefined && subs[userID][deviceID] != undefined) {
            delete subs[userID][deviceID];
            fs.writeFileSync("./firebase_subs.json", JSON.stringify(subs))
        }

    } catch (error) {
        console.error("FB Unsubscribe: ", error);
    }

}

module.exports = { sendNotification, registerFirebaseClient, fbunsubscribe, sendCancelNotification, getfbclients, sendCallSignal, cancelCallSignal }