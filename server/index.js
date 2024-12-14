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
const {authMiddleWare} = require("./things/auth_middleware");

//register endpoint
app.post("/api/v1/auth/register", registerHandler)
app.get("/favicon.ico", (req, res) => {
    res.sendFile(__dirname + "/public/favicon.ico")
})

app.get("/manifest.json", (req, res) => {
    res.sendFile(__dirname + "/public/manifest.json")
})

app.get("/sw.js", (req, res) => {
    res.sendFile(__dirname + "/public/sw.js")
})

app.get("/offline.html", (req, res) => {
    res.sendFile(__dirname + "/public/offline.html")
})

const loginHandler = require("./endpoints/v1/login").loginHandler;
app.post("/api/v1/auth/login", loginHandler)

const deleteHandler = require("./endpoints/v1/delete").deleteHandler
app.use("/api/v1/auth/delete", authMiddleWare);
app.delete("/api/v1/auth/delete", deleteHandler)

const devicesHandler = require("./endpoints/v1/devices").devicesHandler
app.use("/api/v1/auth/devices", authMiddleWare);
app.get("/api/v1/auth/devices", devicesHandler)

const userinfoHandler = require("./endpoints/v1/userinfo").userinfoHandler
app.use("/api/v1/auth/userinfo", authMiddleWare);
app.get("/api/v1/auth/userinfo", userinfoHandler)

const logoutHandler = require("./endpoints/v1/logout").logoutHandler;
app.use("/api/v1/auth/logout", authMiddleWare);
app.get("/api/v1/auth/logout", logoutHandler);

const removedeviceHandler = require("./endpoints/v1/removedevice").removedeviceHandler;
app.use("/api/v1/auth/removedevice", authMiddleWare);
app.delete("/api/v1/auth/removedevice", removedeviceHandler);

const changepassHandler = require("./endpoints/v1/changepass").changepassHandler;
app.use("/api/v1/auth/changepass", authMiddleWare);
app.put("/api/v1/auth/changepass", changepassHandler);

const { challengeHandler, webauthnRegHandler, authHandler, disablePasskeysHandler } = require("./endpoints/v1/webauthn/webauthn");
app.get("/api/v1/auth/webauthn/challenge", challengeHandler);
app.use("/api/v1/auth/webauthn/register", authMiddleWare);
app.post("/api/v1/auth/webauthn/register", webauthnRegHandler);
app.post("/api/v1/auth/webauthn/auth", authHandler);
app.use("/api/v1/auth/webauthn/passkeys", authMiddleWare);
app.delete("/api/v1/auth/webauthn/passkeys", disablePasskeysHandler)
app.get("/api/v1/auth/pfp", userimage.getImageHandler);

app.use("/api/v1/auth/pfp", authMiddleWare);
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

app.use("/api/v1/chat/messages", authMiddleWare);
app.use("/api/v1/chat/chats", authMiddleWare);
app.use("/api/v1/auth/search", authMiddleWare);


app.get("/api/v1/auth/search", require("./endpoints/v1/searchuser").searchHandler)
app.get("/api/v1/chat/chats", require("./endpoints/v1/chat/getchats").getChatsHandler)
app.get("/api/v1/chat/messages", require("./endpoints/v1/chat/getchats").getMessagesHandler)

const { addgroupuserHandler, deletegroupuserHandler } = require("./endpoints/v1/chat/groupthings");
app.post("/api/v1/chat/groupuser", addgroupuserHandler);
app.delete("/api/v1/chat/groupuser", deletegroupuserHandler);

//cdn
const { cdnGetHandler, cdnPostHandler } = require("./endpoints/v1/chat/cdn");
app.use("/api/v1/chat/cdn", authMiddleWare)
app.get("/api/v1/chat/cdn", cdnGetHandler);
app.post("/api/v1/chat/cdn", cdnPostHandler);

//push notification service
const webpush = require('web-push');


const VAPID_PUB = process.env.VAPID_PUB;
const VAPID_PRIV = process.env.VAPID_PRIV;

webpush.setVapidDetails("mailto:nan@null.null", VAPID_PUB, VAPID_PRIV);

app.get("/api/v1/push/pubkey", (req, res) => {
    res.json({
        success: true,
        data: {
            pubkey: VAPID_PUB
        }
    });
})

const subscriptions = {}

// Create route for allow client to subscribe to push notification.
app.use("/api/v1/push/subscribe", authMiddleWare)
app.post('/api/v1/push/subscribe', async (req, res) => {

    let userdata = req.userdata;

    if (subscriptions[userdata["userID"]] == undefined) {
        subscriptions[userdata["userID"]] = {};
    }

    const subscription = req.body;
    console.log(subscription);
    subscriptions[userdata["userID"]][userdata.deviceID] = subscription;
    res.status(201).json({});
})

let sendPushNotification = (target, title, message) => {
    let payload = { title, body: message.content };
    if (message.type != "text") {
        payload.body = "New message"
    }

    payload = JSON.stringify(payload);

    console.log(subscriptions,subscriptions[target], target);
    for (let i in subscriptions[target]) {
        webpush.sendNotification(subscriptions[target][i], payload).catch((err) => {
            console.error(err);
        });
    }
}


//socket.io things

// Authenticate socket connection
const { socketAuthHandler } = require("./communication_handler/authenticator");
io.use(socketAuthHandler);
const {newChatHandler,connectionHandler,addPushCallback} = require("./communication_handler/sockethandler");

addPushCallback(sendPushNotification);

io.on("connection", connectionHandler)

app.use("/api/v1/chat/create", authMiddleWare);
app.post("/api/v1/chat/create", require("./endpoints/v1/chat/createchat").createChatHandler(newChatHandler));




server.listen(process.env.PORT, () => {
    console.log(`Listening on port:${process.env.PORT}`);
    console.log(`Origin: ${process.env.ORIGIN}`);
})