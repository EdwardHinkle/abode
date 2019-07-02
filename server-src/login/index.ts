import * as express from 'express';
import * as request from 'request-promise';
import * as cheerio from 'cheerio';
import { Card } from "../model/card.model";
const base64url = require('base64url');
const sjcl = require('sjcl');

export let loginRouter = express.Router();

loginRouter.get('/login', loginPage);
loginRouter.post('/login', handleLogin);
loginRouter.get('/login/code', handleAuthorizationCode);
loginRouter.get('/logout', logoutUser);

function logoutUser(req, res, next) {
    req.session.destroy();
    res.redirect("/");
}

function loginPage(req, res, next) {
    let referrer = req.get('Referrer');
    if (referrer.indexOf('https://eddiehinkle.com') > -1) {
        req.session.accessingUrl = referrer;
    }
    res.render('login/sign-in')
}

function handleLogin(req, res, next) {
    
    let profileId = req.body.me;
    req.session.profile = profileId;
    
    if (!profileId) {
        res.send("No url provided");
        return;
    }
    
    if (profileId.indexOf("@") > -1) {
        // This is an email, use email sign in
    }
    
    if (profileId.indexOf("twitter.com") > -1) {
        // This is a twitter login
    }
    
    // If we get here, it must be an indieweb website
    discoverEndpoints(profileId)
    .then(authorization_endpoint => {
        req.session.authorization_endpoint = authorization_endpoint;
        req.session.state = randomString(25);
        req.session.code_verifier = randomString(128);
        
        res.redirect(`${authorization_endpoint}?me=${profileId}&client_id=https://eddiehinkle.com/login&redirect_uri=https://eddiehinkle.com/login/code&state=${req.session.state}&response_type=id&code_challenge_method=S256&code_challenge=${base64url.encode(sjcl.hash.sha256.hash(req.session.code_verifier))}`);
    }).catch(error => {
        res.send(`Oops Error! ${error}`);
    })
}

function handleAuthorizationCode(req, res, next) {
    if (req.query.state !== req.session.state) {
        res.send('The state does not match. This is an invalid session.');
        return;
    }

    let code = req.query.code;
    request({
        method: 'POST',
        uri: req.session.authorization_endpoint,
        form: {
            code: code,
            client_id: 'https://eddiehinkle.com/login',
            redirect_uri: 'https://eddiehinkle.com/login/code',
            code_verifier: req.session.code_verifier
        },
        headers: {
            'Accept': 'application/json'
        },
        transform: body => JSON.parse(body)
    })
    .then(body => {
        if (body.me === undefined) {
            res.send('Error: Missing me url');
        }
        
        if (body.me.indexOf(req.session.profile) > -1) {
            req.session.username = body.me;
            let waitingOnCard = Card.loadCard(body.me);
            waitingOnCard.then(card => {
                if (card !== undefined) {
                    req.session.user = card.toData();
                } else {
                    let nocard = new Card();
                    nocard.properties.name = [body.me];
                    nocard.properties.uid = body.me;
                    nocard.properties.url = [body.me];
                    req.session.user = nocard.toData();
                }
                if (req.session.accessingUrl) {
                    res.redirect(req.session.accessingUrl);
                } else {
                    res.redirect('/');
                }
            }).catch(error => res.send(`Error: ${error}`));
        } else {
            res.send('Error: The me url does not match the original');
        }
    })
    .catch(error => {
        res.send(`Error: ${error}`);
    });
}

function discoverEndpoints(profileUrl: string): Promise<string> {
    return request({
        uri: profileUrl,
        resolveWithFullResponse: true
    })
    .then(response => {
        let authorization_endpoint;
        
        let headerLink = response.headers['Link'];
        if (headerLink) {
            headerLink.split(",").some(link => {
                if (link.indexOf('rel="authorization_endpoint"') > -1) {
                    authorization_endpoint = link.split(">").shift().split("<").pop()
                    return true;
                }
            });
            return authorization_endpoint;
        }
        
        let $ = cheerio.load(response.body);
        authorization_endpoint = $('link[rel="authorization_endpoint"]').attr('href');
        return authorization_endpoint;
    })
    .catch(error => {
        
    });
}

function randomString(length) {
   var result           = '';
   var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
   var charactersLength = characters.length;
   for ( var i = 0; i < length; i++ ) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
   }
   return result;
}
