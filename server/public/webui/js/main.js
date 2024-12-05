import * as auth from "./auth.js";
import { modal } from "./modal.js";
import { parseUserAgent } from "./useragent-parser.js";
import { io } from "./socket.io.esm.min.js"

/*
let isLoggedIn = await auth.checkIfLoggedIn();
if (isLoggedIn == false) {
    location.replace("/app/login.html")
}
    */

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


let userinfo = await auth.getUserInfo();
if (userinfo.success == false) {
    location.href = "/app/login.html"
}

userinfo = userinfo.data;

console.log(userinfo);

function openSidebar() {
    let container = document.getElementById("mainSidebarContainer");
    let sidebar = document.getElementById("mainSidebar");
    container.style.display = "block";
    setTimeout(() => {
        sidebar.style.left = "10px";
    }, 50);
}

function closeSidebar() {
    let container = document.getElementById("mainSidebarContainer");
    let sidebar = document.getElementById("mainSidebar");
    sidebar.style.left = "-310px";
    setTimeout(() => {
        container.style.display = "none";
    }, 550);
}

document.getElementById("mainSidebar").addEventListener("click", (e) => {
    e.stopPropagation();
    e.stopImmediatePropagation();
})

document.getElementById("mainSidebarContainer").addEventListener("click", () => {
    closeSidebar();
})

document.getElementById("openSidebarBtn").addEventListener("click", () => {
    openSidebar();
})

document.getElementById("logoutbtn").addEventListener("click", async () => {
    let data = await auth.logout();
    if (data.success == true) {
        location.replace("/app/login.html");
    }
})

document.getElementById("settingsbtn").addEventListener("click", () => {
    let settingsModal = new modal("Settings", true);
    settingsModal.contentElement.innerHTML = "<iframe src='./settings.html'></iframe>"
    settingsModal.open();
})

document.getElementById("devicesbtn").addEventListener("click", async () => {
    let devicesModal = new modal("Devices", true);
    let devices = await auth.getDevices();
    if (devices.success == false) {
        window.alert("Failed to get devices.");
        return;
    } else {
        devices = devices.data;
        for (let i in devices) {
            devices[i]["deviceInfo"] = JSON.parse(devices[i]["deviceInfo"]);
        }
    }
    console.log(devices);

    let render = () => {
        for (let i in devices) {
            let element = document.createElement("div");
            element.classList.add("devicediv");
            devicesModal.contentElement.appendChild(element);
            let parsedUserAgent = parseUserAgent(devices[i]["deviceInfo"]["user-agent"]);
            let isCurrent = devices[i]["current"];
            if (isCurrent) {
                element.classList.add("currentdev");
            }
            element.innerHTML = `<i class="fa-solid fa-laptop"></i> Name: ${devices[i]["deviceInfo"]["deviceName"]} | ${parsedUserAgent.browser}, ${parsedUserAgent.version}`
            element.addEventListener("click", async () => {
                if (devices[i]["current"] == true) {
                    return;
                }
                let confirmation = window.confirm(`Do you want to remove device: ${devices[i]["deviceInfo"]["deviceName"]} | ${parsedUserAgent.browser}, ${parsedUserAgent.version}`)
                if (confirmation == true) {
                    console.log("Removing device: " + devices[i]["deviceID"]);
                    let res = await auth.removeDevice(devices[i]["deviceID"]);
                    console.log(res);
                    if (res.success == true) {
                        element.remove();
                    }
                }

            })
        }
    }

    render();
    devicesModal.open();
});

