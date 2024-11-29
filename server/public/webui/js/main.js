import * as auth from "./auth.js";
import { modal } from "./modal.js";
import { parseUserAgent } from "./useragent-parser.js";
import { io } from "./socket.io.esm.min.js"

const socket = io(location.host);

socket.on("message", ({ chatID, senderID, senderName, message, isGroupChat }) => {
    console.log(chatID, senderID, senderName, message, isGroupChat);
})

socket.on("error", (err) => {
    console.error("Socket:", err);
})

function createchat(isGroupChat, chatName, participants) {
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
    }).then((response) => {
        console.log(response);
    })
}

window.mkchat = createchat;

window.smsg = (message, targetID) => {
    socket.emit("message", message, targetID);
}

let userinfo = await auth.getUserInfo();
if (userinfo.success == false) {
    location.href = "/app/login.html"
}

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
        fetch("/api/v1/auth/search?" + new URLSearchParams({search: query}).toString(), {
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
        }
    })
})