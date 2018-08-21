import {ResponseType} from "./response-type.model";

import * as mf from 'microformat-node';
import * as Cheerio from 'cheerio';
import * as request from 'request';

export let authenticationEndpoint = (req, res, next) => {

    console.log('STARTING AUTHENTICATION');

    if (req.session.username === undefined) {
        console.log("ERROR!");
        console.log("Not logged in");
        next();
        return;
    }

    let response_type: ResponseType = req.query.response_type || 'id';

    if (response_type !== 'id') {
        console.log('RESPONSE TYPE IS NOT ID');
        next();
        return;
    }

    let me = req.query.me;
    let client_id = req.query.client_id;
    let redirect_uri = req.query.redirect_uri;
    let state = req.query.state;

    console.log("IndieAuth Authentication Endpoint");

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
    let manifestUrl;

    request.get(client_id, (error, response, body) => {
        if (error) {
            // todo: Figure out how to gracefully handle client_id error
            console.log("client id error!");
            console.log(error);
            return;
        }

        let mfOptions = {
            node: Cheerio.load(body)
        };

        let $ = Cheerio.load(body);

        manifestUrl = $("[rel='manifest']").attr("href");
        if (manifestUrl) {
            if (manifestUrl.indexOf('http') === -1) {
                manifestUrl = client_id + manifestUrl;
            }

            request.get(manifestUrl, {json: true}, (error, response, body) => {
                console.log('indieauth client manifest');
                console.log(body);
                console.log(body.name);
                console.log(body.icons[0]);

                let scopes = [
                    {
                        id: 'id',
                        name: `Identify you as Eddie Hinkle (${req.session.username})`
                    }
                ];

                req.session.indieAuthRequest = {
                    response_type: response_type,
                    me: me,
                    client_id: client_id,
                    redirect_uri: redirect_uri,
                    state: state,
                    scopes: scopes
                };

                console.log("session");
                console.log(req.session);

                let iconUrl = body.icons[0].src;
                // if (iconUrl.indexOf('http') === -1) {
                //     iconUrl = client_id + iconUrl;
                // }

                res.render("indieauth/authorization", {
                    app: {
                        name: body.name,
                        logo: iconUrl
                    },
                    me: req.session.username,
                    client_id: client_id,
                    scopes: scopes
                });
            });
            return;
        }

        let appInfo = $(".h-app");
        let clientApp = {};

        if (appInfo.length == 0) {
            appInfo = $(".h-x-app");
        }

        if (appInfo != null) {
            if (appInfo.find('.u-url').attr('href') === '' || appInfo.find('.u-url').attr('href') === '/') {
                let appName = appInfo.find('.p-name').text();
                if (appName == '') {
                    appName = appInfo.find('.p-name').parent().text();
                }

                clientApp = {
                    name: appName,
                    logo: appInfo.find('.u-logo').attr('src')
                };
            }
        };

        // todo: We need to use Cheerio to find the redirect_uri rel
        // todo: Check to see if redirect_uri is part of the client_id's domain
        // todo: If redirect_uri is NOT part of the client_id's domain, check if it is in the redirect array
        // let redirectUris = data.rels.redirect_uri;
        // todo: if redirect_uri is not official, reject it

        let scopes = [
            {
                id: 'id',
                name: `Identify you as Eddie Hinkle (${req.session.username})`
            }
        ];

        req.session.indieAuthRequest = {
            response_type: response_type,
            me: me,
            client_id: client_id,
            redirect_uri: redirect_uri,
            state: state,
            scopes: scopes
        };

        console.log("session");
        console.log(req.session);

        res.render("indieauth/authorization", {
            app: clientApp,
            me: req.session.username,
            client_id: client_id,
            scopes: scopes
        });

    });

};