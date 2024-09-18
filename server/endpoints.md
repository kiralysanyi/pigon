# Authentication endpoints

## /api/v1/auth/login
Used for authenticating the user and creating the session
Request type: `POST`

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

## /api/v1/auth/sessions
Used for getting info about all active sessions for the currently logged in user
Request type: `POST`

## /api/v1/auth/sessionInfo
Used for getting info about the current session
Request type: `POST`

## /api/v1/auth/userInfo
Used for getting info about a specific user (authentication required)
Request type: `GET`

## /api/v1/auth/modify
Used for modifying user information (password, username, email, everything)
### Request type: `UPDATE`

## Cookies used:
### Session UID
This cookie stores a simple UID generated with uuid v4.
The server verifies the session based on this UID, the session id is paired to ip address and user agent.