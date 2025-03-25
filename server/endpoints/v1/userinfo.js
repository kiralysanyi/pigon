const {sqlQuery} = require("../../things/db")


const userinfoHandler = async (req, res) => {
    let userdata = req.userdata;
    let loggedinuserID = userdata["userID"];
    let searchedID = req.query.userID;

    if (searchedID == undefined) {
        //no userID provided by the client so we respond with the requestor's information
        let response = await sqlQuery(`SELECT id, username, registerDate, isadmin FROM users WHERE id = ?`, [loggedinuserID]);

        res.json({
            success: true,
            data: {
                id: response[0].id,
                username: response[0].username,
                registerDate: response[0].registerDate,
                isAdmin: response[0].isadmin // Hozzáadjuk az isAdmin mezőt
            }
        });
        return;
    }

    //the user has provided a userID so we search for it and send it back to the client
    let response = await sqlQuery(`SELECT username, registerDate FROM users WHERE id = ?`, [searchedID]);

    if (response.length == 0) {
        res.json({
            success: false,
            data: {
                message: "User not found"
            }
        });
        return;
    }

    res.json({
        success: true,
        data: response[0]
    });
};


module.exports = {userinfoHandler}