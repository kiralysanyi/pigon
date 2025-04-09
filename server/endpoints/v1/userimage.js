const path = require('path');

const fs = require("fs");

const sharp = require("sharp");

const extensions = [".png", ".jpeg", ".jpg"];

async function downscaleImage(inputPath, outputPath) {
    try {
        await sharp(inputPath)
            .resize(256, 256, {
                fit: "inside", // Ensures the image fits within the box without cropping
                withoutEnlargement: true, // Prevents enlarging images smaller than 256x256
            })
            .toFile(outputPath);

        console.log("Image successfully downscaled!");
    } catch (error) {
        console.error("Error downscaling image:", error);
    }
}

const imageDir = process.cwd() + "/pfp/";

if (fs.existsSync(imageDir) == false) {
    fs.mkdirSync(imageDir);
}

const getImageHandler = (req, res) => {
    for (let i in extensions) {
        let ext = extensions[i];
        let filePath = imageDir + req.query.id + ext;
        if (fs.existsSync(filePath)) {
            if (req.query.smol == "true") {
                //logic here to send a downscaled/limited resolution image
                let filepath = imageDir + "smol" + req.query.id + ext;
                 console.log(filepath)
                if (fs.existsSync(filepath)) {
                    //do something and return
                    res.sendFile(filepath);
                    return;
                }
            }

            res.sendFile(filePath);
            return;
        }
    }

    res.sendFile(__dirname + "/assets/pfp.jpg");
}

const uploadHandler = async (req, res) => {
    let userdata = req.userdata;
    if (!req.files) {
        res.status(400).json({
            success: false,
            message: "Image not provided"
        });
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
    let userID = userdata.userID;
    console.log(userID, file.name, file.mimetype);

    if (file.mimetype != "image/png" && file.mimetype != "image/jpg" && file.mimetype != "image/jpeg" && file.mimetype != "image/*") {
        res.status(400).json({
            success: false,
            message: "Only png, jpg accepted"
        })
        return;
    }
    let fileExtension = path.extname(file.name)
    console.log(fileExtension);
    if (fileExtension == ".jfif") {
        fileExtension = ".jpeg"
    }

    //check for old pfp and delete it

    for (let i in extensions) {
        let ext = extensions[i];
        let filePath = imageDir + userID + ext;
        if (fs.existsSync(filePath)) {
            fs.rmSync(filePath);
            console.log("DEL:",filePath);
        }


        filePath = imageDir + "smol" + userID + ext;
        if (fs.existsSync(filePath)) {
            fs.rmSync(filePath);
            console.log("DEL:",filePath);

        }

    }

    await file.mv(imageDir + userID + fileExtension);
    await downscaleImage(imageDir + userID + fileExtension, imageDir + "smol" + userID + fileExtension)

    res.json({
        success: true,
        message: "Uploaded successfully!"
    })
}

/**
 * 
 * @param {*} userID ID of the user
 */
let deletePFP = (userID) => {
    for (let i in extensions) {
        let ext = extensions[i];
        let filePath = imageDir + userID + ext;
        if (fs.existsSync(filePath)) {
            fs.rmSync(filePath);
            console.log("DEL:",filePath);
        }


        filePath = imageDir + "smol" + userID + ext;
        if (fs.existsSync(filePath)) {
            fs.rmSync(filePath);
            console.log("DEL:",filePath);

        }

    }
}

module.exports = { getImageHandler, uploadHandler, deletePFP }