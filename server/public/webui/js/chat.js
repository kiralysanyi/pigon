import { io } from "./socket.io.esm.min.js";
import * as call from "./call.js";
import { getUserInfo } from "./auth.js";

let userinfo = (await getUserInfo()).data;


const socket = io(location.host, {
    path: "/socketio"
});

document.getElementById("callbtn").addEventListener("click", () => {
    call.call(window.selectedchat, socket)
})

socket.on("connect", () => {
    console.log("Connected to socket.io host");
});

socket.on("disconnect", () => {
    console.log("Disconnected from socket.io host");
});

socket.on("incomingcall", ({callid, username, chatid}) => {
    socket.once("cancelledcall", (data) => {
        if (data.callid == callid) {
            call.cancelCallHanlder();      
        }
    })
    call.incomingCallHandler(callid, username, (accepted, reason) => {
        //send back response from popup, if true, the other peer should start opening the callui with the provided callid, if false the other peer should show a message about the declined call
        socket.emit("response" + callid, {accepted, reason});
    });
})

socket.on("acceptedcall", () => {
    call.cancelCallHanlder();
})



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
    console.log(userinfo);
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