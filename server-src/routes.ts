import * as express from "express";

// import sub-routers
import { micropubRouter } from './micropub';
import { staticSiteRouter } from './static-site';
import { webmentionRouter } from './webmentions';
import { mediaServerRouter } from './media-server';
import { authRouter } from './auth';
import { dynamicRouter } from './dynamic-server';
import {resumeRouter} from "./resume";
import { sponsorRouter } from "./sponsor";
import {locationRouter} from "./location";
import { loginRouter } from "./login";
import { Card } from "./model/card.model";

export let router = express.Router();

router.use((req, res, next) => {
    res.locals.username = req.session.username;
    res.locals.user = new Card(req.session.user);
    next();
});

router.use('/', resumeRouter);
router.use('/', loginRouter);
router.use('/auth', authRouter);
router.use('/media', mediaServerRouter);
router.use('/micropub', micropubRouter);
router.use('/webmention', webmentionRouter);
router.use('/location', locationRouter);
router.use('/sponsor', sponsorRouter);
router.use('/', dynamicRouter);
router.use('/', staticSiteRouter);