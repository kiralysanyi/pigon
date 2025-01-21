import { Peer } from "https://esm.sh/peerjs@1.5.4?bundle-deps";
import { getDevices } from "./auth.js";
import { removeValue } from "./utils.js";
import * as auth from "./auth.js";
import { hideLoadingScreen, showLoadingScreen } from "./loadingScreen.js";
showLoadingScreen("Connecting...");

let userinfo = (await auth.getUserInfo()).data;


let devices = (await getDevices()).data;
let deviceID;
console.log(devices);
for (let i in devices) {
    if (devices[i].current == true) {
        deviceID = devices[i].deviceID
    }
}

const callid = location.hash.substring(1);


await fetch("/api/v1/chat/registerPeer", {
    method: "POST",
    credentials: "include",
    headers: {
        "Content-Type": "application/json"
    },
    body: JSON.stringify({ callid })
})



let peers;

let response = await fetch("/api/v1/chat/getPeerIDs?" + new URLSearchParams({ callid: callid }).toString(), {
    method: "GET",
    credentials: "include"
});
peers = await response.json();
const initiator = peers["data"]["initiator"]
const isInitiator = deviceID == initiator;
peers = peers["data"]["peers"];


console.log("Peers to call: ", peers);

const socket = window.parent.window.socket;

socket.on("relay", (data) => {
    console.log("Relay", JSON.stringify(data))
})

let timeout;
if (isInitiator) {
    let pingpong = () => {
        socket.emit("relay", { deviceID: peers[0], data: { type: "ping" } })
        socket.once("relay", (data) => {
            if (data.data.type == "pong") {
                if (timeout) {
                    clearTimeout(timeout)
                }

                timeout = setTimeout(() => {
                    timeout = setTimeout(() => {
                        if (window.parent.window.callEnded != undefined) {
                            window.parent.window.callEnded();
                        } else {
                            window.close();
                        }
                    }, 2000);
                    pingpong();
                }, 1000);
            }
        })
    }

    pingpong();
} else {
    socket.on("relay", (data) => {
        if (data.data.type == "ping") {
            if (timeout) {
                clearTimeout(timeout)
            }
            timeout = setTimeout(() => {
                if (window.parent.window.callEnded != undefined) {
                    window.parent.window.callEnded();
                } else {
                    window.close();
                }
            }, 2000);

            socket.emit("relay", {
                deviceID: data.senderID, data: {
                    type: "pong"
                }
            })
        }
    })
}

const configuration = {
    iceServers: [
        {
            urls: 'stun:stun.l.google.com:19302' // Google's public STUN server
        }
    ]
};

const peerConnection = new RTCPeerConnection(configuration);

peerConnection.addEventListener("connectionstatechange", (e) => {
    console.log("Connection state: ", peerConnection.connectionState)
    if (peerConnection.connectionState == "closed" || peerConnection.connectionState == "disconnected" || peerConnection.connectionState == "failed") {
        if (window.parent.window.callEnded != undefined) {
            window.parent.window.callEnded();
        } else {
            window.close();
        }
    }
})

peerConnection.addEventListener("iceconnectionstatechange", (e) => {
    console.log("Connection state: ", peerConnection.connectionState);
    if (peerConnection.connectionState == "closed" || peerConnection.connectionState == "disconnected" || peerConnection.connectionState == "failed") {
        if (window.parent.window.callEnded != undefined) {
            window.parent.window.callEnded();
        } else {
            window.close();
        }
    }
})



/**
 * Requests microphone access and returns a MediaStream.
 * @returns {Promise<MediaStream>} A promise that resolves to the MediaStream.
 * @throws {Error} If the user denies permission or an error occurs.
 */
async function getMicrophoneStream() {
    try {
        // Request microphone access
        const stream = await navigator.mediaDevices.getUserMedia({ audio: { noiseSuppression: true, echoCancellation: true } });
        console.log('Microphone access granted');
        return stream;
    } catch (error) {
        console.error('Error accessing microphone:', error);
        throw new Error('Microphone permission denied or not available');
    }
}

/**
 * Requests camera access and returns a MediaStream.
 * @returns {Promise<MediaStream>} A promise that resolves to the MediaStream.
 * @throws {Error} If the user denies permission or an error occurs.
 */
