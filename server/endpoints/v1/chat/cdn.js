const {sqlQuery, checkIfUserInChat} = require("../../../things/db");
const uuidv4 = require("uuid").v4;
const { verifyToken } = require("../../../things/jwt");
const path = require("path");
const fs = require("fs");

const uploaddir = process.cwd() + "/chatfiles/";

if (fs.existsSync(uploaddir) == false) {
    fs.mkdirSync(uploaddir);
}

const cdnPostHandler = async (req, res) => {
    let userdata = req.userdata;

    if (req.body.chatid == undefined) {
        res.status(400).json({
            success:false,
            message: "No chatid provided"
        });
        return;
    }

    if (await checkIfUserInChat(req.body.chatid, userdata.userID) == false) {
        res.status(503).json({
            success: false,
            message: "You are not allowed to add content to this chat!"
        });

        return;
    }

    if (req.files.file == undefined) {
        res.status(400).json({
            success: false,
            message: "No file to upload!"
        });
        return;
    }

    let file = req.files.file;
    let fileExtension = path.extname(file.name)
    let filename = uuidv4() + fileExtension;

    await sqlQuery(`INSERT INTO files (chatid, filename) VALUES (?,?)`, [req.body.chatid, filename]);

    await file.mv(uploaddir + filename);
    res.json({
        success: true,
        message: "Uploaded file successfully",
        filename: filename
    });
    

}

const cdnGetHandler = async (req, res) => {
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

    if (req.query.filename == undefined) {
        res.status(400).json({
            success:false,
            message: "No filename provided"
        });
        return;
    }

    let result = await sqlQuery(`SELECT chatid, filename FROM files WHERE filename=?`, [req.query.filename])
    if (result.length != 1) {
        res.status(404).json({
            success: false,
            message: "Not found"
        });

        return;
    }

    result = result[0];

    if (await checkIfUserInChat(result["chatid"], userdata.userID) == false) {
        res.status(503).json({
            success: false,
            message: "You are not allowed to retrieve content from this chat!"
        });

        return;
    }

    try {
        res.sendFile(uploaddir + result["filename"]);
    } catch (error) {
        res.status(404).send();
    }
}

module.exports = {cdnPostHandler, cdnGetHandler}