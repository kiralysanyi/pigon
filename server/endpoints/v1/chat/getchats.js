const { sqlQuery } = require("../../../things/db");
const { verifyToken } = require("../../../things/jwt");

const { removeValue } = require("../../../things/helper");
const pageSize = 100;

let getMessagesHandler = async (req, res) => {

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
    let userdata = req.userdata;

    if (req.query.chatid == undefined) {
        res.status(400).json({
            success: false,
            message: "chatid not provided!"
        });
        return;
    }

    //check if user is in the chat
    let result = await sqlQuery(`SELECT * FROM \`user-chat\` WHERE userID = ${userdata.userID} AND chatid = ${req.query.chatid}`);
    if (result.length != 1) {
        res.status(403).json({
            success: false,
            message: "You are not allowed to access messages from this chat"
        })
        return;
    }

    let lastReadMessage = result[0]["lastReadMessage"];

    //1 page means x messages
    //If you have 3 pages (3*x messages) then page 1 will be the last x messages, page 2 will be the previous x messages, etc.
    //This API should not provide more than x messages

    let page;

    if (req.query.page == undefined) {
        page = 1;
    } else {
        page = req.query.page;
    }

    let offset = 0;
    if (page > 1) {
        offset = (pageSize * page) - pageSize;
    }

    console.log(page, offset);
    try {
        let result = await sqlQuery(`SELECT messages.id AS messageID, \`senderid\`, \`message\`, \`date\`, users.username FROM messages LEFT JOIN users ON messages.senderid = users.id WHERE cancelled = 0 AND chatid = ${req.query.chatid} ORDER BY \`date\` DESC LIMIT ${pageSize} OFFSET ${offset};`);
        if (page == 1) {
            let latestmessage = 0;
            for (let i in result) {
                if (result[i]["messageID"] > latestmessage) {
                    latestmessage = result[i]["messageID"];
                }
                if (result[i]["messageID"] > lastReadMessage) {
                    result[i]["read"] = false;
                } else {
                    result[i]["read"] = true;
                }
            };
            await sqlQuery(`UPDATE \`user-chat\` SET lastReadMessage=${latestmessage} WHERE userID=${userdata.userID} AND chatid=${req.query.chatid}`);

        }

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
        let result = await sqlQuery(`SELECT \`user-chat\`.\`lastReadMessage\` AS latestRead, chatid, name, participants, groupchat, initiator FROM \`chats\` INNER JOIN \`user-chat\` ON \`chats\`.\`id\`=\`user-chat\`.\`chatid\` WHERE \`user-chat\`.\`userID\`=${userdata.userID}`);
        for (let i in result) {

            result[i].participants = JSON.parse(result[i]["participants"]);
            let latestmessageinchat = await sqlQuery(`SELECT id FROM messages WHERE chatid=${result[i]["chatid"]} ORDER BY id DESC LIMIT 1`);
            if (latestmessageinchat.length > 0) {
                latestmessageinchat = latestmessageinchat[0]["id"];
                console.log("Latest:", latestmessageinchat);
                if (latestmessageinchat > result[i]["latestRead"]) {
                    result[i]["hasUnreadMessages"] = true;
                } else {
                    result[i]["hasUnreadMessages"] = false;
                }
            } else {
                result[i]["hasUnreadMessages"] = false;
            }

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