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
app.post("/api/v1/auth/changepass", changepassHandler);

app.listen(config["http"]["port"], () => {
    console.log(`Listening at http://localhost:${config["http"]["port"]}`);
})