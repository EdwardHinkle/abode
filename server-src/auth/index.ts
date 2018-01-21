import * as express from 'express';
import * as path from 'path';
import * as bcrypt from 'bcrypt';
import * as fs from "fs";
import * as indieAuth from '../indieauth';

const AUTH_FILE_PATH = `${__dirname}/../../_storage/auth`;

export let authRouter = express.Router();

let requireAuth = (req, res, next) => {
    if (req.session.username === undefined) {
        console.log(req.baseUrl + req.url);
        req.session.returnTo = req.baseUrl + req.url;
        res.redirect("/auth/login");
    } else {
        next();
    }
};

let requireUnauth = (req, res, next) => {
    if (req.session.username !== undefined) {
        res.redirect("/");
    } else {
        next();
    }
};

// Routes that require unauthentication
authRouter.get('/login', requireUnauth, (req, res, next) => {
    res.render('login');
});

authRouter.post('/login', requireUnauth, (req, res, next) => {

    let hash = fs.readFileSync(AUTH_FILE_PATH, { encoding: 'utf8' });
    bcrypt.compare(req.body.password, hash, function(err, doesMatch){
        if (doesMatch){
            let returnTo = req.session.returnTo || '/';
            delete req.session.returnTo;
            req.session.username = "https://eddiehinkle.com/";
            console.log(`Finished authenticating redirect to ${returnTo}`);
            res.redirect(returnTo);
        }else{
            res.render('login', { error: "Sorry, wrong password" });
        }
    });

});

// Routes that require authentication
authRouter.get('/', requireAuth, indieAuth.authenticationEndpoint, indieAuth.authorizationEndpoint);
authRouter.post('/', requireAuth, indieAuth.verificationEndpoint);
authRouter.post('/deny', requireAuth, indieAuth.denyRequest);
authRouter.post('/approve', requireAuth, indieAuth.approveRequest);

authRouter.get('/logout', (req, res, next) => {
    if (req.session.username === undefined) {
        res.send('Already logged out');
        return;
    }
    
    req.session.destroy((err) => {
        res.redirect('/');
    });
});

authRouter.get('/newPassword', requireAuth, (req, res, next) => {
    res.render('newPassword');
});

authRouter.post('/newPassword', requireAuth, (req, res, next) => {
    bcrypt.hash(req.body.password, 10, function( err, bcryptedPassword) {
        if (err) {
            console.log(err);
            res.send("Error");
            return;
        }
        fs.writeFile(AUTH_FILE_PATH, bcryptedPassword, function(err) {
            if (err) {
                console.log(err);
                res.send("Error");
                return;
            }

            res.send("New Password Saved");
        });
    });
});