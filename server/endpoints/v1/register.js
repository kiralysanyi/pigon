const {createUser, userExists} = require("../../things/db")
const {validateUsername} = require("../../things/usernameRegex");

const registerHandler = async (req, res) => {
    let username = req.body.username;
    let password = req.body.password;


    if(validateUsername(username) == false) {
        res.status(200).json({
            success: false,
            data: {
                message: "Username can not contain special characters and whitespaces."

            }
        })
        return;
    }

    //check password length
    if (password.length < 8) {
        res.status(200).json({
            success: false,
            data: {
                message: "Password too short, minimum 8 characters required"

            }
        })
        return;
    }

    //check if user exists in database
    if (await userExists(username)) {
        res.status(200).json({
            success: false,
            data: {
                message: "User already exists"

            }
        })
        return;
    }


    await createUser(username, password);

    res.json({
        success: true,
        data: {
            message: "Account created"

        }
    })
}

module.exports = {registerHandler}