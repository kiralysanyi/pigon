const { sqlQuery } = require("../../../things/db");
const { verifyToken } = require("../../../things/jwt");
const { removeValue } = require("../../../things/helper");

let deletegroupuserHandler = async (req, res) => {
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

    if (req.body.chatid == undefined) {
        res.status(400).json({
            success: false,
            message: "chatid not provided!"
        });
        return;
    }

    if (req.body.targetid == undefined) {
        res.status(400).json({
            success: false,
            message: "targetid not provided!"
        });
        return;
    }

    let result = await sqlQuery(`SELECT participants, initiator FROM chats WHERE id=${req.body.chatid}`);
    if (result.length != 1) {
        res.status(404).json({
            success: false,
            message: "Chat not found"
        })
        return;
    }

    let participants = JSON.parse(result[0]["participants"]);

    if (result[0]["initiator"] != userdata.userID) {
        res.status(403).json({
            success: false,
            message: "You are not allowed to remove anyone from this group."
        });
        return;
    }

    if (req.body.targetid == userdata.userID) {
        res.status(403).json({
            success: false,
            message: "You can't remove yourself from the group"
        });
        return;
    }

    participants = removeValue(participants, req.body.targetid);
    await sqlQuery(`UPDATE chats SET participants='${JSON.stringify(participants)}' WHERE id=${req.body.chatid}`);
    await sqlQuery(`DELETE FROM \`user-chat\` WHERE userID=${req.body.targetid} AND chatid=${req.body.chatid}`);
    res.json({
        success: true,
        message: "Successfully removed user from group"
    });



}

let addgroupuserHandler = async (req, res) => {
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
    console.log(req.body);

    if (req.body.chatid == undefined) {
        res.status(400).json({
            success: false,
            message: "chatid not provided!"
        });
        return;
    }

    if (req.body.targetids == undefined) {
        res.status(400).json({
            success: false,
            message: "targetids not provided!"
        });
        return;
    }

    let result = await sqlQuery(`SELECT participants, initiator FROM chats WHERE id=${req.body.chatid}`);
    if (result.length != 1) {
        res.status(404).json({
            success: false,
            message: "Chat not found"
        })
        return;
    }

    let participants = JSON.parse(result[0]["participants"]);

    if (result[0]["initiator"] != userdata.userID) {
        res.status(403).json({
            success: false,
            message: "You are not allowed to add anyone to this group."
        });
        return;
    }

    for (let i in req.body.targetids) {
        if (participants.includes(req.body.targetids[i]) == false) {
            participants.push(req.body.targetids[i]);
        }
    }
    await sqlQuery(`UPDATE chats SET participants='${JSON.stringify(participants)}' WHERE id=${req.body.chatid}`);
    for (let i in req.body.targetids) {
        if (participants.includes(req.body.targetids[i]) == false) {
            await sqlQuery(`INSERT INTO \`user-chat\` (userID, chatid) VALUES ('${req.body.targetids[i]}','${req.body.chatid}')`);
        }
    }
    res.json({
        success: true,
        message: "Successfully added user to group"
    });
}

module.exports = { deletegroupuserHandler, addgroupuserHandler }