const { sqlQuery } = require("../../../things/db");

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
    let result = await sqlQuery(`SELECT * FROM \`user-chat\` WHERE userID = ? AND chatid = ?`, [userdata.userID, req.query.chatid]);
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
        let result = await sqlQuery(`SELECT messages.id AS messageID, \`senderid\`, \`message\`, \`date\`, users.username FROM messages LEFT JOIN users ON messages.senderid = users.id WHERE cancelled = 0 AND chatid = ? ORDER BY \`date\` DESC LIMIT ? OFFSET ?;`, [req.query.chatid, pageSize, offset]);
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
            await sqlQuery(`UPDATE \`user-chat\` SET lastReadMessage=? WHERE userID=? AND chatid=?`, [latestmessage, userdata.userID, req.query.chatid]);

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
    let userdata = req.userdata;

    try {
        let result = await sqlQuery(`SELECT \`user-chat\`.\`lastReadMessage\` AS latestRead, chatid, name, participants, groupchat, initiator, lastInteraction FROM \`chats\` INNER JOIN \`user-chat\` ON \`chats\`.\`id\`=\`user-chat\`.\`chatid\` WHERE \`user-chat\`.\`userID\`=? ORDER BY lastInteraction DESC`, [userdata.userID]);
        for (let i in result) {

            result[i].participants = JSON.parse(result[i]["participants"]);
            let latestmessageinchat = await sqlQuery(`SELECT id FROM messages WHERE chatid=? ORDER BY id DESC LIMIT 1`, [result[i]["chatid"]]);
            if (latestmessageinchat.length > 0) {
                latestmessageinchat = latestmessageinchat[0]["id"];
                
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
                    displayName = (await sqlQuery(`SELECT username FROM users WHERE id=?`, [id]))[0]["username"];
                } catch (error) {
                    displayName = "Deleted user"
                }
                result[i].name = displayName;
            }

        }
        
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