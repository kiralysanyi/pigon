const { sqlQuery } = require("../things/db")
const { authMiddleWare } = require("../things/auth_middleware")

// Middleware to check if the user is an admin
async function isAdminMiddleware(req, res, next) {
    if (req.userdata.isAdmin == true) {
        next();
    } else {
        res.status(403).json({ success: false, message: "Access denied" })
    }
}

const adminpanel = (app) => {
    app.use("/adminpanel", authMiddleWare)
    app.use("/adminpanel", isAdminMiddleware)

    // Get all users
    app.get('/adminpanel/users', async (req, res) => {
        try {
            const users = await sqlQuery('SELECT id, username, isadmin, registerDate FROM users', []);
            res.json({ success: true, message: 'Users retrieved successfully.', data: users });
        } catch (error) {
            console.error('Error fetching users:', error);
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    });

    // Get all chats
    app.get('/adminpanel/chats', async (req, res) => {
        try {
            const chats = await sqlQuery('SELECT * FROM chats', []);
            res.json({ success: true, message: 'Chats retrieved successfully.', data: chats });
        } catch (error) {
            console.error('Error fetching chats:', error);
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    });

    // Get all messages for a specific chat
    app.get('/adminpanel/chats/:chatId/messages', async (req, res) => {
        const { chatId } = req.params;
        try {
            const messages = await sqlQuery('SELECT * FROM messages WHERE chatid = ?', [chatId]);
            res.json({ success: true, message: 'Messages retrieved successfully.', data: messages });
        } catch (error) {
            console.error('Error fetching messages:', error);
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    });

    // Add a user to a chat
    app.post('/adminpanel/chats/:chatId/users', async (req, res) => {
        const { chatId } = req.params;
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({ success: false, message: 'User ID is required' });
        }

        try {
            await sqlQuery('INSERT INTO `user-chat` (userID, chatid) VALUES (?, ?)', [userId, chatId]);
            res.json({ success: true, message: 'User added to chat successfully.' });
        } catch (error) {
            console.error('Error adding user to chat:', error);
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    });

    // Get usernames for a specific chat
    app.get('/adminpanel/chats/:chatId/usernames', async (req, res) => {
        const { chatId } = req.params;
        try {
            const chat = await sqlQuery('SELECT participants FROM chats WHERE id = ?', [chatId]);
            if (chat.length === 0) {
                return res.status(404).json({ success: false, message: 'Chat not found' });
            }

            const participantIds = JSON.parse(chat[0].participants);
            if (!Array.isArray(participantIds)) {
                return res.status(500).json({ success: false, message: 'Invalid participants data format' });
            }

            const placeholders = participantIds.map(() => '?').join(',');
            const users = await sqlQuery(`SELECT id, username FROM users WHERE id IN (${placeholders})`, participantIds);

            res.json({ success: true, message: 'Usernames retrieved successfully.', data: users });
        } catch (error) {
            console.error('Error fetching usernames:', error);
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    });

    // Delete a chat
    app.delete('/adminpanel/chats/:chatId', async (req, res) => {
        const { chatId } = req.params;

        try {
            await sqlQuery('DELETE FROM chats WHERE id = ?', [chatId]);
            res.json({ success: true, message: 'Chat deleted successfully.' });
        } catch (error) {
            console.error('Error deleting chat:', error);
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    });

    // Delete a message
    app.delete('/adminpanel/messages/:messageId', async (req, res) => {
        const { messageId } = req.params;

        try {
            await sqlQuery('DELETE FROM messages WHERE id = ?', [messageId]);
            res.json({ success: true, message: 'Message deleted successfully.' });
        } catch (error) {
            console.error('Error deleting message:', error);
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    });
}

module.exports = { adminpanel }