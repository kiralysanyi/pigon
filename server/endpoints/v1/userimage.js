const { sqlQuery } = require("../../things/db");
const { verifyToken } = require("../../things/jwt")
const path = require('path');

const fs = require("fs");

const imageDir = process.cwd() + "/pfp/";

if (fs.existsSync(imageDir) == false) {
    fs.mkdirSync(imageDir);
}

const getImageHandler = (req, res) => {
    if (!req.body.id) {
        res.status(400).json({
            success: false,
            message: "No id provided."
        });
        return;
    }

    if (fs.existsSync(imageDir + req.body.id + ".png")) {
        res.sendFile(imageDir + req.body.id + ".png");
        return;
    }

    if (fs.existsSync(imageDir + req.body.id + ".jpg")) {
        res.sendFile(imageDir + req.body.id + ".jpg");
        return;
    }

    res.sendFile(__dirname + "/assets/pfp.jpg");
}

const uploadHandler = async (req, res) => {
    if (!req.cookies.token) {
        res.status(400).json({
            success: false,
            message: "No token provided."
        });
        return;
    }
    let verifyResult = await verifyToken(req.cookies.token);
    if (verifyResult.success == false) {
        res.status(400).json(verifyResult);
        return;
    }

    if (!req.files.image) {
        res.status(400).json({
            success: false,
            message: "Image not provided"
        });
        return;
    }

    let file = req.files.image;
    let userID = verifyResult.data.userID;
    console.log(userID, file.name, file.mimetype);

    if (file.mimetype != "image/png" && file.mimetype != "image/jpg" && file.mimetype != "image/jpeg") {
        res.status(400).json({
            success: false,
            message: "Only png, jpg accepted"
        })
        return;
    }
    let fileExtension = path.extname(file.name)
    console.log(fileExtension);

    //check for old pfp and delete it

    if (fs.existsSync(imageDir + userID + ".png")) {
        fs.rmSync(imageDir + userID + ".png");
    }

    if (fs.existsSync(imageDir + userID + ".jpg")) {
        fs.rmSync(imageDir + userID + ".jpg");
    }

    if (fs.existsSync(imageDir + userID + ".jpeg")) {
        fs.rmSync(imageDir + userID + ".jpeg");
    }

    file.mv(imageDir + userID + fileExtension);

    res.json({
        success: true,
        message: "Uploaded successfully!"
    })
}

module.exports = { getImageHandler, uploadHandler }