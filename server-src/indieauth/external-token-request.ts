import * as requestPromise from "request-promise";
import {ResponseType} from "./response-type.model";
import {getTokenInfo} from "./tokens";
import {UrlUtility} from "../utilities/url.utility";

export let externalTokenRequest = (req, res, next) => {

    let response_type: ResponseType = req.body.response_type;

    if (response_type !== 'external_token') {
        next();
        return;
    }

    let config = req.app.get('config');
    let target_url: string = req.body.target_url;
    let state: string = req.body.state;
    let scope: string = req.body.scope;
    let callback_url: string = req.body.callback_url;
    let access_token = req.headers.authorization.split("Bearer ").pop();

    if (callback_url === undefined) {
        console.log('request missing callback_url');
        res.status(400).json({ error: "Missing callback_url" });
        return;
    }

    if (access_token === undefined) {
        console.log('request missing Authorization token');
        res.status(401).json({ error: "Missing Authorization" });
        return;
    }

    if (state === undefined) {
        console.log('missing state');
        res.status(400).json({ error: "Missing state" });
        return;
    }

    if (scope === undefined) {
        console.log('missing scope');
        res.status(400).json({ error: "Missing scope "});
        return;
    }

    if (target_url === undefined) {
        console.log('missing target_url');
        res.status(400).json({ error: "Missing target_url" });
        return;
    }

    getTokenInfo(access_token, config).then(tokenInfo => {

        if (tokenInfo.scope.indexOf("external_token:read") === -1) {
            res.status(401).json({ error: "Invalid scope "});
        }

        res.status(202).send('AutoAuth request is valid');

        // TODO: WE NEED TO GENERATE AN AUTHORIZATION CODE
        let authorization_code = 'THIS NEEDS TO BE A CODE';

        // We need to get the access_token for the target_url
        let gettingAccessToken = getTokenEndpointForURL(target_url);

        // TODO: I need to figure out how to automate the retrieval of requested scopes rather than hard-code
        let requestedScopes = ["read"];

        // TODO: Create random state
        let external_state = "testing_state";

        gettingAccessToken.then(tokenEndpoint => {
            let externalPayload = {
                grant_type: 'authorization_code' as OAuthGrantType,
                code: authorization_code,
                root_uri: UrlUtility.getDomainFromUrl(target_url),
                scope: requestedScopes,
                state: external_state,
                callback_url: "https://eddiehinkle.com/auth?action=external_callback",
                me: "https://eddiehinkle.com/",
                client_id: "https://eddiehinkle.com/auth"
            };

            return requestTokenFromExternalServer(tokenEndpoint, externalPayload).then(body => {
                console.log(`request to external token endpoint ${tokenEndpoint} succeeded`);
            }).catch(error => {
                console.log(`request to external token endpoint ${tokenEndpoint} failed`);
                console.log(externalPayload);
                console.log(error);
            });
        });

        // TODO: Proceed through requests for https://github.com/sknebel/AutoAuth/blob/test_reorder/AutoAuth.md#obtaining-an-access-token-for-the-resource

    }, error => {
        res.status(400).json({ error: error });
        return;
    });

};

export let getTokenEndpointForURL = (url: string): Promise<string> => {
    return new Promise(resolve => {
        resolve("");
    });
};

export let requestTokenFromExternalServer = (tokenEndpoint: string, requestInfo: AutoAuthTokenRequestExternal) => {
    let info = requestInfo as any;
    info.scope = info.scope.join(" ");
    let requestPayload = info as AutoAuthTokenRequestExternalPayload;

    return requestPromise.post(`${tokenEndpoint}`, {
        form: requestPayload,
        json: true
    }).then(tripData => {
        return tripData;
    });
};

export interface AutoAuthTokenRequestExternal {
    grant_type: OAuthGrantType;
    code: string;
    root_uri: string;
    scope: string[];
    state: string;
    callback_url: string;
    me: string;
    client_id: string;
    realm?: string;
}

export interface AutoAuthTokenRequestExternalPayload {
    grant_type: OAuthGrantType;
    code: string;
    root_uri: string;
    scope: string;
    state: string;
    callback_url: string;
    me: string;
    client_id: string;
    realm?: string;
}

export type OAuthGrantType = 'authorization_code';