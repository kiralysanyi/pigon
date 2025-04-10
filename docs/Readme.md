# Pigon docs

## Frontend

We have multiple frontends for Pigon.

- An android app
- Webui written in React
- Webui made with vanilla js (included in backend)

Links

- [Android app](https://github.com/kiralysanyi/pigon-android/)
- [Webui (react)](https://github.com/kiralysanyi/pigon-react/)

## Backend

The backend is available in this repo, this is the main repository

### Backend technical things

#### Authentication
- Hashing passwords with `sha256` using the included `node:crypto` library
- Using JWT tokens + we include a deviceID inside every token which we check in the db too. This is needed for remote logout (removing devices).
- Optionally, we include support for passkey authentication on all clients

#### Message handling

- We are using `socket.io` to deliver messages realtime (mostly undocumented)
- There are some REST API endpoints available for fetching messages from the past.

#### User Account controls

- Delete user
- Change password
- Add passkey / remove all passkey
- Optionally: you can add your full name and a biography, which is displayed on your profile (only available in oldui and android app, partially supported in pigon-react)

#### Database

![SQL screenshot](https://raw.githubusercontent.com/kiralysanyi/pigon/a35cccf512a3c48045776ed681940224a05a93cf/docs/sql.png)
[Drawsql link](https://drawsql.app/teams/none-2111/diagrams/random-chat-db-thing)

Note: callhistory table is not in use

#### Dependencies

- @passwordless-id/webauthn (a forked version, this fork needed to support passkeys on android)
- body-parser
- cookie-parser
- cors
- dotenv
- express
- express-fileupload
- firebase-admin
- jsonwebtoken
- mysql2
- sanitize
- sharp
- socket.io
- uuid
- web-push (mostly removed from the project, replaced by firebase)
- and nodemon for development

  ## Tools used while developing the application

  - VSCode
  - ChatGPT
  - Google Gemini (it was included in Android Studio 🤣)
  - Llama3.2 (chatbot, not included in public repos)
  - Github
  - Hoppscotch (postman alternative)
  - MDN Web Docs
  - devdocs.io
  - DrawSQL
  - phpmyadmin
 
  ## Admin panel

  Available under /adminpanel/ui

  ## Structure (inside server folder)

  - adminpanel: admin panel related stuff
  - communication_handler: socketio related handlers
  - endpoints: every endpoint handler is here, except call handling and admin panel
  - public: this contains the integrated ui (a.k.a oldui)
  - webauthn: webauthn library fork (git submodule)
  - things: things, utils, helpers

  ## Some code snippets because why the hell not

  ### Auth middleware

  ```js
  let authMiddleWare = async (req, res, next) => {
        if (!req.cookies.token) {
            res.status(403).json({
                success: false,
                message: "Failed to verify user"
            });
            return;
        }
    
        let verificationResponse = await verifyToken(req.cookies.token);
        if (verificationResponse.success == false) {
            res.status(403).json({
                success: false,
                message: "Failed to verify token"
            });
            return;
        }

        let userdata = verificationResponse.data;
        req.userdata = userdata;
        next();
        }
  ```

What the heck does this do?

Checks for token in cookies, verifies jwt token if exists, and adds userdata to req object and continues

# VPS

VPS provider for test server: [Vipy](https://vipy.hu)
