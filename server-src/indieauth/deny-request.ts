import {ResponseType} from "./response-type.model";

import * as mf from 'microformat-node';
import * as Cheerio from 'cheerio';
import * as request from 'request';

// let mf = require('microformats-node');

export let denyRequest = (req, res, next) => {

    if (req.session.indieAuthRequest === undefined || req.session.indieAuthRequest.redirect_uri === undefined) {
        console.log('Either no IndieAuth Request or no Redirect URI');
        next()
    }

    let requestInfo = req.session.indieAuth;
    let redirectUrl = requestInfo.redirect_uri + (requestInfo.redirect_uri.indexOf('?') > -1 ? '?' : '&') + 'error=access_denied';

    delete req.session.indieAuth;
    res.redirect(redirectUrl);

};