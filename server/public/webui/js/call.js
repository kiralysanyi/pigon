import { playRingtone, stopRingtone } from "./utils.js";

document.getElementById("callbtn").addEventListener("click", () => {
    //call selected user or group
    console.log("Call: ", window.selectedchat);
})

let inCall = false;

let incomingCallHandler = (callID, userName, cb = (accepted, reason) => { }) => {
    if (inCall == true) {
        cb(false, "Busy");
        return;
    }

    inCall = true;

    //render call popup

    let popup = document.createElement("div");
    popup.id = "callpopup";
    popup.classList.add("callDisplay");
    let acceptbtn = document.createElement("div");
    acceptbtn.classList.add("acceptbtn");
    let declinebtn = document.createElement("div");
    declinebtn.classList.add("declinebtn");
    popup.innerHTML = userName;
    popup.appendChild(acceptbtn);
    popup.appendChild(declinebtn);
    document.body.appendChild(popup);
    acceptbtn.innerHTML = '<i class="fa-solid fa-phone"></i>';
    declinebtn.innerHTML = '<i class="fa-solid fa-phone-slash"></i>';

    declinebtn.addEventListener("click", () => {
        stopRingtone();
        popup.remove();
        cb(false, "Declined call");
    })

    acceptbtn.addEventListener("click", () => {
        popup.remove();
        stopRingtone();
        cb(true, "Accepted call");

        inCall = true;
        let callDisplay = document.createElement("div");
        callDisplay.classList.add("call");
        document.body.appendChild(callDisplay);

        //open callUI in an iframe
        callDisplay.innerHTML = `<iframe src="/app/webui/callUI.html#${callID}"></iframe>`
        //add close function to window object
        window.callEnded = () => {
            callDisplay.remove();
            window.callEnded = undefined;
            inCall = false;
        }
    })

    playRingtone();

}

let cancelCallHanlder = () => {
    inCall = false;
    stopRingtone();
    document.getElementById("callpopup").remove();
}

let call = async (chatID, socket) => {
    let callDisplay = document.createElement("div");
    callDisplay.classList.add("call");
    document.body.appendChild(callDisplay);
    let cancelButton = document.createElement("button");
    cancelButton.classList.add("cancel");
    cancelButton.innerHTML = "Cancel";
    callDisplay.innerHTML = "Calling...";
    callDisplay.appendChild(cancelButton);
    inCall = true;
    let response = await fetch("/api/v1/chat/prepareCall", {
        method: "POST",
        credentials: "include",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ chatid: chatID })
    })

    let data = await response.json();

    console.log(data);
    if (data["success"] == false) {
        console.error(data["message"]);
        return;
    }

    //callid, username, chatid
    data = data["data"];

    socket.emit("call", data);

    cancelButton.addEventListener("click", () => {
        socket.emit("cancelcall", data)
        callDisplay.remove();
    })

    //show callui

    socket.once("callresponse" + data["callid"], (response) => {
        console.log(response)
        if (response["accepted"] == false) {
            //remove calling display and do nothing
            callDisplay.innerHTML = response["reason"];
            setTimeout(() => {
                callDisplay.remove();
            }, 2000);
            return;
        }

        //open callUI in an iframe
        inCall = true;
        callDisplay.innerHTML = `<iframe src="/app/webui/callUI.html#${data["callid"]}"></iframe>`
        //add close function to window object
        window.callEnded = () => {
            callDisplay.remove();
            window.callEnded = undefined;
            inCall = false;
        }
    })

}

export { incomingCallHandler, cancelCallHanlder, call }