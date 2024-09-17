const express = require("express")
const app = express();
let cookieParser = require("cookie-parser")
const bodyParser = require("body-parser");
let jsonParser = bodyParser.json
const fs = require("fs")
let crypto = require("crypto")
const cors = require("cors");
const uid = require("uuid").v4;

app.use(jsonParser());
app.use(cookieParser());
app.use(cors({
    origin: "*"
}))

const mysql = require("mysql");

let config = JSON.parse(fs.readFileSync(__dirname + "/config.json"))

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

const createSession = (username, password, clientInfo = {}) => {
    return new Promise(async (resolved) => {
        if (await userExists(username) == false) {
            resolved({
                info: {
                    type: "error",
                    message: "User not found"
                }
            })
            return;
        }
        let response = await sqlQuery(`SELECT * FROM users WHERE username='${username}'`)
        console.log(response)
        if (response.length == 0) {
            resolved({
                info: {
                    type: "error",
                    message: "User not found"
                }
            })
        }
        let hash = response[0]["passwordHash"];
        console.log(hash, hashPass(password));
        if (hash == hashPass(password)) {
            let sesID = uid();
            await sqlQuery(`INSERT INTO sessions (sessionID, userID, info) VALUES ('${sesID}','${response[0]["id"]}', '${JSON.stringify(clientInfo)}')`)
            resolved({
                sessionID: sesID,
                info: {
                    type: "confirmation",
                    message: "Logged in succesfully"
                }
            });
        } else {
            resolved({
                info: {
                    type: "error",
                    message: "Failed to login"
                }
            });
        }
    })
}


//register endpoint
app.post("/api/auth/register", async (req, res) => {
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

app.post("/api/auth/login", async (req, res) => {
    let username = req.body.username;
    let password = req.body.password;

    let response = await createSession(username, password, {userAgent: req.headers["user-agent"], createDate: new Date().toUTCString()});
    if (response.sessionID) {
        res.cookie("sessionID", response.sessionID, { expires: new Date(253402300000000) }).json(response.info)
        return
    }

    res.json(response.info)
})


app.listen(config["http"]["port"], () => {
    console.log(`Listening at http://localhost:${config["http"]["port"]}`);
})