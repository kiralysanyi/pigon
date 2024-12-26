/**
 * 
 * @callback pasteCallback 
 * @param {File} file
 */

/**
 * 
 * @callback dropCallback
 * @param {File} file
 * @param {String} type
 */


/**
 * 
 * @param {pasteCallback} cb 
 */
const onimagepaste = (cb) => {
    document.addEventListener("paste", (event) => {
        // Access the clipboard data
        const clipboardData = event.clipboardData || window.clipboardData;
    
        if (clipboardData) {
            // Loop through the clipboard items
            for (const item of clipboardData.items) {
                if (item.type.startsWith("image/")) {
                    // Get the image as a Blob
                    const blob = item.getAsFile();
                    if (blob) {
                        console.log("Pasted image blob:", blob);
    
                        cb(blob);
                        return;
                    }
                }
            }
        } else {
            console.error("No clipboard data available.");
        }
    });
}

/**
 * 
 * @param {pasteCallback} cb 
 */
const onvideopaste = (cb) => {
    document.addEventListener("paste", (event) => {
        // Access the clipboard data
        const clipboardData = event.clipboardData || window.clipboardData;
    
        if (clipboardData) {
            // Loop through the clipboard items
            for (const item of clipboardData.items) {
                if (item.type.startsWith("video/")) {
                    // Get the video as a Blob
                    const blob = item.getAsFile();
                    if (blob) {
                        console.log("Pasted video blob:", blob);
    
                        cb(blob);
                        return;
                    }
                }
            }
        } else {
            console.error("No clipboard data available.");
        }
    });
}

// Prevent default behavior for drag events
["dragenter", "dragover", "dragleave", "drop"].forEach((eventName) => {
    document.addEventListener(eventName, (event) => event.preventDefault());
});

/**
 * 
 * @param {dropCallback} cb 
 */
let onmediadrop = (cb) => {
    document.addEventListener("drop", (event) => {
        event.preventDefault();
        const items = event.dataTransfer.items;
        for (const item of items) {
            if (item.kind === "file" && item.type.startsWith("image/")) {
                const file = item.getAsFile();
                if (file) {
                    console.log("Dropped image file:", file);
    
                    cb(file, "image");
                    return
                }
            }

            if (item.kind === "file" && item.type.startsWith("video/")) {
                const file = item.getAsFile();
                if (file) {
                    console.log("Dropped video file:", file);
    
                    cb(file, "video");
                    return
                }
            }
        }
    })
}

export {onimagepaste, onvideopaste, onmediadrop}