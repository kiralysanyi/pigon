require('dotenv').config()

const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server, { cookie: true, path: "/socketio" });
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
const { authMiddleWare } = require("./things/auth_middleware");

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

const { addgroupuserHandler, deletegroupuserHandler, deleteGroupHandler, leaveGroupHandler } = require("./endpoints/v1/chat/groupthings");
app.use("/api/v1/chat/groupuser", authMiddleWare);
app.post("/api/v1/chat/groupuser", addgroupuserHandler);
app.delete("/api/v1/chat/groupuser", deletegroupuserHandler);
app.use("/api/v1/chat/group", authMiddleWare);
app.delete("/api/v1/chat/group", deleteGroupHandler);
app.use("/api/v1/chat/leave", authMiddleWare);
app.post("/api/v1/chat/leave", leaveGroupHandler);

//cdn
const { cdnGetHandler, cdnPostHandler } = require("./endpoints/v1/chat/cdn");
app.use("/api/v1/chat/cdn", authMiddleWare)
app.get("/api/v1/chat/cdn", cdnGetHandler);
app.post("/api/v1/chat/cdn", cdnPostHandler);

const notificationService = require("./notificationservice")

const removedeviceHandler = require("./endpoints/v1/removedevice").removedeviceHandler;
app.use("/api/v1/auth/removedevice", authMiddleWare);
app.use("/api/v1/auth/removedevice", (req, res, next) => {
    req.unsubscribe = notificationService.unsubscribe();
    next();
})
app.delete("/api/v1/auth/removedevice", removedeviceHandler);

app.use("/api/v1/auth/logout", authMiddleWare);

//socket.io things

// Authenticate socket connection
const { socketAuthHandler } = require("./communication_handler/authenticator");
io.use(socketAuthHandler);
const { newChatHandler, connectionHandler, addPushCallback, SETgetCallUsers, socketLogoutHandler } = require("./communication_handler/sockethandler");
socketLogoutHandler(app);

app.use("/api/v1/auth/logout", (req, res, next) => {
    let userdata = req.userdata;
    notificationService.unsubscribe(userdata.userID, userdata.deviceID);
    next();
})

const logoutHandler = require("./endpoints/v1/logout").logoutHandler;
app.get("/api/v1/auth/logout", logoutHandler);



notificationService.addRoute(app)


addPushCallback(notificationService.sendPushNotification, notificationService.cancelNotification)


app.use("/api/v1/chat/messages", (req, res, next) => {
    if (notificationService.cancelNotification != undefined || notificationService.cancelNotification != null) {
        req.cancelNotification = notificationService.cancelNotification;
    } else {
        req.cancelNotification = () => { };
    }

    next();
})
app.get("/api/v1/chat/messages", require("./endpoints/v1/chat/getchats").getMessagesHandler)

io.on("connection", connectionHandler)

app.use("/api/v1/chat/create", authMiddleWare);
app.post("/api/v1/chat/create", require("./endpoints/v1/chat/createchat").createChatHandler(newChatHandler));


//call things
const { createCallHandler, initCallJS } = require('./endpoints/v1/chat/call');
const { removeValue } = require('./things/helper');
const { versionHandler } = require('./endpoints/v1/cacheversion');
const { getExtraInfoHandler, postExtraInfoHandler } = require('./endpoints/v1/userinfo_extra');

let calls = {}

initCallJS((callid, allowedIDs, chatid) => {
    calls[callid] = {
        users: allowedIDs,
        chat: chatid,
        peers: []
    };
    console.log(calls);
});

SETgetCallUsers((callid) => {
    return calls[callid]["users"];
});

app.use("/api/v1/chat/getPeerIDs", authMiddleWare);
app.use("/api/v1/chat/registerPeer", authMiddleWare);
app.use("/api/v1/chat/callusers", authMiddleWare);
app.get("/api/v1/chat/callusers", (req, res) => {
    /*
{
    userID: 69,
    username: "lakatos rikárdinnyó",
    deviceID: "aaa",
    deviceInfo: {
        "user-agent": "xy",
        "deviceName": "xyz"
    }
}
*/
    const userinfo = req.userdata;
    const callid = req.query.callid;

    if (callid == undefined) {
        res.status(400).json({
            success: false,
            message: "callid not provided"
        });
        return;
    }


    if (calls[callid]["users"].includes(userinfo.userID) == false) {
        res.status(403).json({
            success: false,
            message: "You are not allowed in this call"
        });
        return;
    }

    res.json({
        success: true,
        data: calls[callid]["users"]
    });

})

app.post("/api/v1/chat/registerPeer", (req, res) => {
    /*
{
        userID: 69,
        username: "lakatos rikárdinnyó",
        deviceID: "aaa",
        deviceInfo: {
            "user-agent": "xy",
            "deviceName": "xyz"
        }
}
*/
    const userinfo = req.userdata;
    const callid = req.body.callid;

    if (callid == undefined) {
        res.status(400).json({
            success: false,
            message: "callid not provided"
        });
        return;
    }


    if (calls[callid]["users"].includes(userinfo.userID) == false) {
        res.status(403).json({
            success: false,
            message: "You are not allowed in this call"
        });
        return;
    }

    if (calls[callid]["peers"].includes(userinfo.deviceID) == true) {
        res.json({
            success: true,
            message: "Device already registered"
        });
        return;
    }
    calls[callid]["peers"].push(userinfo.deviceID);
    res.json({
        success: true,
        message: "Device registered"
    });

});

app.get("/api/v1/chat/getPeerIDs", (req, res) => {
    const userinfo = req.userdata;
    const callid = req.query.callid;
    console.log(req.userdata);


    if (callid == undefined) {
        res.status(400).json({
            success: false,
            message: "callid not provided"
        });
        return;
    }

    if (calls[callid] == undefined) {
        res.status(404).json({
            success: false,
            message: "Call not initialized."
        })
    }

    if (calls[callid]["users"].includes(userinfo.userID) == false) {
        res.status(403).json({
            success: false,
            message: "You are not allowed in this call"
        });
        return;
    }

    let getpeers = () => {
        let peers = calls[callid]["peers"];
        peers = removeValue(peers, userinfo.deviceID);
        if (peers.length == 0) {
            setTimeout(() => {
                getpeers();
            }, 1000);
            return;
        }

        res.json({
            success: true,
            data: peers
        })
    }

    getpeers();

})

app.use("/api/v1/chat/prepareCall", authMiddleWare)
app.post("/api/v1/chat/prepareCall", createCallHandler);
app.use("/api/v1/auth/extrainfo", authMiddleWare);

app.get("/api/v1/auth/extrainfo", getExtraInfoHandler);
app.post("/api/v1/auth/extrainfo", postExtraInfoHandler);

app.get("/api/v1/cacheversion", versionHandler);




server.listen(process.env.PORT, () => {
    console.log(`Listening on port:${process.env.PORT}`);
    console.log(`Origin: ${process.env.ORIGIN}`);
})