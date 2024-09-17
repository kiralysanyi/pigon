# Configuration file how to thing documentation

## File: config.json
### Location: server directory (next to index.js)
### Summary: used for storing important information like sql database username, password, of course it's plain text.

### Syntax

```
{
    db: {
        "host": [string],
        "username": [string],
        "password": [string],
        "dbName": [string]
    }
}
```