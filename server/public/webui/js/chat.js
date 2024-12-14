let userinfo = window.userinfo;
import { io } from "./socket.io.esm.min.js";


const socket = io(location.host);

socket.on("connect", () => {
    document.getElementById("indicator").style.backgroundColor = "green";
});

socket.on("disconnect", () => {
    document.getElementById("indicator").style.backgroundColor = "red";
});



let sendMessage = (chatID, content, type = "text") => {
    let message = {
        type,
        content
    }
    socket.emit("message", { chatID, message });
}


socket.on("error", (err) => {
    console.error("Socket:", err);
})

function createchat({ isGroupChat, chatName, participants }) {
    return new Promise((resolved, rejected) => {
        /*
        Body
        {
            isGroupChat: true/false,
            chatName: "aaa" //only required if isGroupChat = true
            participants: [] //array of userIDs
        }
        */

        fetch("/api/v1/chat/create", {
            credentials: "include",
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                isGroupChat, chatName, participants
            })
        }).then(async (res) => {
            let response = await res.json()
            console.log(response);
            if (response.success == true) {
                resolved();
            } else {
                rejected(new Error(response.message));
            }
        }).catch((err) => {
            rejected(err);
        })
    });

}

function addPrivateChat(userid) {
    let data = {
        isGroupChat: false,
        chatName: "",
        participants: [userinfo.id, userid]
    }

    console.log(data);
    createchat(data).then(() => {
        //successfully created chat
        console.log("Successfully created chat!!!!!!!!!!!");
    }).catch((err) => {
        console.error(err)
        window.alert(err)
    })
}

async function sendFile(file, type, chatid) {
    const formData = new FormData();

    // Append the file to the FormData object
    formData.append('file', file);
    formData.append("chatid", chatid);
    try {
        // Make the POST request to your server's upload endpoint
        const response = await fetch('/api/v1/chat/cdn', { // Replace with your server URL
            method: 'POST',
            credentials: "include",
            body: formData,
        });

        if (response.ok) {
            const result = await response.json();
            window.alert(`File uploaded successfully: ${result.message}`);

            sendMessage(chatid, "/api/v1/chat/cdn?filename=" + result["filename"], type);
        } else {
            window.alert(`Error uploading file: ${response.statusText}`);
        }
    } catch (error) {
        console.error('Upload failed:', error);
        window.alert(`Failed to upload file`);
    }
}


export {createchat, addPrivateChat, sendFile, sendMessage, socket}