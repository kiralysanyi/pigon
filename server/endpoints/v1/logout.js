const {sqlQuery} = require("../../things/db");

const logoutHandler = async (req, res) => {
    let userdata = req.userdata;

    let deviceID = userdata["deviceID"];

    try {
        await sqlQuery(`DELETE FROM devices WHERE deviceID = ?`, [deviceID]);
        res.json({
            success: true,
            data: {
                message: "Logout procedure completed successfully"
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            data: {
                message: "Failed to logout"
            }
        });
    }
}

module.exports = {logoutHandler}