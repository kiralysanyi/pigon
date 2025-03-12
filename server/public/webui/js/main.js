import { showLoadingScreen, hideLoadingScreen } from "./loadingScreen.js";
showLoadingScreen("Loading application...");
import * as auth from "./auth.js";
import { modal } from "./modal.js";
import { parseUserAgent } from "./useragent-parser.js";
import { removeValue, sanitizeInput, decodeHTML, escapeJsonControlCharacters } from "./utils.js";
import { addPrivateChat, sendFile, sendMessage, socket } from "./chat.js";

/*
let isLoggedIn = await auth.checkIfLoggedIn();
if (isLoggedIn == false) {
    location.replace("/app/login.html")
}
    */




let userinfo = await auth.getUserInfo();
if (userinfo.success == false) {
    location.href = "/app/login.html"
}

userinfo = userinfo.data;
window.userinfo = userinfo;

console.log(userinfo);

function isLessThan700px() {
    var width = window.innerWidth;
    console.log("Das ist width", width)
    if (width < 700) {
        return true
    } else {
        return false
    }
}

window.addEventListener("resize", () => {
    console.log(isLessThan700px())
    if (isLessThan700px()) {
        closeSidebar();
    } else {
        openSidebar();
    }
})

function openSidebar() {

    let container = document.getElementById("mainSidebarContainer");
    let sidebar = document.getElementById("mainSidebar");
    container.style.display = "block";
    setTimeout(() => {
        if (isLessThan700px()) {
            sidebar.style.left = "10px";
        } else {
            sidebar.style.left = "0px";
        }

    }, 50);

}

