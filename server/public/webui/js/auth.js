function setCookie(name, value, days = 1) {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    const expires = `expires=${date.toUTCString()}`;
    document.cookie = `${name}=${value}; ${expires}; path=/; Secure; HttpOnly`;
}

function getCookie(name) {
    const nameEQ = `${name}=`;
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
        while (cookie.charAt(0) === ' ') cookie = cookie.substring(1, cookie.length);
        if (cookie.indexOf(nameEQ) === 0) return cookie.substring(nameEQ.length, cookie.length);
    }
    return null;
}

function deleteCookie(name) {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; Secure; HttpOnly`;
}

async function login(username, password, deviceName = '') {
    const response = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: "include",
        body: JSON.stringify({ username, password, deviceName })
    });
    const data = await response.json();
    if (data.success) {
        console.log('Login successful', data);
    } else {
        console.error('Login failed', data.data.message);
    }
    return data;
}

async function register(username, password) {
    const response = await fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: "include",
        body: JSON.stringify({ username, password })
    });
    const data = await response.json();
    if (data.success) {
        console.log('Registration successful', data);
    } else {
        console.error('Registration failed', data.data.message);
    }
    return data;
}

async function deleteAccount(username, password) {
    const response = await fetch('/api/v1/auth/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: "include",
        body: JSON.stringify({ username: username, password: password })
    });
    const data = await response.json();
    if (data.success) {
        console.log('Account deleted successfully', data);
    } else {
        console.error('Account deletion failed', data.data.message);
    }
    return data;
}

async function getDevices() {
    const response = await fetch('/api/v1/auth/devices', {
        method: 'GET',
        credentials: 'include' // Send cookies
    });
    const data = await response.json();
    if (data.success) {
        console.log('Devices retrieved', data.data);
    } else {
        console.error('Failed to retrieve devices', data.data.message);
    }
    return data;
}

async function getUserInfo(userID = null) {
    let url = '/api/v1/auth/userinfo';
    if (userID != null) {
       url = '/api/v1/auth/userinfo?userID=' + userID 
    }
    const response = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: "include"
    });
    const data = await response.json();
    if (data.success) {
        console.log('User info retrieved', data.data);
    } else {
        console.error('Failed to retrieve user info', data.message);
    }
    return data;
}

async function logout() {
    const response = await fetch('/api/v1/auth/logout', {
        method: 'GET',
        credentials: 'include' // Send cookies
    });
    const data = await response.json();
    if (data.success) {
        console.log('Logout successful', data);
        deleteCookie('authToken'); // Delete auth token cookie if needed
    } else {
        console.error('Logout failed', data.data.message);
    }
    return data;
}

async function removeDevice(deviceID) {
    const response = await fetch('/api/v1/auth/removedevice', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: "include",
        body: JSON.stringify({ deviceID })
    });
    const data = await response.json();
    if (data.success) {
        console.log('Device removed successfully', data);
    } else {
        console.error('Failed to remove device', data.data.message);
    }
    return data;
}

async function changePassword(oldpass, newpass) {
    const response = await fetch('/api/v1/auth/changepass', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: "include",
        body: JSON.stringify({ oldpass, newpass })
    });
    const data = await response.json();
    if (data.success) {
        console.log('Password changed successfully', data);
    } else {
        console.error('Failed to change password', data.data.message);
    }
    return data;
}


async function getWebAuthnChallenge() {
    const response = await fetch('/api/v1/auth/webauthn/challenge', {
        method: 'GET'
    });
    const data = await response.json();
    if (data.challenge) {
        console.log('Challenge retrieved', data.challenge);
    } else {
        console.error('Failed to retrieve challenge');
    }
    return data.challenge;
}

async function registerWebAuthn(username, password, registration, challenge) {
    const response = await fetch('/api/v1/auth/webauthn/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: "include",
        body: JSON.stringify({ username, password, registration, challenge }),
    });
    const data = await response.json();
    if (data.success) {
        console.log('WebAuthn registration successful', data);
    } else {
        console.error('WebAuthn registration failed', data.data.message);
    }
    return data;
}

async function authenticateWebAuthn(username, challenge, authentication) {
    const response = await fetch('/api/v1/auth/webauthn/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: "include",
        body: JSON.stringify({ username, challenge, authentication })
    });
    const data = await response.json();
    if (data.success) {
        console.log('WebAuthn authentication successful', data);
    } else {
        console.error('WebAuthn authentication failed', data.data.message);
    }
    return data;
}

async function checkIfLoggedIn() {
    let userinfo = await getUserInfo();
    console.log(userinfo);
    if (userinfo.success == false) {
        return false;
    }

    if (userinfo.success == true) {
        return true;
    }
}

let isLoggedIn = await checkIfLoggedIn();
if (isLoggedIn == false) {
    location.replace("/app/login.html")
}

function searchUsers(query) {
    return new Promise((resolved, rejected) => {
        fetch("/api/v1/auth/search?" + new URLSearchParams({ search: query }).toString(), {
            method: "GET",
            credentials: "include"
        }).then(async (response) => {
            let res = await response.json()
            if (res.success == false) {
                rejected(new Error(res.message))
                return;
            }
            resolved(res["data"]);
        }).catch((error) => {
            rejected(error)
        })
    });

}

export { searchUsers, changePassword, deleteAccount, deleteCookie, getCookie, getDevices, getUserInfo, getWebAuthnChallenge, login, logout, register, removeDevice, checkIfLoggedIn }