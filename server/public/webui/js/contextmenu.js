let x;
let y;

window.addEventListener("mousemove", (e) => {
    x = e.clientX;
    y = e.clientY;
})

const contextMenu = (target = document.getElementById("target"), items, callback = (selected) => {}) => {
    console.log(items, target);
    target.addEventListener("contextmenu", (e) => {
        const menu = document.createElement("div");
        menu.classList.add("contextMenu");
        for (let i in items) {
            let menuitem = document.createElement("div");
            menuitem.innerHTML = items[i];
            menu.appendChild(menuitem);
            menuitem.addEventListener("click", () => {
                callback(items[i]);
                menu.remove();
            })
        }
        e.preventDefault();
        if (document.body.clientWidth < 400) {
            menu.style.bottom = "0px";
            menu.style.left = "0px";
            menu.style.width = "100%";
            menu.style.height = "200px";
        } else {
            menu.style.top = y + "px";
            menu.style.left = x + "px";
        }

        document.body.appendChild(menu);
        window.addEventListener("click", () => {
            menu.remove();
        })
    })
}

export {contextMenu}