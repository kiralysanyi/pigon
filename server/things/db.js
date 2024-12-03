const mysql = require("mysql2");
const hashPass = require("./password").hashPass;
const fs = require("fs");

// Create the connection pool. The pool-specific settings are the defaults
const pool = mysql.createPool({
    host: process.env.DBHOST,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DBNAME,
    waitForConnections: true,
    connectionLimit: 10,
    maxIdle: 10, // max idle connections, the default value is the same as `connectionLimit`
    idleTimeout: 60000, // idle connections timeout, in milliseconds, the default value 60000
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
});


//TODO: ez így szuboptimális, de jóvanazúgy egyelőre, majd fixeljük

const sqlQuery = async (query) => {
    return new Promise((resolved, reject) => {
        pool.query(query, (err, result) => {
            if (err) {
                reject(err);
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
        await sqlQuery(`INSERT INTO userconfig (userid) VALUES ('${res[0]["id"]}')`)
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

const updatePass = (username, userID, oldpass, newpass) => {
    return new Promise(async (resolved) => {
        if (newpass.length < 8) {
            resolved({
                success: false,
                data: {
                    message: "New password too short, minimum 8 characters required"
                }
            });
            return;
        }
        if (await userExists(username) == false) {
            resolved({
                success: false,
                data: {
                    message: "User not found"
                }
            });
            return;
        }

        if (await verifyPass(username, oldpass) == false) {
            resolved({
                success: false,
                data: {
                    message: "Wrong password."
                }
            })
            return;
        }

        try {
            let passHash = hashPass(newpass);
            await sqlQuery(`UPDATE users SET passwordHash = '${passHash}' WHERE id = '${userID}'`);
            await sqlQuery(`DELETE FROM devices WHERE userID = '${userID}'`);
            resolved({
                success: true,
                data: {
                    message: "Password updated successfully"
                }
            });
            return;
        } catch (error) {
            console.log(error);
            resolved({
                success: false,
                data: {
                    message: "Failed to update password."
                }
            });
        }
    });
}

let getUserFromID = (userID) => {
    return new Promise(async (resolved) => {
        const query = `SELECT id, username, registerDate FROM users WHERE id=${userID}`;
        let data = await sqlQuery(query);
        if (data.length != 1) {
            resolved(new Error("User not found"));
            return;
        }

        resolved(data[0]);
    });
}

const checkIfUserInChat = async (chatid, userid) => {
    let result = await sqlQuery(`SELECT 1 FROM \`user-chat\` WHERE userID=${userid} AND chatid=${chatid}`);

    if (result.length == 1) {
        return true;
    } else {
        return false;
    }
}

module.exports = { checkIfUserInChat, registerDevice, createUser, userExists, sqlQuery, verifyPass, updatePass, getUserFromID }