function closeSidebar() {
    if (isLessThan700px()) {
        let container = document.getElementById("mainSidebarContainer");
        let sidebar = document.getElementById("mainSidebar");
        sidebar.style.left = "-310px";
        setTimeout(() => {
            container.style.display = "none";
        }, 550);
    }
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





document.getElementById("newgroupbtn").addEventListener("click", () => {
    let gruppModal = new modal("Create Group");
    gruppModal.contentElement.innerHTML = "<iframe src='mkgroup.html'></iframe>"
    gruppModal.open();
})

document.getElementById("adduserbtn").addEventListener("click", () => {
    let gruppModal = new modal("Add users");
    gruppModal.contentElement.innerHTML = `<iframe src='groupuseradd.html#${selectedchat}'></iframe>`
    gruppModal.open();
})

document.getElementById("newchatbtn").addEventListener("click", async () => {
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

    let allUsers = await auth.searchUsers("");
    renderUserList(allUsers, resultsDisplay, newModal);

    searchInput.addEventListener("keyup", async () => {
        let filteredResults = allUsers.filter(user => 
            user.username.toLowerCase().includes(searchInput.value.toLowerCase())
        );
        renderUserList(filteredResults, resultsDisplay, newModal);
    });
});

function renderUserList(users, resultsDisplay, newModal) {
    resultsDisplay.innerHTML = "";

    for (let user of users) {
        let resultElement = document.createElement("div");
        resultElement.classList.add("resultElement");
        resultElement.innerHTML = user.username;
        
        let resultImage = document.createElement("img");
        resultImage.src = "/api/v1/auth/pfp?id=" + user.id;
        resultElement.appendChild(resultImage);

        resultsDisplay.appendChild(resultElement);

        resultElement.addEventListener("click", () => {
            newModal.close();
            addPrivateChat(user.id);
        });
    }
}

let sbcontent = document.getElementById("sbcontent");

let msgcontainer = document.getElementById("msgcontainer");
let textcontainer = document.getElementById("textcontainer");
let currentChatInfodiv = document.getElementById("currentChatInfo");
let currentPfp = document.getElementById("currentPfp");
let currentChatname = document.getElementById("currentChatname");
let selectedchat = undefined;
let currentChatMenu = document.getElementById("currentChatMenu")

onimagepaste((file) => {
    if (selectedchat != undefined) {
        if (window.confirm("Do you want to send the image from your clipboard?")) {
            sendFile(file, "image", selectedchat);
        }
    }
});

onvideopaste((file) => {
    if (selectedchat != undefined) {
        if (window.confirm("Do you want to send the video from your clipboard?")) {
            sendFile(file, "video", selectedchat);
        }
    }
});

onmediadrop((file, type) => {
    if (selectedchat != undefined) {
        sendFile(file, type, selectedchat);
    }
})


currentChatInfodiv.addEventListener("click", () => {
    currentChatMenu.classList.remove("chatMenuClosed");
    currentChatMenu.classList.add("chatMenuOpen");
});

document.getElementById("ccm_close").addEventListener("click", () => {
    currentChatMenu.classList.remove("chatMenuOpen");
    currentChatMenu.classList.add("chatMenuClosed");
});

let renderChat = (page = 1) => {
    fetch("/api/v1/chat/messages?chatid=" + selectedchat + "&page=" + page, {
        method: "GET",
        credentials: "include"
    }).then(async (response) => {
        let res = await response.json();
        let createElement = (message, senderID, senderName, date, read, id) => {
            let element = document.createElement("div");
            element.id = `msg${id}`;
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
            element_namedisplay.innerHTML = senderName;

            if (senderID == userinfo.id) {
                contextMenu(element, ["Cancel message"], (selected) => {
                    if (selected == "Cancel message") {
                        console.log("Cancel message: ", id)
                        socket.emit("cancelmessage", {messageID: id})
                    }
                })
            }

            if (userinfo.id == senderID) {
                element_namedisplay.innerHTML = "You"
            }
            element_namedisplay.innerHTML += " at " + new Date(date).toLocaleString();
            element_pfp.src = "/api/v1/auth/pfp?id=" + senderID + "&smol=true";
            if (message.type == "text") {
                element_msg.innerHTML = decodeHTML(message.content);
            }

            if (message.type == "image") {
                element_msg.innerHTML = `<img src="${message.content}"></img>`
            }

            if (message.type == "video") {
                element_msg.innerHTML = `<video src="${message.content}" controls loop autoplay muted></video>`
            }

            if (read == false) {
                element_msg.style.backgroundColor = "blue";
                setTimeout(() => {
                    element_msg.style.backgroundColor = "rgba(0, 0, 0, 0.384)";
                }, 30 * 1000);
            }

            return element;
        }

        if (page == 1) {
            currentPage = 1;
            msgcontainer.innerHTML = "";
            for (let i = res.length - 1; i >= 0; i--) {
                let message = JSON.parse(escapeJsonControlCharacters(res[i]["message"]));
                let senderID = res[i]["senderid"];
                let senderName = res[i]["username"];
                msgcontainer.appendChild(createElement(message, senderID, senderName, res[i]["date"], res[i]["read"], res[i]["messageID"]))
            }
            setTimeout(() => {
                msgcontainer.scrollTop = msgcontainer.scrollHeight;
            }, 100);
        } else {
            console.log(currentPage);
            if (res.length == 0) {
                currentPage--;
                return;
            }
            for (let i in res) {
                let message = JSON.parse(res[i]["message"]);
                let senderID = res[i]["senderid"];
                let senderName = res[i]["username"];
                msgcontainer.prepend(createElement(message, senderID, senderName, res[i]["date"], res[i]["messageID"]))
            }
        }
        hideLoadingScreen();
        console.log(res);

    }).catch((err) => {
        console.error(err);
        hideLoadingScreen();
    })
}

let currentPage = 1;
msgcontainer.addEventListener("scroll", (e) => {
    if (msgcontainer.scrollTop == 0) {
        currentPage++;
        renderChat(currentPage);
        msgcontainer.scrollTop = 10;
    }
})


import { contextMenu } from "./contextmenu.js";
import { onimagepaste, onmediadrop, onvideopaste } from "./clipboard.js";
let chats = [];

function reorderChatsByLastInteraction() {
    chats = chats.sort((a, b) => new Date(b.lastInteraction) - new Date(a.lastInteraction));
    console.log("Sorted: ", chats);
}

let renderChatsSB = async (renderFromSaved = false) => {
    sbcontent.innerHTML = "";
    try {
        if (renderFromSaved == false) {
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
        }
    } catch (error) {
        console.error(error);
    }

    for (let i in chats) {
        let element = document.createElement("div");
        element.id = "chat" + chats[i]["chatid"];
        element.classList.add("resultElement");
        let elementPfp = document.createElement("img");
        let pfpID = removeValue(chats[i]["participants"], userinfo.id)[0];
        elementPfp.src = "/api/v1/auth/pfp?id=" + pfpID + "&smol=true";
        if (chats[i]["groupchat"] == 1) {
            elementPfp.src = "group.png"
        }

        if (chats[i]["hasUnreadMessages"] == true) {
            element.style.backgroundColor = "blue";
        }

        element.innerHTML = `<span>${chats[i]["name"]}</span>`;
        element.appendChild(elementPfp);
        sbcontent.appendChild(element);
        element.addEventListener("click", async () => {
            showLoadingScreen("Loading chat...")
            location.hash = "#" + chats[i]["chatid"]
            closeSidebar();
            element.style.backgroundColor = "rgba(255, 255, 255, 0.151)";
            document.getElementById("callbtn").style.display = "none";
            document.getElementById("adduserbtn").style.display = "none";
            document.getElementById("delgroupbtn").style.display = "none";
            document.getElementById("leavebtn").style.display = "none";
            if (chats[i]["groupchat"] == 1) {
                let ownername = (await auth.getUserInfo(chats[i]["initiator"]))["data"].username;
                document.getElementById("ownerdisplay").innerHTML = "Owner: " + ownername;
                if (chats[i]["initiator"] == userinfo.id) {
                    document.getElementById("adduserbtn").style.display = "block";
                    document.getElementById("delgroupbtn").style.display = "block";
                } else {
                    document.getElementById("leavebtn").style.display = "block";
                }
            } else {
                document.getElementById("ownerdisplay").innerHTML = "";
                document.getElementById("callbtn").style.display = "block";
            }
            document.getElementById("chatInfo_participants").innerHTML = "";
            currentPfp.src = elementPfp.src;
            currentChatname.innerHTML = chats[i]["name"];
            currentChatInfodiv.style.display = "block";
            textcontainer.style.display = "block";
            selectedchat = chats[i]["chatid"];
            window.selectedchat = selectedchat;
            document.getElementById("currentPfp_menu").src = elementPfp.src;
            document.getElementById("currentChatname_menu").innerHTML = chats[i]["name"];
            document.getElementById("chatInfo_participants").style.display = "none";
            document.getElementById("chatInfo_userinfo").style.display = "none";
            if (chats[i]["groupchat"] == 1) {
                //render groupchat participants and user add/remove things;
                document.getElementById("chatInfo_participants").style.display = "block";
                (async () => {
                    for (let x in chats[i]["participants"]) {
                        let pfpurl = "/api/v1/auth/pfp?id=" + chats[i]["participants"][x];
                        let username = (await auth.getUserInfo(chats[i]["participants"][x])).data.username;

                        let element = document.createElement("div");
                        element.classList.add("user");
                        let img = document.createElement("img")
                        img.src = pfpurl;
                        element.innerHTML += username
                        element.appendChild(img);
                        document.getElementById("chatInfo_participants").appendChild(element);
                        if (chats[i]["groupchat"] == 1) {
                            if (chats[i]["initiator"] == userinfo.id) {
                                contextMenu(element, ["Remove"], async (selected) => {
                                    if (selected == "Remove") {
                                        console.log("Remove user from group");
                                        fetch("/api/v1/chat/groupuser", {
                                            method: "DELETE",
                                            body: JSON.stringify({ chatid: chats[i]["chatid"], targetid: chats[i]["participants"][x] }),
                                            credentials: "include",
                                            headers: {
                                                "Content-Type": "application/json"
                                            }
                                        }).then(async (res) => {
                                            let response = await res.json();
                                            if (response.success == true) {
                                                await renderChatsSB();
                                                console.log("chat" + chats[i]["chatid"]);
                                                document.getElementById("chat" + chats[i]["chatid"]).click();
                                            }
                                        });
                                    }
                                })
                            }
                        }
                    }
                })()
            } else {
                //show userinfo in private chats
                document.getElementById("chatInfo_userinfo").style.display = "block";
                let userid = (removeValue(chats[i]["participants"], userinfo["id"]))[0];
                document.getElementById("chatInfo_userinfo").src = "";
                setTimeout(() => {
                    document.getElementById("chatInfo_userinfo").src = "userinfo.html#" + userid;
                }, 500);
            }

            renderChat();
        })
    }

    if (!renderFromSaved) {
        //open a chat if defined in the location.hash
        let chatToOpen = location.hash.substring(1);
        if (chatToOpen != "") {
            try {
                document.getElementById("chat" + chatToOpen).click();
            } catch (error) {
                console.error("Chat not found: ", chatToOpen)
                location.hash = "";
            }
        }
    }
    hideLoadingScreen();
};

renderChatsSB();



let addMessageToContainer = (chatID, senderID, name, message, type, messageID) => {
    if (chatID != selectedchat) {
        return;
    }

    let element = document.createElement("div");
    element.id = `msg${messageID}`
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
    element_namedisplay.innerHTML = name + " at " + new Date().toLocaleString();
    element_pfp.src = "/api/v1/auth/pfp?id=" + senderID + "&smol=true";
    msgcontainer.appendChild(element);
    console.log(msgcontainer.scrollTop, msgcontainer.scrollHeight);
    if (msgcontainer.scrollTop > (msgcontainer.scrollHeight - 1500)) {
        msgcontainer.scrollTop = msgcontainer.scrollHeight;
    }

    if (type == "text") {
        element_msg.innerHTML = decodeHTML(message);
    }

    if (type == "image") {
        element_msg.innerHTML = `<img src="${message}"></img>`
    }

    if (type == "video") {
        element_msg.innerHTML = `<video src="${message}" controls loop autoplay muted></video>`
    }

    if (senderID == userinfo.id) {
        contextMenu(element, ["Cancel message"], (selected) => {
            if (selected == "Cancel message") {
                console.log("Cancel message: ", messageID)
                socket.emit("cancelmessage", {messageID})
            }
        })
    }

}

socket.on("cancelmessage", ({chatID, messageID}) => {
    if (selectedchat == chatID) {
        try {
            document.getElementById(`msg${messageID}`).remove()
        } catch (error) {
            console.error(error)
        }
    }
})

socket.on("message", (data) => {
    try {
        if (typeof data === "string") {
            data = JSON.parse(data);
        }
        
        let arrayIndex = chats.findIndex(chat => chat.chatid === data.chatID);
        if (arrayIndex === -1) return; // Exit if chat is not found
        
        chats[arrayIndex].lastInteraction = new Date().toISOString();
        reorderChatsByLastInteraction();
        renderChatsSB(true);
        
        if (data.senderID === userinfo.id) {
            data.senderName = "You";
        }
        
        console.log(data);
        
        if (selectedchat === data.chatID) {
            addMessageToContainer(
                data.chatID,
                data.senderID,
                data.senderName,
                data.message.content,
                data.message.type,
                data.messageID
            );
            socket.emit("setLastRead", {
                chatID: data.chatID,
                messageID: data.messageID
            });
        } else {
            notifyUser(data);
        }

        // Highlight chat if it is not the selected one and the message is from another user
        let chatElement = document.getElementById("chat" + data.chatID);
        if (chatElement && selectedchat !== data.chatID && data.senderID !== userinfo.id) {
            chatElement.style.backgroundColor = "blue";
        }
    } catch (error) {
        console.error("Error processing message:", error);
    }
});

function notifyUser(data) {
    if (!document.hasFocus()) {
        let notification = new Notification(data.senderName, {
            badge: "/favicon.ico",
            icon: "/app/webui/pigonicon.png",
            body: data.message.content
        });
        notification.addEventListener("click", () => {
            let chatElement = document.getElementById("chat" + data.chatID);
            if (chatElement) {
                chatElement.click();
            }
            window.focus();
        });
    }
}


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

        sendFile(fileInput.files[0], type, selectedchat);
    });
    fileInput.click();
})


document.getElementById("delgroupbtn").addEventListener("click", () => {
    let confirmed = window.confirm("Do you really want to delete this group?");
    if (confirmed == false) {
        return;
    }

    fetch("/api/v1/chat/group",
        {
            method: "DELETE",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chatid: selectedchat })
        }).then(async (res) => {
            let response = await res.json();
            if (response.success == false) {
                window.alert(response.message);
                return;
            }

            if (response.success == true) {
                window.alert(response.message);
                location.reload();
            }
        });
})

document.getElementById("leavebtn").addEventListener("click", () => {
    let confirmed = window.confirm("Do you really want to leave this group?");
    if (confirmed == false) {
        return;
    }

    fetch("/api/v1/chat/leave", {
        method: "POST",
        credentials: "include",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ chatid: selectedchat })
    }).then(async (res) => {
        let response = await res.json();
        if (response.success == false) {
            window.alert(response.message);
            return;
        }

        if (response.success == true) {
            window.alert(response.message);
            location.reload();
        }
    })
})

