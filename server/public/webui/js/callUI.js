import { Peer } from "https://esm.sh/peerjs@1.5.4?bundle-deps";
import { getDevices } from "./auth.js";
import { removeValue } from "./utils.js";
import * as auth from "./auth.js";

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

while (peers.length == 0) {
    response = await fetch("/api/v1/chat/getPeerIDs?" + new URLSearchParams({ callid: callid }).toString(), {
        method: "GET",
        credentials: "include"
    });
    peers = await response.json();
    peers = peers["data"]
}


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
    })
    mediaConnections.push(mediaConnection);
    mediaConnection.answer(audiostream);
    mediaConnection.on("close", () => {
        window.close();
    })
})

document.getElementById("closebtn").addEventListener("click", () => {
    for (let i in mediaConnections) {
        mediaConnections[i].close();
    }
    window.close();
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