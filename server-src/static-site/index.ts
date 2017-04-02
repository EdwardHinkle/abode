import * as express from 'express';
import * as path from 'path';

export let staticSiteRouter = express.Router();

// Routes
staticSiteRouter.use('/', express.static(path.join(__dirname, '../../jekyll/_build/')))