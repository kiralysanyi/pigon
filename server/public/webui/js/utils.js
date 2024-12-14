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

export {removeValue, sanitizeInput, decodeHTML}