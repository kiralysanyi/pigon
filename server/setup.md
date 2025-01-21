# Setup pigon server

### Create `.env` file

```env
PORT=8080
DBHOST="localhost"
DB_USERNAME="root"
DB_PASSWORD=""
DBNAME="pigon"
JWT_SECRET="kcske"
ORIGIN="http://localhost:8080"
```

### Setup database
Import the database from `pigon.sql`


### Install dependencies

`npm i`

### Run application
`npm start` or `npm run dev`

`npm run dev` starts the application with nodemon

## Optional

### Add firebase config
It's easy to configure firebase fcm for pigon, just put the `firebase.json` file you got from firebase console to the root directory of the server

You can find more information [here](https://firebase.google.com/docs/web/setup)

