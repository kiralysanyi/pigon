const express = require("express");
const app = express();
let cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
let jsonParser = bodyParser.json;
const fs = require("fs");
let crypto = require("crypto");
const cors = require("cors");
const uid = require("uuid").v4;
const jwt = require("jsonwebtoken");


app.use(jsonParser());
app.use(cookieParser());
app.use(cors({
    origin: "*"
}));

const mysql = require("mysql");

let config = JSON.parse(fs.readFileSync(__dirname + "/config.json"));

var con = mysql.createConnection({
    host: config["db"]["host"],
    user: config["db"]["username"],
    password: config["db"]["password"],
    database: config["db"]["dbName"]
});

con.connect(function (err) {
    if (err) throw err;
    console.log("Mysql connected!");
});

function hashPass(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
}

//TODO: ez így szuboptimális, de jóvanazúgy egyelőre, majd fixeljük

const sqlQuery = async (query) => {
    return new Promise((resolved) => {
        con.query(query, (err, result) => {
            if (err) {
                throw err;
            }
            resolved(result);
        });
    })
}

const userExists = (username) => {
    return new Promise(async (resolved) => {
        let response = await sqlQuery(`SELECT username FROM users WHERE username='${username}'`);
        console.log(response);
        if (response.length > 0) {
            resolved(true)
        } else {
            resolved(false)
        }
    })
}

const createUser = (username, password) => {
    return new Promise(async (resolved) => {
        let hash = hashPass(password);
        await sqlQuery(`INSERT INTO users (username, passwordHash) VALUES ('${username}', '${hash}')`);
        let res = await sqlQuery(`SELECT id FROM users WHERE username='${username}'`)
        await sqlQuery(`INSERT INTO userconfig (userid, config) VALUES ('${res[0]["id"]}', '{}')`)
        resolved();
    })
}

const registerDevice = (deviceID, userID, deviceInfo) => {
    return new Promise(async (resolved) => {
        await sqlQuery(`INSERT INTO devices (deviceID, userID, deviceInfo) VALUES ('${deviceID}', '${userID}', '${JSON.stringify(deviceInfo)}')`);
        resolved();
    });
}

const verifyToken = (token) => {
    return new Promise(async (resolved) => {
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
        let decoded = jwt.verify(token, config["jwt"]["secret"]);
        let res = await sqlQuery(`SELECT * FROM devices WHERE deviceID = '${decoded["deviceID"]}'`);
        if (res.length == 0) {
            resolved({
                success: false,
                message: "Device not registered."
            })
        }

        resolved({
            success: true,
            data: decoded
        })
    })
}

const verifyPass = (username, password) => {
    return new Promise(async (resolved) => {
        let response = await sqlQuery(`SELECT * FROM users WHERE username='${username}'`)
        console.log(response)
        //id, username, passwordHash;
        let userInfo = response[0];    
        let hash = userInfo["passwordHash"];
        console.log(hash, hashPass(password));
        if (hash == hashPass(password)) {
            resolved(true)
        } else {
            resolved(false)
        }
    })

}

//login handler
const loginHandler = async (req = app.request, res = app.response, next = () => { }) => {
    let username = req.body.username;
    let password = req.body.password;
    if (await userExists(username) == false) {
        //user not existing
        res.status(404).json({
            success: false,
            data: {
                message: "User not found"
            }
        });
        return
    }
    let response = await sqlQuery(`SELECT id, username FROM users WHERE username='${username}'`)
    console.log(response)
    //id, username;
    let userInfo = response[0];
    let deviceName = "N/A"

    if (req.body.deviceName) {
        deviceName = req.body.deviceName;
    }
    if (await verifyPass(username, password)) {
        //password verified

        //generating a unique device ID

        let deviceID = uid();
        let deviceInfo = {
            "user-agent": req.headers["user-agent"],
            "deviceName": deviceName
        }

        //creating jwt token
        //the token will expire after 7 days
        //TODO: make the expirity modifiable by the user
        let token;
        try {
            token = jwt.sign({
                userID: userInfo["id"],
                username: userInfo["username"],
                deviceID: deviceID,
                deviceInfo: deviceInfo,
            }, config["jwt"]["secret"], { expiresIn: "7d" });

            await registerDevice(deviceID, userInfo["id"], deviceInfo);
        } catch (error) {
            res.status(500).json({
                success: false,
                data: {
                    message: "Failed to authenticate, contact system administrator to solve this issue."
                }
            });
            return;
        }

        res.status(200).json({
            success: true,
            data: {
                userInfo: userInfo,
                token: token
            }
        });
    } else {
        //bad password
        res.status(500).json({
            success: false,
            data: {
                message: "Wrong password."
            }
        });
    }
}



//register endpoint
app.post("/api/v1/auth/register", async (req, res) => {
    let username = req.body.username;
    let password = req.body.password;

    //check password length
    if (password.length < 8) {
        res.json({
            type: "error",
            message: "Password too short, minimum 8 characters required"
        })
        return;
    }

    //check if user exists in database
    if (await userExists(username)) {
        res.json({
            type: "error",
            message: "User already exists, try another name,"
        })
        return;
    }


    await createUser(username, password);

    res.json({
        type: "confirmation",
        message: "Account created succesfully"
    });
})

app.post("/api/v1/auth/login", loginHandler)

app.delete("/api/v1/auth/delete", async (req, res) => {
    let username = req.body.username;
    let password = req.body.password;
    
    if (await userExists(username) == false) {
        res.status(404).json({
            success: false,
            data: {
                message: "User not found"
            }
        });
        return;
    }

    if (await verifyPass(username, password)) {
        try {
            let response = await sqlQuery(`SELECT id FROM users WHERE username = '${username}'`);
            let userID = response[0]["id"];
            await sqlQuery(`DELETE FROM devices WHERE userID='${userID}'`);
            await sqlQuery(`DELETE FROM userconfig WHERE userID='${userID}'`);
            await sqlQuery(`DELETE FROM users WHERE id = '${userID}'`);
            res.json({
                success: true,
                data: {
                    message: "User deleted successfully."
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                data: {
                    message: "Failed to delete user"
                }
            });
        }

    } else {
        res.status(500).json({
            success: false,
            data: {
                message: "Wrong password."
            }
        });
    }
})


app.listen(config["http"]["port"], () => {
    console.log(`Listening at http://localhost:${config["http"]["port"]}`);
})