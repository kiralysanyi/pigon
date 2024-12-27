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


// TODO: host our own peerjs server and add it's config here
const peer = new Peer(deviceID, { 'iceServers': [{ 'urls': 'stun:stun.l.google.com:19302' }], 'sdpSemantics': 'unified-plan' });
const vpeer = new Peer("video" + deviceID, { 'iceServers': [{ 'urls': 'stun:stun.l.google.com:19302' }], 'sdpSemantics': 'unified-plan' });
const speer = new Peer("screen" + deviceID, { 'iceServers': [{ 'urls': 'stun:stun.l.google.com:19302' }], 'sdpSemantics': 'unified-plan' });


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
peers = peers["data"]

console.log("Peers to call: ", peers);

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

let mediaConnections = [];

for (let i in peers) {
    let mediaConnection = peer.call(peers[i], audiostream);
    mediaConnections.push(mediaConnection);
    mediaConnection.on("stream", (stream) => {
        console.log("Got stream: ", stream)
        let audioelement = new Audio();
        audioelement.srcObject = stream;
        audioelement.play();
    })
}

peer.on("call", (mediaConnection) => {
    mediaConnection.on("stream", (stream) => {
        console.log("Got stream: ", stream)
        let audioelement = new Audio();
        audioelement.srcObject = stream;
        audioelement.play();
        hideLoadingScreen();
    })
    mediaConnections.push(mediaConnection);
    mediaConnection.answer(audiostream);
    mediaConnection.on("close", () => {
        if (window.parent.window.callEnded != undefined) {
            window.parent.window.callEnded();
        } else {
            window.close();
        }
    })
})

document.getElementById("closebtn").addEventListener("click", () => {
    for (let i in mediaConnections) {
        mediaConnections[i].close();
    }
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

//video streaming things

//handle incoming video stream
let videoStreamCount = 0;

vpeer.on("call", (mediaConnection) => {
    mediaConnection.on("stream", (stream) => {
        videoStreamCount++;
        let videoElement = document.createElement("video");
        videoElement.muted = true;
        videoElement.autoplay = true;
        videoElement.srcObject = stream;
        document.getElementById("videocontainer").appendChild(videoElement);
        document.getElementById("videocontainer").style.display = "block";

        mediaConnection.on("close", () => {
            videoStreamCount--;
            videoElement.remove();
            if (videoStreamCount == 0) {
                document.getElementById("videocontainer").style.display = "none";
            }
        })
    })

    mediaConnection.answer(new MediaStream())
})

/**
 * Returns a function to stop the video streaming
 */
let startVideoStream = async () => {
    let selfView = document.createElement("video");
    selfView.classList.add("selfView");
    selfView.autoplay = true;
    selfView.muted = true;
    let stream = await getCameraStream();
    selfView.srcObject = stream;
    document.body.appendChild(selfView);
    let connections = [];
    for (let i in peers) {
        let mediaConnection = vpeer.call("video" + peers[i], stream);
        connections.push(mediaConnection);
    }

    return () => {
        for (let i in connections) {
            connections[i].close();
            stopMediaStream(stream);
            selfView.remove();

        }
    }
}


let stopVideoStream = null;
let toggleVideo = async () => {
    if (stopVideoStream == null) {
        document.getElementById("screenbtn").style.display = "none";
        document.getElementById("videobtn").innerHTML = '<i class="fa-solid fa-video"></i>';
        stopVideoStream = await startVideoStream();
        return;
    }

    stopVideoStream();
    document.getElementById("screenbtn").style.display = "block";
    document.getElementById("videobtn").innerHTML = '<i class="fa-solid fa-video-slash"></i>';
    stopVideoStream = null;
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


//handle incoming video stream
let svideoStreamCount = 0;

speer.on("call", (mediaConnection) => {
    mediaConnection.on("stream", (stream) => {
        svideoStreamCount++;
        let videoElement = document.createElement("video");
        videoElement.muted = false;
        videoElement.autoplay = true;
        videoElement.srcObject = stream;
        document.getElementById("videocontainer").appendChild(videoElement);
        document.getElementById("videocontainer").style.display = "block";

        mediaConnection.on("close", () => {
            svideoStreamCount--;
            videoElement.remove();
            if (svideoStreamCount == 0) {
                document.getElementById("videocontainer").style.display = "none";
            }
        })
    })

    mediaConnection.answer(new MediaStream())
})

/**
 * Returns a function to stop the video streaming
 */
let startsVideoStream = async (streamendCallback = () => {}) => {
    let selfView = document.createElement("video");
    selfView.classList.add("selfView");
    selfView.autoplay = true;
    selfView.muted = true;
    let stream = await captureScreen();

    selfView.srcObject = stream;
    document.body.appendChild(selfView);

    let connections = [];
    for (let i in peers) {
        let mediaConnection = speer.call("video" + peers[i], stream);
        connections.push(mediaConnection);
    }

    let stopFunction = () => {
        for (let i in connections) {
            connections[i].close();
            stopMediaStream(stream);
            selfView.remove();
        }
    }

    let track = stream.getTracks()[0];
    track.onended = () => {
      streamendCallback();
    }

    return stopFunction;
}


let stopsVideoStream = null;
let togglesVideo = async () => {

    let disSvideo = () => {
        stopsVideoStream();
        document.getElementById("videobtn").style.display = "block";
        document.getElementById("screenbtn").style.backgroundColor = "transparent";
        stopsVideoStream = null;
    }


    if (stopsVideoStream == null) {
        document.getElementById("videobtn").style.display = "none";
        document.getElementById("screenbtn").style.backgroundColor = "red";
        stopsVideoStream = await startsVideoStream(() => {
            disSvideo();
        });
        return;
    }

    disSvideo();
}

document.getElementById("screenbtn").addEventListener("click", () => {
    togglesVideo();
})



document.getElementById("closebtn").style.display = "block";

try {
    await navigator.wakeLock.request("screen");
} catch (err) {
    console.error(`Failed to acquire wake lock: ${err.message}`);
}