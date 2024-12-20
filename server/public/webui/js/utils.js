/**
 * Removes a specific value from an array.
 * @param {Array} array - The array to modify.
 * @param {*} valueToRemove - The value to remove.
 * @returns {Array} - A new array without the specified value.
 */
function removeValue(array, valueToRemove) {
    return array.filter(value => value !== valueToRemove);
}

function sanitizeInput(input) {
    // Replace characters that could break JSON
    return input.replace(/\\/g, '\\\\') // Escape backslashes
        .replace(/"/g, '\\"')   // Escape double quotes
        .replace(/</g, '&lt;') // Escape < to prevent HTML injection
        .replace(/>/g, '&gt;') // Escape > to prevent HTML injection
        .replace(/&/g, '&amp;') // Escape &
        .replace(/'/g, '&#39;'); // Escape single quotes
}

// Decode sanitized input for display
function decodeHTML(html) {
    const element = document.createElement('textarea');
    element.innerHTML = html;
    return element.value;
}

let audioElement = document.createElement("audio");
audioElement.src = "/app/pigon.mp3"
audioElement.loop = true;
audioElement.autoplay = false;
audioElement.muted = false;

function playRingtone() {
    audioElement.play();
}

function stopRingtone() {
    audioElement.pause();
}

function escapeJsonControlCharacters(jsonString) {
    return jsonString.replace(/[\n\r\t\b\f\v]/g, match => {
        switch (match) {
            case '\n': return '\\n';
            case '\r': return '\\r';
            case '\t': return '\\t';
            case '\b': return '\\b';
            case '\f': return '\\f';
            case '\v': return '\\v';
            default: return match;
        }
    });
}


export {removeValue, sanitizeInput, decodeHTML, playRingtone, stopRingtone, escapeJsonControlCharacters}