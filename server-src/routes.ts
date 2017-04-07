import * as express from "express";

// import sub-routers
import { micropubRouter } from './micropub';
import { staticSiteRouter } from './static-site';
import { processRouter } from './process-server';

export let router = express.Router();

router.use('/', staticSiteRouter);
router.use('/abode', processRouter);
router.use('/micropub', micropubRouter);