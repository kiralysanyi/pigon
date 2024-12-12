const { sqlQuery } = require("../../../things/db");
const { verifyToken } = require("../../../things/jwt");

const {removeValue} = require("../../../things/helper");


let getMessagesHandler = async (req, res) => {
    if (!req.cookies.token) {
        res.status(403).json({
            success: false,
            message: "Failed to verify user"
        });
        return;
    }

    let verificationResponse = await verifyToken(req.cookies.token);
    if (verificationResponse.success == false) {
        res.status(403).json({
            success: false,
            message: "Failed to verify token"
        });
        return;
    }
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
    let userdata = verificationResponse.data;

    if (req.query.chatid == undefined) {
        res.status(400).json({
            success: false,
            message: "chatid not provided!"
        });
        return;
    }

    //1 page means 50 messages
    //If you have 3 pages (150 messages) then page 1 will be the last 50 messages, page 2 will be the previous 50 messages, etc.
    //This API should not provide more than 50 messages

    let page;

    if (req.query.page == undefined) {
        page = 1;
    } else {
        page = req.query.page;
    }

    let offset = 0;
    if (page > 1) {
        offset = 50 * page
    }

    try {
        let result = await sqlQuery(`SELECT \`senderid\`, \`message\`, \`date\`, users.username FROM messages LEFT JOIN users ON messages.senderid = users.id WHERE cancelled = 0 AND chatid = ${req.query.chatid} ORDER BY \`date\` ASC LIMIT 50 OFFSET ${offset};`);
        res.json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Database error"
        });
    }
}

let getChatsHandler = async (req, res) => {
    if (!req.cookies.token) {
        res.status(403).json({
            success: false,
            message: "Failed to verify user"
        });
        return;
    }

    let verificationResponse = await verifyToken(req.cookies.token);
    if (verificationResponse.success == false) {
        res.status(403).json({
            success: false,
            message: "Failed to verify token"
        });
        return;
    }
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
    let userdata = verificationResponse.data;

    try {
        let result = await sqlQuery(`SELECT chatid, name, participants, groupchat, initiator FROM \`chats\` INNER JOIN \`user-chat\` ON \`chats\`.\`id\`=\`user-chat\`.\`chatid\` WHERE \`user-chat\`.\`userID\`=${userdata.userID}`);

        for (let i in result) {
            result[i].participants = JSON.parse(result[i]["participants"]);
            if (result[i].groupchat == 0) {
                let id = removeValue(result[i].participants, userdata.userID)[0];
                let displayName;
                try {
                    displayName = (await sqlQuery(`SELECT username FROM users WHERE id=${id}`))[0]["username"];
                } catch (error) {
                    displayName = "Deleted user"
                }
                result[i].name = displayName;
            }

        }
        console.log(result)
        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Database error"
        });
    }



}

module.exports = { getChatsHandler, getMessagesHandler }