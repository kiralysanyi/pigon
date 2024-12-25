const { sqlQuery, rowExists } = require("../../things/db")

let getExtraInfoHandler = async (req, res) => {
    let targetID = req.query.userID;
    if (targetID == undefined || targetID == "") {
        res.status(400).json({
            success: false,
            message: "No userID provided."
        })
        return;
    }
    console.log(targetID);
    if (await rowExists("userID", targetID, "userinfo_extra", true) == false) {
        res.status(404).json({
            success: false,
            message: "This user did not provide extra info yet."
        })
        return;
    }

    let data = await sqlQuery(`SELECT * FROM \`userinfo_extra\` WHERE userID=${targetID}`);
    data = data[0];
    res.json({
        success: true,
        data: data
    });
}

let postExtraInfoHandler = async (req, res) => {
    let userdata = req.userdata;

    let data = req.body.data;
    if (data == undefined) {
        res.status(400).json({
            success: false,
            message: "No data provided."
        })

        return;
    }

    if (data.fullname == undefined) {
        res.status(400).json({
            success: false,
            message: "fullname not provided in data field"
        });
        return;
    }

    if (data.bio == undefined) {
        res.status(400).json({
            success: false,
            message: "bio not provided in data field"
        });
        return;
    }

    let query;
    if (await rowExists("userID", userdata.userID, "userinfo_extra", true) == true) {
        //update query
        query = `UPDATE \`userinfo_extra\` SET fullname = '${data.fullname}', bio = '${data.bio}' WHERE userID = ${userdata.userID}`
    } else {
        //insert query
        query = `INSERT INTO \`userinfo_extra\` (fullname, bio) VALUES ('${data.fullname}', '${data.bio}')`;
    }

    try {
        await sqlQuery(query);
        res.json({
            success: true,
            message: "Successfuly updated information"
        });
    } catch (error) {
        console.error(error)
        res.status(500).json({
            success: false,
            message: "Failed to update information"
        });
    }
}

module.exports = {getExtraInfoHandler, postExtraInfoHandler}