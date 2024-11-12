let element = document.createElement("img");
element.style.width = "256px";
element.style.height = "256px";
element.style.transform = "rotate(50deg) scaleX(-1)";
element.style.left = "-300px";
element.style.top = "100px";
element.style.position = "absolute";
element.style.transition = "200ms";
element.src = "/app/pigonicon.png";
element.style.display = "none";

let audioElement = document.createElement("audio")
audioElement.style.display = "none";
audioElement.src = "/app/pigon.mp3";

function pigonOverlay() {
    element.style.display = "block";

    document.body.appendChild(element);
    audioElement.play();

    setTimeout(() => {
        element.style.left = "-100px";
    }, 100);
}
