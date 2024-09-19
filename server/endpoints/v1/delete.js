const {sqlQuery, userExists, verifyPass} = require("../../things/db");


const deleteHandler = async (req, res) => {
    let username = req.body.username;
    let password = req.body.password;

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
            await sqlQuery(`DELETE FROM users WHERE id = '${userID}'`);
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