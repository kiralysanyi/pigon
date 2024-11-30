require('dotenv').config()

const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server, { cookie: true });
let cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
let jsonParser = bodyParser.json;
const fs = require("fs");
const cors = require("cors");
const verifyToken = require("./things/jwt").verifyToken;

const userimage = require("./endpoints/v1/userimage");

const fileupload = require("express-fileupload");

app.use(fileupload({ limits: { files: 1, fileSize: 10000000 } }));

app.use(jsonParser());
app.use(cookieParser());
app.use(cors({
    origin: "*"
}));

app.use(require('sanitize').middleware);



const registerHandler = require("./endpoints/v1/register").registerHandler;

//register endpoint
app.post("/api/v1/auth/register", registerHandler)


const loginHandler = require("./endpoints/v1/login").loginHandler;
app.post("/api/v1/auth/login", loginHandler)

const deleteHandler = require("./endpoints/v1/delete").deleteHandler
app.delete("/api/v1/auth/delete", deleteHandler)

const devicesHandler = require("./endpoints/v1/devices").devicesHandler
app.get("/api/v1/auth/devices", devicesHandler)

const userinfoHandler = require("./endpoints/v1/userinfo").userinfoHandler
app.get("/api/v1/auth/userinfo", userinfoHandler)

const logoutHandler = require("./endpoints/v1/logout").logoutHandler;
app.get("/api/v1/auth/logout", logoutHandler);

const removedeviceHandler = require("./endpoints/v1/removedevice").removedeviceHandler;
app.delete("/api/v1/auth/removedevice", removedeviceHandler);

const changepassHandler = require("./endpoints/v1/changepass").changepassHandler;
app.put("/api/v1/auth/changepass", changepassHandler);

const { challengeHandler, webauthnRegHandler, authHandler, disablePasskeysHandler } = require("./endpoints/v1/webauthn/webauthn");
app.get("/api/v1/auth/webauthn/challenge", challengeHandler);
app.post("/api/v1/auth/webauthn/register", webauthnRegHandler);
app.post("/api/v1/auth/webauthn/auth", authHandler);
app.delete("/api/v1/auth/webauthn/passkeys", disablePasskeysHandler)
app.get("/api/v1/auth/pfp", userimage.getImageHandler);
app.post("/api/v1/auth/pfp", userimage.uploadHandler);



app.use("/app/webui/", async (req, res, next) => {
    if (!req.cookies["token"]) {
        console.log("No token provided");
        res.redirect("/app/login.html");
        return;
    }
    if (await verifyToken(req.cookies["token"]) == false) {
        console.log("Invalid token");
        res.redirect("/app/login.html");
        return;
    }

    next();

})

app.use("/app", express.static(__dirname + "/public"));

app.get("/", (req, res) => {
    res.redirect("/app/login.html");
})

app.get("/api/v1/auth/search", require("./endpoints/v1/searchuser").searchHandler)
app.get("/api/v1/chat/chats", require("./endpoints/v1/chat/getchats").getChatsHandler)
app.get("/api/v1/chat/messages", require("./endpoints/v1/chat/getchats").getMessagesHandler)

//socket.io things

// Authenticate socket connection
const { socketAuthHandler } = require("./communication_handler/authenticator");
io.use(socketAuthHandler);

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

let newChatHandler = ({ isGroupChat, chatID, chatName, participants, initiator }) => {
    console.log("New Chat: ", isGroupChat, chatID, chatName, participants, initiator);
    for (let i in participants) {
        sendDataToSockets(participants[i], "newchat", { isGroupChat, chatID, chatName, participants, initiator })
    }
}

const { sqlQuery } = require("./things/db")

/**
 * Removes a specific value from an array.
 * @param {Array} array - The array to modify.
 * @param {*} valueToRemove - The value to remove.
 * @returns {Array} - A new array without the specified value.
 */
function removeValue(array, valueToRemove) {
    return array.filter(value => value !== valueToRemove);
}

function sanitizeInput(input) {
    // Replace characters that could break JSON
    return input.replace(/\\/g, '\\\\') // Escape backslashes
                .replace(/"/g, '\\"')   // Escape double quotes
                .replace(/</g, '&lt;') // Escape < to prevent HTML injection
                .replace(/>/g, '&gt;') // Escape > to prevent HTML injection
                .replace(/&/g, '&amp;') // Escape &
                .replace(/'/g, '&#39;'); // Escape single quotes
}

io.on("connection", (socket) => {
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

            toNotify = removeValue(JSON.parse(result[0]["participants"]), senderID);

            for (let i in toNotify) {
                sendDataToSockets(toNotify[i], "message", JSON.stringify({ chatID, senderID, message, senderName: senderName }))
            }

        } catch (error) {
            console.error(error);
            socket.emit("error", error);
        }

    })

})

app.post("/api/v1/chat/create", require("./endpoints/v1/chat/createchat").createChatHandler(newChatHandler))


server.listen(process.env.PORT, () => {
    console.log(`Listening on port:${process.env.PORT}`);
    console.log(`Origin: ${process.env.ORIGIN}`);
})