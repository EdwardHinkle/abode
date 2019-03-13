import * as jwt from "jsonwebtoken";
import * as fs from 'fs';
import * as readline from 'readline';

const EXPIRED_TOKEN_FILE_PATH = `${__dirname}/../../_storage/expired_tokens`;
const TOKEN_FILE_PATH = `${__dirname}/../../_storage/tokens`;

export let tokenProvision = (req, res, next) => {

    if (req.body.grant_type === undefined) {
        next();
        return;
    }

    let config = req.app.get('config');

    let grant_type = req.body.grant_type;
    let authorization_code = req.body.code;
    let client_id = req.body.client_id;
    let redirect_uri = req.body.redirect_uri;
    let me = req.body.me;

    // Optional AutoAuth properties
    let root_uri = req.body.root_uri;
    let callback_url = req.body.callback_url;

    if (client_id === undefined) {
        // todo: Display error of client_id
        console.log("ERROR client_id missing");
    }

    if (redirect_uri === undefined) {
        // todo: Display error of redirect_uri
        console.log("ERROR redirect_uri missing");
    }

    if (root_uri !== undefined && root_uri !== "https://eddiehinkle.com") {
        console.log('Attempting AutoAuth request under an invalid root_uri', root_uri);
        res.status(400).json({ error: "incorrect root_uri" });
        return;
    }

    if (callback_url !== undefined && root_uri === undefined) {
        console.log('Attempting AutoAuth request without a root_uri');
        res.status(400).json({ error: "Missing root_uri" });
        return;
    }

    if (callback_url) {

        // TODO: Any further AutoAuth verification steps needed

        res.status(202).send("proceed with AutoAuth");

        // TODO: Continue Here https://github.com/sknebel/AutoAuth/blob/test_reorder/AutoAuth.md#authorization-code-verification-request
        return;

    } else {
        jwt.verify(authorization_code, config.jwt_secret, (err, requestInfo) => {
            if (err || client_id != requestInfo.client_id || redirect_uri != requestInfo.redirect_uri) {
                console.log("Error verifying JWT for Auth Code while trying to generate token");
                res.redirect(requestInfo.redirect_uri + (requestInfo.redirect_uri.indexOf('?') > -1 ? '?' : '&') + 'error=invalid_request');
                return;
            }

            if (requestInfo.scope === undefined) {
                console.log("no scope available for token");
                // todo: Figure out what to return when there is no scope
                res.status(400);
                return;
            }

            // Authorization Code is confirmed, we can create an access token
            const payload = {
                client_id: requestInfo.client_id,
                me: requestInfo.me,
                id: new Date().getTime(),
                scope: requestInfo.scope
            };

            let access_token = jwt.sign(payload, config.jwt_secret, null);

            if (!fs.existsSync(TOKEN_FILE_PATH)) {
                fs.closeSync(fs.openSync(TOKEN_FILE_PATH, 'w'));
            }

            fs.appendFileSync(TOKEN_FILE_PATH, `${access_token}\n`);

            res.setHeader('Cache-Control', 'no-store');
            res.setHeader('Pragma', 'no-cache');

            res.json({
                "access_token": access_token,
                "token_type": "Bearer",
                "scope": requestInfo.scope.join(" "),
                "me": requestInfo.me
            });

        });
    }

};

export let tokenVerification = (req, res, next) => {

    let config = req.app.get('config');
    let access_token = req.headers.authorization.split("Bearer ").pop();

    console.log("IndieAuth Token Verification Endpoint");

    getTokenInfo(access_token, config).then(tokenInfo => {
        tokenInfo.scope = tokenInfo.scope.join(" ");

        res.json(tokenInfo);
    }, error => {
        console.log('Token Verification Issue', error);
        res.status(400).send('Forbidden');
    });

};

export let tokenRevocation = (req, res, next) => {

    let config = req.app.get('config');

    if (req.body.action !== 'revoke') {
        next();
    }

    console.log("Reached token revocation endpoint");

    let access_token = req.body.token;

    jwt.verify(access_token, config.jwt_secret, (err, requestInfo) => {
        if (err) {
            console.log("Error verifying JWT");
            res.status(403).send("Forbidden");
            return;
        }

        if (!fs.existsSync(EXPIRED_TOKEN_FILE_PATH)) {
            fs.closeSync(fs.openSync(EXPIRED_TOKEN_FILE_PATH, 'w'));
        }

        fs.appendFileSync(EXPIRED_TOKEN_FILE_PATH, `${requestInfo.id}\n`);

        res.status(200).send('ok');
    });

};

export let getTokenInfo = (access_token: string, config: any): Promise<any> => {
    return new Promise((resolve, reject) => {
        jwt.verify(access_token, config.jwt_secret, (err, requestInfo) => {

            if (err) {
                console.log("Error verifying JWT");
                reject({ error: "invalid_token "});
                //res.status(403).send("Forbidden");
                return;
            }

            let token_revoked = false;
            if (fs.existsSync(EXPIRED_TOKEN_FILE_PATH)) {
                const rl = readline.createInterface({
                    input: fs.createReadStream(EXPIRED_TOKEN_FILE_PATH)
                });

                rl.on('line', (line) => {
                    if (line == requestInfo.id) {
                        token_revoked = true;
                        rl.close();
                    }
                });

                rl.on('close', () => {
                    if (token_revoked) {
                        console.log("Token has been revoked");
                        //res.status(400).send("Forbidden");
                        reject({ error: "invalid_token "});
                        return;
                    }

                    resolve({
                        "me": requestInfo.me,
                        "client_id": requestInfo.client_id,
                        "scope": requestInfo.scope
                    });
                });
            } else {
                resolve({
                    "me": requestInfo.me,
                    "client_id": requestInfo.client_id,
                    "scope": requestInfo.scope
                });
            }

        });
    });
};