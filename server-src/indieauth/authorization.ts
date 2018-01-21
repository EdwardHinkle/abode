import {ResponseType} from "./response-type.model";
import * as mf from 'microformat-node';
import * as Cheerio from "cheerio";
import * as request from "request";

import {scopeDefinitions} from "./scopes.model";

export let authorizationEndpoint = (req, res, next) => {

    if (req.session.username === undefined) {
        console.log("ERROR!");
        console.log("Not logged in");
        next();
        return;
    }

    let response_type: ResponseType = req.query.response_type || 'id';

    if (response_type !== 'code') {
        next();
        return;
    }

    let me = req.query.me;
    let client_id = req.query.client_id;
    let redirect_uri = req.query.redirect_uri;
    let state = req.query.state;
    let scope = req.query.scope;

    console.log("IndieAuth Authorization Endpoint");

    if (client_id === undefined) {
        // todo: Display error of client_id
        console.log("ERROR client_id missing");
    }

    if (redirect_uri === undefined) {
        // todo: Display error of redirect_uri
        console.log("ERROR redirect_uri missing");
    }

    if (me === undefined) {
        // todo: Reject request and present error
        console.log("ERROR missing me");
    }

    // todo: Verify that me === req.session.username within margin

    // todo: Verify scopes or defaults are appropriate?

    request.get(client_id, (error, response, body) => {
        if (error) {
            // todo: Figure out how to gracefully handle client_id error
            console.log("client id error!");
            return;
        }

        let mfOptions = {
            node: Cheerio.load(body)
        };

        mf.get(mfOptions, (err, data) => {
            if (err) {
                // todo: Figure out how to gracefully handle client mf2 error
                console.log("client mf2 error");
                return;
            }

            let clientApp = data.items.find(item => (item.type[0] === "h-x-app" || item.type[0] === "h-app")).properties;

            // todo: Check to see if redirect_uri is part of the client_id's domain
            // todo: If redirect_uri is NOT part of the client_id's domain, check if it is in the redirect array
            let redirectUris = data.rels.redirect_uri;
            // todo: if redirect_uri is not official, reject it

            let scopes = [
                {
                    id: 'id',
                    name: `Identify you as Eddie Hinkle (${req.session.username})`
                },
            ];

            console.log('check scope');
            console.log(scope);

            let scopeArray = scope.split(" ");
            scopes = scopes.concat(scopeArray.map(scopeValue => {
                return {
                    id: scopeValue,
                    name: scopeDefinitions[scopeValue]
                };
            }));

            req.session.indieAuthRequest = {
                response_type: response_type,
                me: me,
                client_id: client_id,
                redirect_uri: redirect_uri,
                state: state,
                scopes: scopes
            };

            res.render("indieauth/authorization", {
                app: clientApp,
                me: req.session.username,
                client_id: client_id,
                scopes: scopes
            });
        });

    });

};