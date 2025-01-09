const { sqlQuery } = require("../../../things/db");

const uuidv4 = require("uuid").v4;

let callCb = () => {}

let init = (newCallCb = (callid, allowedIDs) => {}) => {
    callCb = newCallCb
}

let createCallHandler = async (req, res) => {
    //generate a callid, create a call "room" for it and send back the callid.


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
    const userdata = req.userdata;
    const chatid = req.body.chatid;

    if (chatid == undefined) {
        res.status(400).json({
            succes: false,
            message: "chatid not provided"
        })
        return;
    }

    //check if user is in the chat
    let result = await sqlQuery(`SELECT * FROM \`user-chat\` WHERE userID = ? AND chatid = ?`, [userdata.userID, chatid]);
    if (result.length != 1) {
        res.status(403).json({
            success: false,
            message: "You are not in this chat or group"
        })
        return;
    }

    result = await sqlQuery(`SELECT participants FROM chats WHERE id = ?`, [chatid]);
    if (result.length != 1) {
        res.status(404).json({
            succes: false,
            message: "Chat not found"
        });
        return;
    }

    let allowedIDs = JSON.parse(result[0].participants);

    const callid = uuidv4();

    callCb(callid, allowedIDs, chatid, userdata.deviceID);
    setTimeout(() => {
        res.json({
            succes: true,
            message: "Call prepared for use, now you can send the data to the socket",
            data: {
                username: userdata.username,
                callid: callid,
                chatid: chatid
                
            }
        });
    }, 500);

}

module.exports = {createCallHandler, initCallJS: init}