function searchUsers(query) {
    return new Promise((resolved, rejected) => {
        fetch("/api/v1/auth/search?" + new URLSearchParams({ search: query }).toString(), {
            method: "GET",
            credentials: "include"
        }).then(async (response) => {
            let res = await response.json()
            if (res.success == false) {
                rejected(new Error(res.message))
                return;
            }
            resolved(res["data"]);
        }).catch((error) => {
            rejected(error)
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


document.getElementById("newgroupbtn").addEventListener("click", () => {
    let gruppModal = new modal("Create Group");
    gruppModal.contentElement.innerHTML = "<iframe src='mkgroup.html'></iframe>"
    gruppModal.open();
})

document.getElementById("newchatbtn").addEventListener("click", () => {
    let newModal = new modal("New chat");
    let contentElement = newModal.contentElement;

    let searchInput = document.createElement("input");
    searchInput.type = "text";
    searchInput.placeholder = "Search";
    searchInput.classList.add("search");
    contentElement.appendChild(searchInput);
    newModal.open();

    let resultsDisplay = document.createElement("div");
    resultsDisplay.classList.add("resultsDisplay");
    contentElement.appendChild(resultsDisplay);

    searchInput.addEventListener("keyup", async () => {
        let results = await searchUsers(searchInput.value);
        resultsDisplay.innerHTML = "";

        for (let i in results) {
            let resultElement = document.createElement("div");
            resultElement.classList.add("resultElement");
            resultElement.innerHTML = results[i]["username"];
            let resultImage = document.createElement("img");
            resultImage.src = "/api/v1/auth/pfp?id=" + results[i]["id"];
            resultElement.appendChild(resultImage);
            resultsDisplay.appendChild(resultElement);
            resultElement.addEventListener("click", () => {
                newModal.close();
                addPrivateChat(results[i]["id"]);
            })
        }
    })
})

let sbcontent = document.getElementById("sbcontent");

/**
 * Removes a specific value from an array.
 * @param {Array} array - The array to modify.
 * @param {*} valueToRemove - The value to remove.
 * @returns {Array} - A new array without the specified value.
 */
function removeValue(array, valueToRemove) {
    return array.filter(value => value !== valueToRemove);
}

let msgcontainer = document.getElementById("msgcontainer");
let textcontainer = document.getElementById("textcontainer");
let currentChatInfodiv = document.getElementById("currentChatInfo");
let currentPfp = document.getElementById("currentPfp");
let currentChatname = document.getElementById("currentChatname");
let selectedchat = undefined;

let renderChat = (page = 1) => {
    msgcontainer.innerHTML = "";
    fetch("/api/v1/chat/messages?chatid=" + selectedchat + "&page=" + page, {
        method: "GET",
        credentials: "include"
    }).then(async (response) => {
        let res = await response.json();
        for (let i in res) {
            let message = JSON.parse(res[i]["message"]);
            let element = document.createElement("div");
            element.classList.add("msg");
            let element_namedisplay = document.createElement("div");
            element_namedisplay.classList.add("name");
            let element_pfp = document.createElement("img");
            element_pfp.classList.add("pfp");
            let element_msg = document.createElement("div");
            element_msg.classList.add("msg_content");
            element.appendChild(element_namedisplay);
            element.appendChild(element_pfp);
            element.appendChild(element_msg);
            element_namedisplay.innerHTML = res[i]["username"];
            if (userinfo.id == res[i]["senderid"]) {
                element_namedisplay.innerHTML = "You"
            }
            element_pfp.src = "/api/v1/auth/pfp?id=" + res[i]["senderid"] + "&smol=true";
            msgcontainer.appendChild(element);
            if (message.type == "text") {
                element_msg.innerHTML = decodeHTML(message.content);
            }

            if (message.type == "image") {
                element_msg.innerHTML = `<img src="${message.content}"></img>`
            }

            if (message.type == "video") {
                element_msg.innerHTML = `<video src="${message.content}" controls loop autoplay muted></video>`
            }
        }
        msgcontainer.scrollTop = msgcontainer.scrollHeight;
        console.log(res);

    }).catch((err) => {
        console.error(err);
    })
}


let renderChatsSB = async () => {
    sbcontent.innerHTML = "";
    let chats = {};

    try {
        let response = await fetch("/api/v1/chat/chats", {
            method: "GET",
            credentials: "include"
        });

        response = await response.json();
        console.log(response);

        if (response.success == true) {
            chats = response["data"];
        } else {
            console.error(response)
            window.alert(response.message);
        }
    } catch (error) {
        console.error(error);
    }

    for (let i in chats) {
        let element = document.createElement("div");
        element.classList.add("resultElement");
        let elementPfp = document.createElement("img");
        let pfpID = removeValue(chats[i]["participants"], userinfo.id)[0];
        elementPfp.src = "/api/v1/auth/pfp?id=" + pfpID + "&smol=true";
        element.innerHTML = chats[i]["name"];
        element.appendChild(elementPfp);
        sbcontent.appendChild(element);
        element.addEventListener("click", () => {
            currentPfp.src = elementPfp.src;
            currentChatname.innerHTML = chats[i]["name"];
            currentChatInfodiv.style.display = "block";
            textcontainer.style.display = "block";
            selectedchat = chats[i]["chatid"];
            renderChat();
        })
    }

};

renderChatsSB();

function sanitizeInput(input) {
    // Replace characters that could break JSON
    return input.replace(/\\/g, '\\\\') // Escape backslashes
        .replace(/"/g, '\\"')   // Escape double quotes
        .replace(/</g, '&lt;') // Escape < to prevent HTML injection
        .replace(/>/g, '&gt;') // Escape > to prevent HTML injection
        .replace(/&/g, '&amp;') // Escape &
        .replace(/'/g, '&#39;'); // Escape single quotes
}

// Decode sanitized input for display
function decodeHTML(html) {
    const element = document.createElement('textarea');
    element.innerHTML = html;
    return element.value;
}

let addMessageToContainer = (chatID, senderID, name, message, type) => {
    if (chatID != selectedchat) {
        return;
    }

    let element = document.createElement("div");
    element.classList.add("msg");
    let element_namedisplay = document.createElement("div");
    element_namedisplay.classList.add("name");
    let element_pfp = document.createElement("img");
    element_pfp.classList.add("pfp");
    let element_msg = document.createElement("div");
    element_msg.classList.add("msg_content");
    element.appendChild(element_namedisplay);
    element.appendChild(element_pfp);
    element.appendChild(element_msg);
    element_namedisplay.innerHTML = name;
    element_pfp.src = "/api/v1/auth/pfp?id=" + senderID + "&smol=true";
    msgcontainer.appendChild(element);
    console.log(msgcontainer.scrollTop, msgcontainer.scrollHeight);
    if (msgcontainer.scrollTop > (msgcontainer.scrollHeight - 1500)) {
        msgcontainer.scrollTop = msgcontainer.scrollHeight;
    }

    if (type == "text") {
        message = sanitizeInput(message);
        element_msg.innerHTML = decodeHTML(message);
    }

    if (type == "image") {
        element_msg.innerHTML = `<img src="${message}"></img>`
    }

    if (type == "video") {
        element_msg.innerHTML = `<video src="${message}" controls loop autoplay muted></video>`
    }

}

socket.on("message", (data) => {
    //data:{"chatID":66,"senderID":17,"message":{"type":"text","content":"Sznia"}}
    data = JSON.parse(data);
    if (data["senderID"] == userinfo["id"]) {
        data["senderName"] = "You"
    }

    console.log(data);

    if (selectedchat == data["chatID"]) {
        addMessageToContainer(data["chatID"], data["senderID"], data["senderName"], data["message"]["content"], data["message"]["type"]);
    }
})

socket.on("newchat", (data) => {
    renderChatsSB();
})

let msgform = document.getElementById("messageform");
let msginput = document.getElementById("message");

msgform.addEventListener("submit", (e) => {
    e.preventDefault();
    if (msginput.value == "") {
        return;
    }
    let message = {
        type: "text",
        content: msginput.value
    }

    msgcontainer.scrollTop = msgcontainer.scrollHeight;
    msginput.value = "";

    sendMessage(selectedchat, message.content, message.type);

    console.log(message);
})

//image sending

async function sendFile(file, type) {
    const formData = new FormData();

    // Append the file to the FormData object
    formData.append('file', file);
    formData.append("chatid", selectedchat);
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
            
            sendMessage(selectedchat, "/api/v1/chat/cdn?filename=" + result["filename"], type);
        } else {
            window.alert(`Error uploading file: ${response.statusText}`);
        }
    } catch (error) {
        console.error('Upload failed:', error);
        window.alert(`Failed to upload file`);
    }
}

document.getElementById("sendimage").addEventListener("click", async () => {
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "image/jpg, image/jpeg, image/png, video/mp4, video/webm";
    fileInput.addEventListener("change", (event) => {
        let type = null;
        if (fileInput.files[0].type.includes("video")) {
            type = "video";
        }

        if (fileInput.files[0].type.includes("image")) {
            type = "image"
        }

        if (type == null) {
            console.error("Unknown filetype");
            window.alert("Unknown filetype");
            return;
        }
        
        sendFile(fileInput.files[0], type);
    });
    fileInput.click();
})