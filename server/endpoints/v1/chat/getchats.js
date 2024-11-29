const { sqlQuery } = require("../../../things/db");
const { verifyToken } = require("../../../things/jwt");

/**
 * Removes a specific value from an array.
 * @param {Array} array - The array to modify.
 * @param {*} valueToRemove - The value to remove.
 * @returns {Array} - A new array without the specified value.
 */
function removeValue(array, valueToRemove) {
    return array.filter(value => value !== valueToRemove);
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
        let result = await sqlQuery(`SELECT chatid, name, participants, groupchat, initiator FROM \`chats\` INNER JOIN \`user-chat\` ON \`chats\`.\`id\`=\`user-chat\`.\`chatid\` WHERE \`user-chat\`.\`userID\`=${userdata.userID}`);

        for (let i in result) {
            result[i].participants = JSON.parse(result[i]["participants"]);
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

module.exports = { getChatsHandler }