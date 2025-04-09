// Ha még nincs az elemek között, akkor hozzuk létre
let element = document.createElement("img");


element.id = "pigonImg";
element.style.width = "256px";
element.style.height = "256px";
element.style.transform = "rotate(50deg) scaleX(-1)";
element.style.left = "-300px";
element.style.top = "100px";
element.style.position = "absolute";
element.style.transition = "200ms";
element.src = "/oldui/pigonicon.png";
element.style.display = "none";

document.body.appendChild(element);


if (!document.getElementById("pigonAudio")) {
    let audioElement = document.createElement("audio");
    audioElement.id = "pigonAudio";
    audioElement.style.display = "none";
    audioElement.src = "/oldui/pigon.mp3";

    document.body.appendChild(audioElement);
}

function pigonOverlay() {
    let element = document.getElementById("pigonImg");
    let audioElement = document.getElementById("pigonAudio");

    element.style.display = "block";
    audioElement.play();

    setTimeout(() => {
        element.style.left = "-100px";
    }, 100);
}
