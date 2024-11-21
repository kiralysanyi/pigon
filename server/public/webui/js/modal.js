class modal {
    constructor(title) {
        this.title = title;
        this.container = document.createElement("div");
        this.mainElement = document.createElement("div");
        this.contentElement = document.createElement("div");
        this.titleElement = document.createElement("div");
        this.titleElement.classList.add("modal_title");
        this.container.classList.add("modal_container");
        this.mainElement.classList.add("modal");
        this.contentElement.classList.add("modal_content");
        this.container.appendChild(this.mainElement);
        this.mainElement.appendChild(this.titleElement);
        this.mainElement.appendChild(this.contentElement);
        this.container.style.opacity = 0;
        this.titleElement.innerHTML = title;
        let closebtn = document.createElement("div");
        closebtn.innerHTML = '<i class="fa-solid fa-x"></i>';
        closebtn.classList.add("modal_closebtn");
        this.mainElement.appendChild(closebtn);
        closebtn.addEventListener("click", () => {
            this.close();
        })
    }

    open() {
        document.body.appendChild(this.container);
        setTimeout(() => {
            this.container.style.opacity = 1;
        }, 50);
    }

    close() {
        this.container.style.opacity = 0;
        setTimeout(() => {
            document.body.removeChild(this.container);
        }, 310);
    }

}

export {modal}