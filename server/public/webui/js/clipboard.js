/**
 * 
 * @callback pasteCallback 
 * @param {File} file
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

export {onimagepaste, onvideopaste}