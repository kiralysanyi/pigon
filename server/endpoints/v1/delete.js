const {sqlQuery, userExists, verifyPass} = require("../../things/db");
const deletePFP = require("./userimage").deletePFP;

/**
 * Removes a specific value from an array.
 * @param {Array} array - The array to modify.
 * @param {*} valueToRemove - The value to remove.
 * @returns {Array} - A new array without the specified value.
 */
function removeValue(array, valueToRemove) {
    return array.filter(value => value !== valueToRemove);
}

const deleteHandler = async (req, res) => {
    let username = req.body.username;
    let password = req.body.password;
    console.log("Delete: ",req.body);

    if (await userExists(username) == false) {
        res.status(404).json({
            success: false,
            data: {
                message: "User not found"
            }
        });
        return;
    }

    if (await verifyPass(username, password)) {
        try {
            let response = await sqlQuery(`SELECT id FROM users WHERE username = '${username}'`);
            let userID = response[0]["id"];

            //remove from chats
            let chats = await sqlQuery(`SELECT id, participants FROM chats INNER JOIN \`user-chat\` ON chats.id = \`user-chat\`.\`chatid\` WHERE \`user-chat\`.\`userID\`=${userID}`);
            console.log(chats);
            for (let i in chats) {
                chats[i]["participants"] = removeValue(JSON.parse(chats[i]["participants"]), userID)
            }

            for (let i in chats) {
                await sqlQuery(`UPDATE chats SET participants='${JSON.stringify(chats[i]["participants"])}' WHERE id=${chats[i]["id"]}`)
            }

            //delete chat connections
            await sqlQuery(`DELETE FROM \`user-chat\` WHERE userID=${userID}`);


            await sqlQuery(`DELETE FROM users WHERE id = '${userID}'`);
            deletePFP(userID);

            res.json({
                success: true,
                data: {
                    message: "User deleted successfully."
                }
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                data: {
                    message: "Failed to delete user"
                }
            });
        }

    } else {
        res.status(500).json({
            success: false,
            data: {
                message: "Wrong password."
            }
        });
    }
}

module.exports = {deleteHandler}