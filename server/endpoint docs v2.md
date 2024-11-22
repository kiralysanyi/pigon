# Authentication API Documentation

This documentation outlines the various authentication endpoints and how they should be used. It covers everything from logging in, registering, and managing devices to handling WebAuthn authentication. Each endpoint's purpose, request format, and expected responses are provided for easy integration into your system.

## **/api/v1/auth/login**
### **Description**  
This endpoint is used to authenticate a user and create a session. On successful authentication, a token is returned and stored in a cookie, which is used for subsequent authenticated requests.

### **Method**  
`POST`

### **Request Body**
```json
{
    "username": "your-username",
    "password": "your-password",
    "deviceName": "optional-device-name"
}
```
- `username` *(required)*: Your unique username.
- `password` *(required)*: Your account password.
- `deviceName` *(optional)*: Name of the device you are using to log in.

### **Response (Success)**
```json
{
    "success": true,
    "data": {
        "userInfo": {
            "id": 123,
            "username": "your-username"
        },
        "message": "Login successful"
    }
}
```
- The authentication token is stored in a secure cookie.

### **Response (Failure)**
```json
{
    "success": false,
    "data": {
        "message": "Invalid username or password"
    }
}
```
- In case of failure, the `message` field will explain the issue (e.g., incorrect login details).

---

## **/api/v1/auth/register**
### **Description**  
This endpoint allows you to create a new user account.

### **Method**  
`POST`

### **Request Body**
```json
{
    "username": "desired-username",
    "password": "desired-password"
}
```
- `username` *(required)*: The username you wish to register.
- `password` *(required)*: The password for your new account.

### **Response (Success)**
```json
{
    "success": true,
    "data": {
        "message": "Registration successful"
    }
}
```

---

## **/api/v1/auth/delete**
### **Description**  
This endpoint deletes a user account. You must provide valid credentials to delete an account.

### **Method**  
`DELETE`

### **Request Body**
```json
{
    "username": "your-username",
    "password": "your-password"
}
```
- `username` *(required)*: Your account username.
- `password` *(required)*: Your account password.

### **Response (Success)**
```json
{
    "success": true,
    "data": {
        "message": "Account deleted successfully"
    }
}
```

### **Response (Failure)**
```json
{
    "success": false,
    "data": {
        "message": "Incorrect username or password"
    }
}
```

---

## **/api/v1/auth/devices**
### **Description**  
Retrieve information about all devices currently logged in with your account. This allows you to manage active sessions across different devices.

### **Method**  
`GET`

### **Note**  
Authentication token must be present in cookies.

### **Response (Success)**
```json
{
    "success": true,
    "data": [
        {
            "deviceID": "device-1-id",
            "deviceInfo": {
                "user-agent": "xyz",
                "deviceName": "fedora box"
            },
            "registerDate": "2023-09-15T10:30:00Z"
        },
        {
            "deviceID": "device-2-id",
            "deviceInfo": {
                "user-agent": "xyz",
                "deviceName": "windows box"
            },
            "registerDate": "2023-09-14T14:22:00Z"
        }
    ]
}
```
Each device entry contains:
- `deviceID`: The unique identifier of the device.
- `deviceInfo`: A JSON object containing information about the device (user agent, device name, etc.).
- `registerDate`: The date and time the device was registered.

### **Response (Failure)**
```json
{
    "success": false,
    "data": {
        "message": "Failed to verify token"
    }
}
```

---

## **/api/v1/auth/userinfo**
### **Description**  
Retrieve information about a specific user or the currently logged-in user if no `userID` is provided.

### **Method**  
`GET`

### **Optional Request Body**
```json
{
    "userID": 123
}
```
- `userID` *(optional)*: The ID of the user you want information about.

### **Response (Success)**
```json
{
    "success": true,
    "data": {
        "userInfo": {
            "id": 123,
            "username": "user-username"
        }
    }
}
```

---

## **/api/v1/auth/logout**
### **Description**  
Logs the user out by removing the current device from the database and invalidating the authentication token.

### **Method**  
`GET`

### **Note**  
No request body is needed, but the authentication token must be stored in cookies.

### **Response**
```json
{
    "success": true,
    "data": {
        "message": "Successfully logged out"
    }
}
```

---

## **/api/v1/auth/removedevice**
### **Description**  
Removes a specific logged-in device from your account, effectively logging that device out.

### **Method**  
`DELETE`

### **Request Body**
```json
{
    "deviceID": "device-1-id"
}
```
- `deviceID` *(required)*: The ID of the device to be removed.

### **Response (Success)**
```json
{
    "success": true,
    "data": {
        "message": "Device removed successfully"
    }
}
```

---

## **/api/v1/auth/changepass**
### **Description**  
Allows you to change your password.

### **Method**  
`PUT`

### **Request Body**
```json
{
    "oldpass": "current-password",
    "newpass": "new-password"
}
```
- `oldpass` *(required)*: Your current password.
- `newpass` *(required)*: Your new password.

### **Response (Success)**
```json
{
    "success": true,
    "data": {
        "message": "Password changed successfully"
    }
}
```

---

# WebAuthn Endpoints

## **/api/v1/auth/webauthn/challenge**
### **Description**  
Retrieve a challenge from the server to begin WebAuthn authentication.

### **Method**  
`GET`

### **Response**
```json
{
    "challenge": "webauthn-challenge-string"
}
```

---

## **/api/v1/auth/webauthn/register**
### **Description**  
Register a WebAuthn authenticator for an existing user.

### **Method**  
`POST`

### **Request Body**
```json
{
    "username": "your-username",
    "password": "your-password",
    "registration": {
        "id": "authenticator-id",
        "rawId": "raw-authenticator-id",
        "type": "public-key",
        "response": {
            "clientDataJSON": "client-data",
            "attestationObject": "attestation-object"
        }
    },
    "challenge": "webauthn-challenge-string"
}
```
- `registration`: The WebAuthn registration object (as per the WebAuthn specification).
- `challenge`: The challenge received from the `/challenge` endpoint.

### **Response (Success)**
```json
{
    "success": true,
    "data": {
        "message": "WebAuthn registration successful"
    }
}
```

---

## **/api/v1/auth/webauthn/auth**
### **Description**  
Authenticate a user using WebAuthn.

### **Method**  
`POST`

### **Request Body**
```json
{
    "username": "your-username",
    "challenge": "webauthn-challenge-string",
    "authentication": {
        "id": "authenticator-id",
        "rawId": "raw-authenticator-id",
        "type": "public-key",
        "response": {
            "clientDataJSON": "client-data",
            "authenticatorData": "authenticator-data",
            "signature": "signature",
            "userHandle": "user-handle"
        }
    }
}
```

### **Response (Success)**
```json
{
    "success": true,
    "data": {
        "message": "Authentication successful"
    }
}
```
- The new authentication token is stored in a secure cookie.

In case of failure, a relevant error message will be returned in the `message` field.


## **/api/v1/auth/pfp**
### **Description**  
Get profile picture of a user.

### **Method**  
`GET`

### **Request Body**
```json
{
    "id": 123
}
```
- `id` : The ID of the user you want information about.

### **Response (Success)**
Profile picture of the user.

## **/api/v1/auth/pfp**
### **Description**  
Upload profile picture of a user.

### **Method**  
`POST`

### **Request Body**
Formdata containing the image. Note: You have to be authenticated for this request.


### **Response (Success)**
