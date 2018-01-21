import {ResponseType} from "./response-type.model";
import * as mf from 'microformat-node';
import * as Cheerio from "cheerio";
import * as request from "request";
import * as jwt from "jsonwebtoken";

import {scopeDefinitions} from "./scopes.model";

export let verificationEndpoint = (req, res, next) => {

    let config = req.app.get('config');

    if (req.session.username === undefined) {
        console.log("ERROR!");
        console.log("Not logged in");
        next();
        return;
    }

    if (req.query.code === undefined) {
        next();
        return;
    }

    let code = req.query.code;
    let client_id = req.query.client_id;
    let redirect_uri = req.query.redirect_uri;

    console.log("IndieAuth Verification Endpoint");

    if (client_id === undefined) {
        // todo: Display error of client_id
        console.log("ERROR client_id missing");
    }

    if (redirect_uri === undefined) {
        // todo: Display error of redirect_uri
        console.log("ERROR redirect_uri missing");
    }

    jwt.verify(code, config.jwt_secret, (err, requestInfo) => {
        if (err || client_id != requestInfo.client_id || redirect_uri != requestInfo.redirect_uri) {
            console.log("Error verifying JWT");
            res.redirect(requestInfo.redirect_uri + (requestInfo.redirect_uri.indexOf('?') > -1 ? '?' : '&') + 'error=invalid_request');
            return;
        }

        console.log("sending json");
        console.log({
            "me": req.session.username
        });

        res.json({
            "me": req.session.username
        });

    });

};