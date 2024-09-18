const mysql = require("mysql");
const hashPass = require("./password").hashPass;
const fs = require("fs");

let config = JSON.parse(fs.readFileSync(__dirname + "/../config.json"));

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


const verifyPass = (username, password) => {
    return new Promise(async (resolved) => {
        let response = await sqlQuery(`SELECT passwordHash FROM users WHERE username='${username}'`)
        console.log(response)
        //passwordHash
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

module.exports = {registerDevice, createUser, userExists, sqlQuery, verifyPass}