async function getCameraStream() {
    try {
        // Request camera access
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        console.log('Camera access granted');
        return stream;
    } catch (error) {
        console.error('Error accessing camera:', error);
        throw new Error('Camera permission denied or not available');
    }
}

let audiostream = await getMicrophoneStream();
const audioTrack = audiostream.getAudioTracks()[0]


peerConnection.addTrack(audioTrack);

//add event listeners

const videoPlayer = document.createElement("video");
videoPlayer.autoplay = true;
videoPlayer.muted = false;
document.getElementById("videocontainer").appendChild(videoPlayer)
document.getElementById("videocontainer").style.display = "none";


let audioPlayer = new Audio();
audioPlayer.autoplay = true;
peerConnection.addEventListener("track", (e) => {
    console.log("Incoming track: ", e)
    if (e.track.kind == "audio") {
        let stream = new MediaStream([e.track]);
        audioPlayer.srcObject = stream;
    }

    if (e.track.kind == "video") {
        document.getElementById("videocontainer").style.display = "block";
        let stream = new MediaStream([e.track])
        videoPlayer.srcObject = stream;
        e.track.addEventListener("ended", () => {
            document.getElementById("videocontainer").style.display = "none";
        })

        
    }
})


//build up connection
peerConnection.addEventListener("icecandidate", (e) => {
    socket.emit("relay", {
        deviceID: peers[0],
        data: {
            type: "candidate",
            candidate: e.candidate
        }
    })
})


peerConnection.addEventListener("negotiationneeded", async (e) => {

    let offer = await peerConnection.createOffer();
    peerConnection.setLocalDescription(offer);
    socket.emit("relay", {
        deviceID: peers[0],
        data: {
            type: "offer",
            offer: offer
        }
    })


})

socket.on("relay", (data) => {
    if (data.data.type == "candidate") {
        peerConnection.addIceCandidate(data.data.candidate)
    }
})

if (isInitiator) {
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer)
    socket.emit("relay", {
        deviceID: peers[0],
        data: {
            type: "offer",
            offer: offer
        }
    })
}

socket.on("relay", async (data) => {
    if (data.data.type == "answer") {
        await peerConnection.setRemoteDescription(data.data.answer)
    }
})


socket.on("relay", async (data) => {
    if (data.data.type == "offer") {
        await peerConnection.setRemoteDescription(data.data.offer)
        const answer = await peerConnection.createAnswer(data.data.offer);
        await peerConnection.setLocalDescription(answer)


        socket.emit("relay", {
            deviceID: data.senderID,
            data: {
                type: "answer",
                answer: answer
            }
        })
    }
})



document.getElementById("closebtn").addEventListener("click", () => {

    if (window.parent.window.callEnded != undefined) {
        window.parent.window.callEnded();
    } else {
        window.close();
    }
})

let users = await fetch("/api/v1/chat/callusers?" + new URLSearchParams({ callid: callid }).toString(), {
    method: "GET",
    credentials: "include"
})

users = (await users.json()).data;

console.log(userinfo.id);
users = removeValue(users, userinfo.id)

console.log("Users: ", users);

document.getElementById("calledUserImage").src = "/api/v1/auth/pfp?smol=true&id=" + users[0];

auth.getUserInfo(users[0]).then((response) => {
    console.log(response);
    let data = response.data;
    document.getElementById("calledUserName").innerHTML = data.username;
})

/**
 * Starts a simple timer that outputs the time elapsed in "hour:minute:second" format.
 */
function startTimer() {
    let totalSeconds = 0;

    const formatTime = (time) => (time < 10 ? `0${time}` : time);

    const timerInterval = setInterval(() => {
        totalSeconds++;

        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        const timeString = `${formatTime(hours)}:${formatTime(minutes)}:${formatTime(seconds)}`;
        document.getElementById("duration").innerHTML = timeString;
    }, 1000);

    // Return a function to stop the timer
    return () => clearInterval(timerInterval);
}

startTimer();

/**
 * Stop all tracks in a MediaStream.
 * @param {MediaStream} mediaStream - The MediaStream to stop.
 */
function stopMediaStream(mediaStream) {
    if (!mediaStream) {
        throw new Error("No MediaStream provided.");
    }

    mediaStream.getTracks().forEach((track) => track.stop());
}

