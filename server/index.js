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
    console.log(req.cookies);
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


//socket.io things

// Authenticate socket connection
const { socketAuthHandler } = require("./communication_handler/authenticator");
io.use(socketAuthHandler);

const sockets = {}

let sendMessage = (targetID) => {
    for (let i in sockets[targetID]) {
        sockets[targetID][i].emit("message", { senderID: userID, senderName: username, chatID, isGroupChat, message });
    }
}

let newChatHandler = ({ isGroupChat, chatID, chatName, participants, initiator }) => {
    console.log("New Chat: ", isGroupChat, chatID, chatName, participants, initiator);
}

const { sqlQuery } = require("./things/db")

io.on("connection", (socket) => {
    sockets[socket.userInfo.userID] = {}
    sockets[socket.userInfo.userID][socket.userInfo.deviceID] = socket;
    socket.on("disconnect", () => {
        console.log("Socket disconnected");
        delete sockets[socket.userInfo.userID][socket.userInfo.deviceID]
        console.log(sockets[socket.userInfo.userID]);
    })

    socket.on("message", (message, chatID) => {
        let userID = socket.userInfo.userID;
        let username = socket.userInfo.username;
        let isGroupChat = false;



        try {


            if (Object.keys(sockets[targetID]).length == 0) {
                //no target devices found only save to db   
                return;
            }


        } catch (error) {
            socket.emit("error", error)
        }
    })
})

app.post("/api/v1/chat/create", require("./endpoints/v1/chat/createchat").createChatHandler(newChatHandler))


server.listen(process.env.PORT, () => {
    console.log(`Listening at http://localhost:${process.env.PORT}`);
})