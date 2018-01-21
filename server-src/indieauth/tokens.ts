import * as jwt from "jsonwebtoken";

export let tokenProvision = (req, res, next) => {

    let config = req.app.get('config');


    let grant_type = req.body.grant_type;
    let authorization_code = req.body.code;
    let client_id = req.body.client_id;
    let redirect_uri = req.body.redirect_uri;
    let me = req.body.me;

    if (client_id === undefined) {
        // todo: Display error of client_id
        console.log("ERROR client_id missing");
    }

    if (redirect_uri === undefined) {
        // todo: Display error of redirect_uri
        console.log("ERROR redirect_uri missing");
    }

    jwt.verify(authorization_code, config.jwt_secret, (err, requestInfo) => {
        if (err || client_id != requestInfo.client_id || redirect_uri != requestInfo.redirect_uri) {
            console.log("Error verifying JWT");
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

        let access_token = jwt.sign(payload, config.jwt_secret,null);

        res.json({
            "access_token": access_token,
            "token_type": "Bearer",
            "scope": requestInfo.scope.join(" "),
            "me": requestInfo.me
        });

    });

};

export let tokenVerification = (req, res, next) => {

    let config = req.app.get('config');

    console.log(req.headers.authorization);

    let access_token = req.headers.authorization.split("Bearer ");

    console.log("IndieAuth Token Verification Endpoint");

    jwt.verify(access_token, config.jwt_secret, (err, requestInfo) => {
        if (err) {
            console.log("Error verifying JWT");
            res.status(403);
            return;
        }

        res.json({
            "me": requestInfo.me,
            "client_id": requestInfo.client_id,
            "scope": requestInfo.scope.join(" ")
        });

    });

};