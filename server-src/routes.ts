import * as express from "express";

// import sub-routers
import { micropubRouter } from './micropub';
import { staticSiteRouter } from './static-site';

export let router = express.Router();

router.use('/', staticSiteRouter);
// router.use('/micropub', micropubRouter);