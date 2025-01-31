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
    setTimeout(() => {
        loadingScreen.style.opacity = 1;
    }, 20);
    messageDisplay.innerHTML = message;
}

let hideLoadingScreen = () => {
    loadingScreen.style.opacity = 0;
    setTimeout(() => {
        loadingScreen.style.display = "none";
    }, 300);
    
}

export {showLoadingScreen, hideLoadingScreen}