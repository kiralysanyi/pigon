function parseUserAgent(userAgent) {
    const browserPatterns = [
        { regex: /Chrome\/([\d.]+)/, name: "Chrome" },
        { regex: /Firefox\/([\d.]+)/, name: "Firefox" },
        { regex: /MSIE ([\d.]+)/, name: "Internet Explorer" },
        { regex: /Safari\/([\d.]+)/, name: "Safari" }, // Excludes Chrome (since Chrome also includes "Safari")
        { regex: /Edg\/([\d.]+)/, name: "Edge" },
        { regex: /Opera\/([\d.]+)|OPR\/([\d.]+)/, name: "Opera" }, // Handles both "Opera" and "OPR" variants
    ];

    for (const { regex, name } of browserPatterns) {
        const match = userAgent.match(regex);
        if (match) {
            return { browser: name, version: match[1] || match[2] };
        }
    }

    return { browser: "Unknown", version: "Unknown" };
}

export { parseUserAgent }