let dockHideTimeout;
let mmovelistener = () => {
    document.getElementById("dock").style.bottom = "10px";
    clearTimeout(dockHideTimeout)
    dockHideTimeout = setTimeout(() => {
        document.getElementById("dock").style.bottom = "-60px";
    }, 2000);
}

let enableDockAutoHide = () => {

    document.body.addEventListener("mousemove", mmovelistener);
    document.body.addEventListener("touchstart", mmovelistener);
    dockHideTimeout = setTimeout(() => {
        document.getElementById("dock").style.bottom = "-60px";
    }, 2000);
}

let disableDockAutoHide = () => {
    clearTimeout(dockHideTimeout);
    document.body.removeEventListener("mousemove", mmovelistener);
    document.body.removeEventListener("touchstart", mmovelistener);
    document.getElementById("dock").style.bottom = "10px";

}

socket.on("relay", (payload) => {
    if (payload.data.type == "videostopped") {
        document.getElementById("videocontainer").style.display = "none";
    }
})

let videoStreaming = false;
let videoStream = null;
let videoSender;
let toggleVideo = async () => {
    if (videoStreaming == false) {
        videoStream = await getCameraStream()
        let videotrack = videoStream.getVideoTracks()[0];
        videoSender = peerConnection.addTrack(videotrack);
        videoStreaming = true;
        document.getElementById("selfView").srcObject = videoStream;
        document.getElementById("selfView").style.display = "block";
        document.getElementById("videobtn").innerHTML = '<i class="fa-solid fa-video"></i>';
        document.getElementById("screenbtn").style.display = "none";
    } else {
        videoStreaming = false;
        document.getElementById("videobtn").innerHTML = '<i class="fa-solid fa-video-slash"></i>';
        peerConnection.removeTrack(videoSender);
        socket.emit("relay", {
            deviceID: peers[0],
            data: {
                type: "videostopped"
            }
        })
        stopMediaStream(videoStream)
        document.getElementById("selfView").style.display = "none";
        document.getElementById("screenbtn").style.display = "block";
    }

}

document.getElementById("videobtn").addEventListener("click", () => {
    toggleVideo();
})

//screen sharing things

/**
 * Check if screen capture is supported.
 * @returns {boolean} - True if screen capture is supported, false otherwise.
 */
function canCaptureScreen() {
    return !!navigator.mediaDevices?.getDisplayMedia;
}

/**
 * Capture the screen and return the MediaStream.
 * @returns {Promise<MediaStream>} - A promise that resolves with the screen MediaStream.
 * @throws {Error} - If screen capture is not supported or the user denies the request.
 */
async function captureScreen() {
    if (!canCaptureScreen()) {
        throw new Error("Screen capture is not supported in this browser.");
    }

    try {
        const mediaStream = await navigator.mediaDevices.getDisplayMedia({
            video: true,
            audio: true
        });
        return mediaStream;
    } catch (error) {
        throw new Error(`Failed to capture screen: ${error.message}`);
    }
}

if (canCaptureScreen() == true) {
    document.getElementById("screenbtn").style.display = "block";
}

let toggleScreenCapture = async () => {
    if (videoStreaming == false) {
        videoStream = await captureScreen();
        let videotrack = videoStream.getVideoTracks()[0];
        videoSender = peerConnection.addTrack(videotrack);
        videoStreaming = true;

        videoStream.getVideoTracks()[0].addEventListener("ended", () => {
            if (videoStreaming == true) {
                toggleScreenCapture();
            }
        })
        document.getElementById("selfView").srcObject = videoStream;
        document.getElementById("selfView").style.display = "block";
        document.getElementById("videobtn").style.display = "none";
        document.getElementById("screenbtn").style.backgroundColor = "red";
    } else {
        document.getElementById("screenbtn").style.backgroundColor = "transparent";
        videoStreaming = false;
        peerConnection.removeTrack(videoSender);
        socket.emit("relay", {
            deviceID: peers[0],
            data: {
                type: "videostopped"
            }
        })
        stopMediaStream(videoStream)
        document.getElementById("selfView").style.display = "none";
        document.getElementById("videobtn").style.display = "block";
    }
}


document.getElementById("screenbtn").addEventListener("click", () => {
    toggleScreenCapture();
})



document.getElementById("closebtn").style.display = "block";

try {
    await navigator.wakeLock.request("screen");
} catch (err) {
    console.error(`Failed to acquire wake lock: ${err.message}`);
}


hideLoadingScreen();