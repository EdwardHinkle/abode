import * as express from 'express';
import * as path from 'path';

export let staticSiteRouter = express.Router();

// Routes
let PublicPrivateSite = (req, res, next) => {
    if (req.session.username === undefined) {
        express.static(path.join(__dirname, '../../jekyll/_build/'))(req, res, next);
    } else {
        express.static(path.join(__dirname, '../../jekyll/_private_build/'))(req, res, next);
    }
};
staticSiteRouter.use('/', PublicPrivateSite);