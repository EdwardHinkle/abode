import * as express from 'express';
import * as path from 'path';

export let staticSiteRouter = express.Router();

// Routes
let PublicPrivateSite = (req, res, next) => {
    console.log("Logged in?");
    console.log(req.session.username);
    if (req.session.username === undefined) {
        console.log("Public build");
        express.static(path.join(__dirname, '../../jekyll/_build/'))(req, res, next);
    } else {
        console.log("Private build");
        express.static(path.join(__dirname, '../../jekyll/_private_build/'))(req, res, next);
    }
};
staticSiteRouter.use('/', PublicPrivateSite);