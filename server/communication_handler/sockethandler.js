const { Socket } = require("socket.io");

let sendPushNotification, cancelNotification;

/**
 * 
 * @param {()=>{}} pushcallback 
 * @param {()=>{}} cancelcallback
 */
let addPushCallback = (pushcallback, cancelcallback) => {
    sendPushNotification = pushcallback;
    if (cancelcallback != undefined) {
        cancelNotification = cancelcallback;
    }
}

const sockets = {};
const socket_userid = {};

/**
 * 
 * @param {int} userID 
 * @param {string} channel 
 * @param {*} data 
 */
let sendDataToSockets = (userID, channel, data) => {
    for (let i in sockets[userID]) {
        sockets[userID][i].emit(channel, data);
    }
}

let isUserOnline = (userID) => {
    if (sockets[userID] == undefined) {
        return false;
    }

    if (Object.keys(sockets[userID]).length > 0) {
        return true;
    } else {
        return false;
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

const { removeValue, escapeJsonControlCharacters } = require("../things/helper");
const { getfbclients, cancelCallSignal, sendCallSignal } = require("../firebase");

function sanitizeInput(input) {
    // Replace characters that could break JSON
    return input.replace(/\\/g, '\\\\') // Escape backslashes
        .replace(/"/g, '\\"')   // Escape double quotes
        .replace(/</g, '&lt;') // Escape < to prevent HTML injection
        .replace(/>/g, '&gt;') // Escape > to prevent HTML injection
        .replace(/&/g, '&amp;') // Escape &
        .replace(/'/g, '&#39;'); // Escape single quotes
}

let getCallUsers = (callid) => { }

let SETgetCallUsers = (fn = (callid) => { }) => {
    getCallUsers = fn;
}

let socketLogoutHandler = (app) => {
    app.use("/api/v1/auth/logout", (req, res, next) => {
        try {
            sockets[req.userdata.userID][req.userdata.deviceID].disconnect(true);
            delete sockets[req.userdata.userID][req.userdata.deviceID]
            delete socket_userid[req.userdata.deviceID]
        } catch (error) {
            console.error("Socket logout handler: ", error)
        }

        next();
    })
}

var fbCallHandlers = {}

let connectionHandler = (socket) => {
    if (socket.userInfo == undefined) {
        return;
    }
    if (sockets[socket.userInfo.userID] == undefined) {
        sockets[socket.userInfo.userID] = {}
    }
    sockets[socket.userInfo.userID][socket.userInfo.deviceID] = socket;
    socket_userid[socket.userInfo.deviceID] = socket.userInfo.userID;
    socket.on("disconnect", (reason) => {
        console.log("Socket disconnected", reason);
        delete sockets[socket.userInfo.userID][socket.userInfo.deviceID]
    })

    //relay data between sockets
    socket.on("relay", ({ deviceID, data }) => {
        try {
            const targetUserID = socket_userid[deviceID];
            sockets[targetUserID][deviceID].emit("relay", { senderID: socket.userInfo.deviceID, data })
        } catch (error) {
            console.error(error)
            socket.emit("error", error)
        }

    })

    //this is used to accept or decline the call after a socket connected to the server. this is needed for the android app in the first place.
    socket.on("answercall", ({ callid, accepted, reason }) => {
        if (fbCallHandlers[callid] != undefined) {
            fbCallHandlers[callid](accepted, reason)
        }
    })

    socket.on("call", async ({ callid, username, chatid }) => {
        console.log("New call: ", callid, username, chatid);
        const callerID = socket.userInfo.userID;
        console.log("CallerID: ", callerID);
        let called = getCallUsers(callid);
        console.log(called);
        called = (removeValue(called, callerID))[0];
        console.log("Called: ", called);
        sendDataToSockets(called, "incomingcall", { callid, username, chatid });
        sendCallSignal(called, callid, username, chatid);


        let calltimeout = setTimeout(() => {
            cancelCallSignal(called, callid);
            sendPushNotification(called, "Missed Call", { type: "text", content: "You missed a call from: " + username }, 0);
            socket.emit("callresponse" + callid, { accepted: false, reason: "Not available" });
            if (fbCallHandlers[callid] != undefined) {
                delete fbCallHandlers[callid]
            }
        }, 60 * 1000);;

        socket.once("cancelcall", ({ callid, username, chatid }) => {
            clearTimeout(calltimeout)
            cancelCallSignal(called, callid);
            sendDataToSockets(called, "cancelledcall", { callid, username, chatid })
            if (fbCallHandlers[callid] != undefined) {
                delete fbCallHandlers[callid]
            }

        })

        let targetSockets = getSocketsForUser(called)
        fbCallHandlers[callid] = (accepted, reason) => {
            clearTimeout(calltimeout)
            socket.emit("callresponse" + callid, { accepted, reason })
            let sockets = getSocketsForUser(called)
            for (let i in sockets) {
                sockets[i].emit("acceptedcall")
            }
            delete fbCallHandlers[callid]
        }

        for (let i in targetSockets) {
            targetSockets[i].once("response" + callid, ({ accepted, reason }) => {
                clearTimeout(calltimeout)
                for (let x in targetSockets) {
                    targetSockets[x].emit("acceptedcall");
                }
                console.log(accepted, reason);
                if (fbCallHandlers[callid] != undefined) {
                    delete fbCallHandlers[callid]
                }
                socket.emit("callresponse" + callid, { accepted, reason })
            })
        }

    });

    socket.on("setLastRead", async ({ chatID, messageID }) => {
        let userID = socket.userInfo.userID;
        console.log(userID, " read ", messageID);
        //TODO: productionből kivenni a logolást mert ha ezt meglátja valamelyik nagyokos falnak megy

        //Trying to evade deadlock
        setTimeout(async () => {
            try {
                await sqlQuery(`UPDATE \`user-chat\` SET lastReadMessage=? WHERE userID=? AND chatid=?`, [messageID, userID, chatID]);
            } catch (error) {
                console.log("Probabbly deadlock again for fuck's sake, anyway, lets try again xD");
                try {
                    await sqlQuery(`UPDATE \`user-chat\` SET lastReadMessage=? WHERE userID=? AND chatid=?`, [messageID, userID, chatID]);
                } catch (error) {
                    console.log("I give up");
                }
            }
        }, 1000);
    })

    socket.on("cancelmessage", ({ messageID }) => {
        //get info about this message
        sqlQuery("SELECT * FROM messages WHERE id=?", [messageID]).then((result) => {
            if (result.length == 0) {
                socket.emit("error", "Message not found: " + messageID)
                return;
            }

            //verify if the message belongs to the requestor

            if (result[0].senderid != socket.userInfo.userID) {
                socket.emit("error", "This message belongs to an other user.")
                return;
            }

            //everything went great now get the chatid, broadcast a cancel signal and flag the message as cancelled

            const chatid = result[0]["chatid"]

            sqlQuery(`SELECT participants FROM chats WHERE id=?`, [chatid]).then((result) => {
                sqlQuery(`DELETE FROM messages WHERE id=?`, [messageID])
                let toNotify = JSON.parse(result[0]["participants"]);

                for (let i in toNotify) {
                    sendDataToSockets(toNotify[i], "cancelmessage", { messageID, chatID: chatid })
                }
            }).catch((err) => {
                console.error(err)
                socket.emit("error", err)
            })


        }).catch((err) => {
            console.error(err)
            socket.emit("error", err)
        })
    })

    socket.on("message", async ({ chatID, message }) => {
        let senderID = socket.userInfo.userID;
        let senderName = socket.userInfo.username;

        if (chatID == undefined) {
            socket.emit("error", "No target")
            return;
        }

        if (message.type == undefined || message.content == undefined) {
            socket.emit("error", "Invalid message format. Expected: {type, content}")
            return;
        }

        let rawMessage = message.content;

        try {
            //sanitize

            if (message.type == "text") {
                message.content = sanitizeInput(message.content);
                message.content = escapeJsonControlCharacters(message.content);
            }

            await sqlQuery(`INSERT INTO messages (chatid, senderid, message) VALUES (?,?,?)`, [chatID, senderID, JSON.stringify(message)]);

            let latestmessageinchat = await sqlQuery(`SELECT id FROM messages WHERE chatid=? ORDER BY id DESC LIMIT 1`, [chatID]);
            if (latestmessageinchat.length > 0) {
                latestmessageinchat = latestmessageinchat[0]["id"];
                await sqlQuery(`UPDATE \`user-chat\` SET lastReadMessage=? WHERE userID=? AND chatid=?`, [latestmessageinchat, senderID, chatID]);
            } else {
                latestmessageinchat = 0;
            }


            let toNotify = []

            let result = await sqlQuery(`SELECT participants FROM chats WHERE id=?`, [chatID]);

            toNotify = JSON.parse(result[0]["participants"]);

            for (let i in toNotify) {
                sendDataToSockets(toNotify[i], "message", JSON.stringify({ chatID, senderID, message, senderName: senderName, messageID: latestmessageinchat }));
                if (toNotify[i] != senderID) {
                    if (message.type == "text") {
                        message.content = rawMessage;
                    }
                    sendPushNotification(toNotify[i], senderName, message, latestmessageinchat, chatID);
                }
            }

            await sqlQuery(`UPDATE chats SET lastInteraction=CURRENT_TIMESTAMP() WHERE id=?`, [chatID]);
        } catch (error) {
            console.error(error);
            socket.emit("error", error);
        }

    })

}

module.exports = { newChatHandler, connectionHandler, addPushCallback, SETgetCallUsers, socketLogoutHandler }