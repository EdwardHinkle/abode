import * as express from 'express';
import * as path from 'path';

export let mediaServerRouter = express.Router();

// Routes
mediaServerRouter.use('/', express.static(path.join(__dirname, '../../media-server-storage/')))