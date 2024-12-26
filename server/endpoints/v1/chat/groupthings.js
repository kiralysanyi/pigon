const { sqlQuery } = require("../../../things/db");
const { verifyToken } = require("../../../things/jwt");
const { removeValue } = require("../../../things/helper");

let deletegroupuserHandler = async (req, res) => {
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

    let result = await sqlQuery(`SELECT participants, initiator FROM chats WHERE id=?`, [req.body.chatid]);
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
    await sqlQuery(`UPDATE chats SET participants=? WHERE id=?`, [JSON.stringify(participants), req.body.chatid]);
    await sqlQuery(`DELETE FROM \`user-chat\` WHERE userID=? AND chatid=?`, [req.body.targetid, req.body.chatid]);
    res.json({
        success: true,
        message: "Successfully removed user from group"
    });



}

let addgroupuserHandler = async (req, res) => {
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

    let result = await sqlQuery(`SELECT participants, initiator FROM chats WHERE id=?`, [req.body.chatid]);
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
            console.log(req.body.targetids[i], "-->", req.body.chatid)
            await sqlQuery(`INSERT INTO \`user-chat\` (userID, chatid) VALUES (?,?)`, [req.body.targetids[i], req.body.chatid]);
        }
    }

    for (let i in req.body.targetids) {
        if (participants.includes(req.body.targetids[i]) == false) {
            participants.push(req.body.targetids[i]);
        }
    }
    await sqlQuery(`UPDATE chats SET participants=? WHERE id=?`, [JSON.stringify(participants), req.body.chatid]);
    res.json({
        success: true,
        message: "Successfully added user to group"
    });
}

let deleteGroupHandler = async (req, res) => {
    let userdata = req.userdata;
    let chatid = req.body.chatid;
    if (chatid == undefined) {
        res.status(400).json({
            success: false,
            message: "chatid not provided"
        });
        return;
    }

    let result = await sqlQuery(`SELECT initiator FROM chats WHERE id=?`, [chatid]);
    if (result.length != 1) {
        res.status(404).json({
            success: false,
            message: "Chat not found"
        });
        return;
    }

    if (result[0]["initiator"] != userdata.userID) {
        res.status(403).json({
            success: false,
            message: "You are not allowed to delete this chat"
        })
        return;
    }

    await sqlQuery(`DELETE FROM chats WHERE id=?`, [chatid]);
    res.json({
        success: true,
        message: "Group deleted successfully"
    });
}

let leaveGroupHandler = async (req, res) => {
    let userdata = req.userdata;
    let chatid = req.body.chatid;

    if (chatid == undefined) {
        res.status(400).json({
            success: false,
            message: "chatid not provided"
        });
        return;
    }

    let result = await sqlQuery(`SELECT initiator FROM chats WHERE id=?`, [chatid]);
    if (result.length != 1) {
        res.status(404).json({
            success: false,
            message: "Chat not found"
        });
        return;
    }

    if (result[0]["initiator"] == userdata.userID) {
        res.status(403).json({
            success: false,
            message: "You can't leave this chat because you are the owner of the group."
        })
        return;
    }

    //check if user is in the chat
    result = await sqlQuery(`SELECT * FROM \`user-chat\` WHERE userID = ? AND chatid = ?`, [userdata.userID, chatid]);
    if (result.length != 1) {
        res.status(403).json({
            success: false,
            message: "You are not in this group"
        })
        return;
    }

    //remove user from group

    await sqlQuery(`DELETE FROM \`user-chat\` WHERE userID=? AND chatid=?`, [userdata.userID, chatid]);

    result = await sqlQuery(`SELECT participants FROM chats WHERE id=?`, [chatid]);
    let participants = JSON.parse(result[0]["participants"]);
    participants = removeValue(participants, userdata.userID);
    participants = JSON.stringify(participants);
    await sqlQuery(`UPDATE chats SET participants=? WHERE id=?`, [participants, chatid])
    res.json({
        success: true,
        message: "Successfully left the chat."
    });
}

module.exports = { deletegroupuserHandler, addgroupuserHandler, deleteGroupHandler, leaveGroupHandler }