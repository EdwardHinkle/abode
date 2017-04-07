import * as express from 'express';
import * as path from 'path';
import { rebuildServer, refreshServer } from './rebuildServer';

export let processRouter = express.Router();

// Routes
processRouter.get('/rebuild', rebuildServer);
processRouter.get('/refresh', refreshServer);