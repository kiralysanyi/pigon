const { sqlQuery } = require("../../../things/db");

let uuidv4 = require("uuid").v4
const { verifyToken } = require("../../../things/jwt");

function hasDuplicateValue(array) {
    const seen = new Set();

    for (const value of array) {
        if (seen.has(value)) {
            return true;
        }
        seen.add(value);
    }

    return false; 
}

let createChatHandler = (newChatHandler = ({ isGroupChat, chatID, chatName, participants, initiator }) => { }) => {

    return async (req, res) => {
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


        /*
        Body
        {
            isGroupChat: true/false,
            chatName: "aaa" //only required if isGroupChat = true
            participants: [] //array of userIDs
        }
        */
        if (req.body.isGroupChat == undefined || req.body.participants == undefined) {
            res.status(400).json({
                success: false,
                message: "Invalid request"
            })
            return;
        }

        if (req.body.isGroupChat == true && req.body.chatName == undefined) {
            res.status(400).json({
                success: false,
                message: "Invalid request"
            })
            return;
        }

        console.log(req.body.participants.length);
        if (req.body.isGroupChat == false && req.body.participants.length > 2) {
            res.status(400).json({
                success: false,
                message: "Only 2 participants accepted for private chats!"
            })
            return;
        }

        if (hasDuplicateValue(req.body.participants)) {
            if (req.body.isGroupChat == false) {
                res.status(400).json({
                    success: false,
                    message: "You can't start a conversation with yourself."
                });
                return;
            } else {
                res.status(400).json({
                    success: false,
                    message: "Can't add same participant twice."
                });
                return;
            }
        }

        try {
            let chatname = uuidv4();
            if (req.body.isGroupChat == true) {
                chatname = req.body.chatName
            }

            //check if private chat exists with same participants
            if (req.body.isGroupChat == false) {
                let result = await sqlQuery(`SELECT 1 FROM chats WHERE \`participants\`='${JSON.stringify(req.body.participants.sort())}'`);
                if (result.length != 0) {
                    res.status(400).json({
                        success: false,
                        message: "Private chat already exists"
                    });
                    return;
                }
            }

            await sqlQuery(`INSERT INTO chats (name, participants, initiator, groupchat) VALUES ('${chatname}', '${JSON.stringify(req.body.participants.sort())}', '${userdata.userID}', '${req.body.isGroupChat}')`);
            let chatid = (await sqlQuery("SELECT LAST_INSERT_ID();"))[0]["LAST_INSERT_ID()"];


            for (let i in req.body.participants) {
                await sqlQuery(`INSERT INTO \`user-chat\` (userID, chatid) VALUES ('${req.body.participants[i]}', '${chatid}')`);
            }

            newChatHandler({ chatID: chatid, chatName: chatname, initiator: userdata.userID, isGroupChat: req.body.isGroupChat, participants: req.body.participants });
            res.json({
                success: true,
                message: "Chat created successfully"
            })
        } catch (error) {
            console.error(error);
            res.status(500).json({
                success: false,
                message: "Failed to create chat"
            })
        }
    }
}

module.exports = { createChatHandler }