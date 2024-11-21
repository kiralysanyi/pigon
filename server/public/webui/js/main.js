import * as auth from "./auth.js"
import { modal } from "./modal.js";

let userinfo = await auth.getUserInfo();

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
    let settingsModal = new modal("Settings");
    settingsModal.open();
})