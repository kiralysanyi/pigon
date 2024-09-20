import { client } from "./webauthn.min.js"

let clog = console.log;

console.log = (...args) => {
    clog(args)
    let line;
    for (let i in args) {
        line += args[i]
    }

    line += "\n";
    document.getElementById("log").innerHTML += line;
}

const httprequest = (method, endpoint, body, isJson = false) => {
    return new Promise((resolved) => {
        let req = new XMLHttpRequest();
        req.open(method, endpoint);
        if (isJson) {
            req.setRequestHeader("Content-Type", "application/json")
        }
        req.addEventListener("loadend", () => {
            console.log(req.responseText);
            resolved(req.responseText);
        })
        req.send(body);
    });

}

const register = (username, password) => {
    return new Promise(async (resolved) => {
        let challenge = JSON.parse(await httprequest("GET", "/api/v1/auth/webauthn/challenge"))["challenge"];
        let response = JSON.parse(await httprequest("POST", "/api/v1/auth/login", JSON.stringify({ username, password, deviceName: "Webauthn register" }), true));
        if (response.success == false) {
            console.log("Failed to authenticate");
            return;
        }
        let token = response["data"]["token"];
        console.log(token);

        const registration = await client.register({
            user: username,
            challenge: challenge,
            /* possibly other options */
        });
        console.log(registration);

        await httprequest("POST", "/api/v1/auth/webauthn/register", JSON.stringify({
            username,
            password,
            registration,
            challenge,
        }), true)

        
        resolved();
    })
}

const authenticate = async (username) => {
    let challenge = JSON.parse(await httprequest("GET", "/api/v1/auth/webauthn/challenge"))["challenge"];

    const authentication = await client.authenticate({
        /* Required */
        challenge: challenge,
        timeout: 60000
    })

    console.log(authentication)

    let response = JSON.parse(await httprequest("POST", "/api/v1/auth/webauthn/auth", JSON.stringify({username, authentication, challenge, deviceName: document.getElementById("deviceName").value}), true));
    console.log(response)
    
}

document.getElementById("regbutton").addEventListener("click", () => {
    register(document.getElementById("username").value, document.getElementById("password").value);
})

document.getElementById("authbutton").addEventListener("click", () => {
    authenticate(document.getElementById("username").value);
});