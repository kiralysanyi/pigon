const express = require("express");
const app = express();
let cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
let jsonParser = bodyParser.json;
const fs = require("fs");
const cors = require("cors");


app.use(jsonParser());
app.use(cookieParser());
app.use(cors({
    origin: "*"
}));

app.use(require('sanitize').middleware);


let config = JSON.parse(fs.readFileSync(__dirname + "/config.json"));




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

const {challengeHandler, webauthnRegHandler, authHandler} = require("./endpoints/v1/webauthn/webauthn");
app.get("/api/v1/auth/webauthn/challenge", challengeHandler);
app.post("/api/v1/auth/webauthn/register", webauthnRegHandler);
app.post("/api/v1/auth/webauthn/auth", authHandler);


//test endpoints
const path = require("path");
app.get("/test/webauthn.min.js", (req,res) => {
    res.sendFile(path.join(__dirname, "node_modules", "@passwordless-id", "webauthn", "dist", "browser", "webauthn.min.js"));
})
app.use("/test", express.static("webauthn-test"));

app.listen(config["http"]["port"], () => {
    console.log(`Listening at http://localhost:${config["http"]["port"]}`);
})