# Configuration file how to thing documentation

## File: config.json
### Location: server directory (next to index.js)
### Summary: used for storing important information like sql database username, password, of course it's plain text. Aaaaand we store the jwt's secret here too.

### Syntax

```
{
    "db": {
        "host": "localhost",
        "username": "root",
        "password": "",
        "dbName": "accountsdb"
    },
    "http": {
        "port": 8080
    },
    "jwt": {
        "secret": "1234"
    }
}
```