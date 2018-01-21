import * as jwt from "jsonwebtoken";

var config = require('../../abodeConfig.json');

export let approveRequest = (req, res, next) => {

    let requestInfo = req.session.indieAuthRequest;

    if (requestInfo === undefined || requestInfo.redirect_uri === undefined) {
        console.log('Either no IndieAuth Request or no Redirect URI');
        next()
    }

    console.log("Request Info");
    console.log(requestInfo);

    const payload = {
        client_id: requestInfo.client_id,
        redirect_uri: requestInfo.redirect_uri,
        me: requestInfo.me,
        state: requestInfo.state,
        id: new Date().getTime(),
        scope: undefined
    };

    if (requestInfo.response_type == 'code' && requestInfo.scopes.length > 1) {
        payload.scope = requestInfo.scopes.map(scope => scope.id).filter(scope => scope !== 'id')
    }

    console.log('jwt payload');
    console.log(payload);

    let token = jwt.sign(payload, config.jwt_secret, {
        expiresIn: 120 // expires in 2 minutes
    }, null);

    let redirectUrl = requestInfo.redirect_uri + (requestInfo.redirect_uri.indexOf('?') > -1 ? '?' : '&') + `code=${token}`;
    if (requestInfo.state !== undefined) {
        redirectUrl += `&state=${requestInfo.state}`;
    }

    delete req.session.indieAuth;

    res.redirect(302, redirectUrl);

};