/**
 * Removes a specific value from an array.
 * @param {Array} array - The array to modify.
 * @param {*} valueToRemove - The value to remove.
 * @returns {Array} - A new array without the specified value.
 */
function removeValue(array, valueToRemove) {
    return array.filter(value => value !== valueToRemove);
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

module.exports = {removeValue, escapeJsonControlCharacters}