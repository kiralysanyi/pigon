let loadingScreen = document.createElement("div");
let loadingScreenContent = document.createElement("div");
loadingScreen.classList.add("loadingScreen");
loadingScreenContent.classList.add("content");
let spinner = document.createElement("div");
spinner.classList.add("spinner");
loadingScreen.style.display = "none";

loadingScreen.appendChild(loadingScreenContent);
loadingScreenContent.appendChild(spinner);
let messageDisplay = document.createElement("span");
loadingScreenContent.appendChild(messageDisplay)
document.body.appendChild(loadingScreen)

let showLoadingScreen = (message) => {
    loadingScreen.style.display = "block";
    messageDisplay.innerHTML = message;
}

let hideLoadingScreen = () => {
    loadingScreen.style.display = "none";
}

export {showLoadingScreen, hideLoadingScreen}