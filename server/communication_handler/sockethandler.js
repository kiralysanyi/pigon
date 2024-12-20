const { Socket } = require("socket.io");

let sendPushNotification;

/**
 * 
 * @param {()=>{}} pushcallback 
 */
let addPushCallback = (pushcallback) => {
    sendPushNotification = pushcallback;
}

const sockets = {}

/**
 * 
 * @param {int} userID 
 * @param {string} channel 
 * @param {*} data 
 */
let sendDataToSockets = (userID, channel, data) => {
    console.log(`Sockets for user: ${userID} `, sockets[userID])
    for (let i in sockets[userID]) {
        sockets[userID][i].emit(channel, data);
    }
}

let getSocketsForUser = (userID) => {
    return sockets[userID]
}

let newChatHandler = ({ isGroupChat, chatID, chatName, participants, initiator }) => {
    console.log("New Chat: ", isGroupChat, chatID, chatName, participants, initiator);
    for (let i in participants) {
        sendDataToSockets(participants[i], "newchat", { isGroupChat, chatID, chatName, participants, initiator })
    }
}

const { sqlQuery } = require("../things/db")

const { removeValue } = require("../things/helper");

function sanitizeInput(input) {
    // Replace characters that could break JSON
    return input.replace(/\\/g, '\\\\') // Escape backslashes
        .replace(/"/g, '\\"')   // Escape double quotes
        .replace(/</g, '&lt;') // Escape < to prevent HTML injection
        .replace(/>/g, '&gt;') // Escape > to prevent HTML injection
        .replace(/&/g, '&amp;') // Escape &
        .replace(/'/g, '&#39;'); // Escape single quotes
}

/**
 * 
 * @param {Socket} socket 
 */

let getCallUsers = (callid) => {}

let SETgetCallUsers = (fn = (callid) => {}) => {
    getCallUsers = fn;
}

let connectionHandler = (socket) => {
    if (socket.userInfo == undefined) {
        return;
    }
    if (sockets[socket.userInfo.userID] == undefined) {
        sockets[socket.userInfo.userID] = {}
    }
    sockets[socket.userInfo.userID][socket.userInfo.deviceID] = socket;
    socket.on("disconnect", (reason) => {
        console.log("Socket disconnected", reason);
        delete sockets[socket.userInfo.userID][socket.userInfo.deviceID]
    })

    socket.on("call", async ({callid, username, chatid}) => {
        console.log("New call: ", callid, username, chatid);
        const callerID = socket.userInfo.userID;
        console.log("CallerID: ", callerID);
        let called = getCallUsers(callid);
        console.log(called);
        called = (removeValue(called, callerID))[0];
        console.log("Called: ", called);
        sendDataToSockets(called, "incomingcall", {callid, username, chatid});
        socket.once("cancelcall", ({callid, username, chatid}) => {
            sendDataToSockets(called, "cancelledcall", {callid, username, chatid})
        })
        let targetSockets = getSocketsForUser(called);
        if (targetSockets == undefined || Object.keys(targetSockets).length == 0) {
            sendPushNotification(called, "Missed Call", {type: "text", content: "You missed a call from: " + username});
            socket.emit("callresponse" + callid, {accepted: false, reason: "Not available"});
            return;
        }
        for (let i in targetSockets) {
            targetSockets[i].once("response" + callid, ({accepted, reason}) => {
                for (let x in targetSockets) {
                    targetSockets[x].emit("acceptedcall");
                }
                console.log(accepted, reason);
                socket.emit("callresponse" + callid, {accepted, reason})
            })
        }
    })

    socket.on("message", async ({ chatID, message }) => {
        let senderID = socket.userInfo.userID;
        let senderName = socket.userInfo.username;

        if (chatID == undefined) {
            socket.emit("error", "No target")
            return;
        }

        if (message.type == undefined || message.content == undefined) {
            socket.emit("error", "Invalid message")
            return;
        }

        try {
            //sanitize
            if (message.type == "text") {
                message.content = sanitizeInput(message.content);
            }

            await sqlQuery(`INSERT INTO messages (chatid, senderid, message) VALUES ('${chatID}','${senderID}','${JSON.stringify(message)}')`);

            let toNotify = []

            let result = await sqlQuery(`SELECT participants FROM chats WHERE id=${chatID}`);

            toNotify = JSON.parse(result[0]["participants"]);

            for (let i in toNotify) {
                sendDataToSockets(toNotify[i], "message", JSON.stringify({ chatID, senderID, message, senderName: senderName }));
                if (toNotify[i] != senderID) {
                    sendPushNotification(toNotify[i], senderName, message);
                }
            }

        } catch (error) {
            console.error(error);
            socket.emit("error", error);
        }

    })

} 

module.exports = {newChatHandler, connectionHandler, addPushCallback, SETgetCallUsers}