# Authentication endpoints

## /api/auth/login
Used for authenticating the user and creating the session

## /api/auth/register
Used for creating an account
### Request body:
```
{
    "username": [string],
    "password": [string]
}
```

## /api/auth/restricted/delete
Used for deleting an account

## /api/auth/restricted/sessions
Used for getting info about all active sessions for the currently logged in user

## /api/auth/restricted/sessionInfo
Used for getting info about the current session

## /api/auth/restricted/userInfo
Used for getting info about a specific user (authentication required)

## /api/auth/restricted/modify
Used for modifying user information (password, username, email, everything)