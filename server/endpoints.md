# Authentication endpoints

## /api/v1/auth/login
Used for authenticating the user and creating the session
Request type: `POST`
### Request body:
```
{
    "username": [string],
    "password": [string],
    "deviceName": [string]
}
```
The `deviceName` field is optional.
### Response body success:
```
{
    "success": true,
    "data": {
        "userInfo": {
            "id": [int],
            "username": [string]
        },
        "token": [string]
    }
}
```

### Response body fail:
```
{
    "success": false,
    "data": {
        "message": [string]
    }
}
```

## /api/v1/auth/register
Used for creating an account
Request type: `POST`
### Request body:
```
{
    "username": [string],
    "password": [string]
}
```

## /api/v1/auth/delete
Used for deleting an account
Request type: `DELETE`
### Request body:
```
{
    "username": [string],
    "password": [string]
}
```

### Response body:
```
{
    "success": [bool],
    "data": {
        "message": [string]
    }
}
```

## /api/v1/auth/devices
Used for getting info about all devices logged in devices for the current user
Request type: `GET`

Note: authorization header required.

### Response body
```
{
    "success": true,
    "data": [
        {
            "deviceID": [string],
            "deviceInfo": [json],
            "registerDate": [date]
        },
                {
            "deviceID": [string],
            "deviceInfo": [json],
            "registerDate": [date]
        }
    ]
}
```

### Response body on fail
```
    {
    "success": false,
    "data": {
        "message": "Failed to verify token"
    }
}
```

## /api/v1/auth/userinfo
Used for getting info about a specific user. If no userID provided, then the server responds with the currently logged in user's info.

Request type: `GET`

### Request body (optional):
```
{
    userID: [int]
}
``` 

## /api/v1/auth/logout
Used for logging out. A.k.a deleting the device from the database, which will invalidate the token.

Request type: `GET`

Request body not required only authorization header containing the token.

### Response body:
```
{
    success: [bool]
    data: {
        message: [string]
    }
}
```

## /api/v1/auth/removedevice
Used for removing currently logged in devices
Request type: `DELETE`

Authorization header required.
### Request body
```
{
    deviceID: [string]
}
```

### Response body:
```
{
    success: [bool]
    data: {
        message: [string]
    }
}
```

## /api/v1/auth/changepass
Used for changing password

Method: `POST`

Authorization header required.

### Request body:
```
{
    oldpass: [string],
    newpass: [string]
}
```

### Response body:
```
{
    success: [bool],
    data: {
        message: [string]
    }
}
```

## /api/v1/auth/modify
Used for modifying user information (password, username, email, everything)
### Request type: `UPDATE`
