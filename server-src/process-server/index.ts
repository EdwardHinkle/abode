import * as express from 'express';
import * as path from 'path';
import { rebuildServer } from './rebuildServer';

export let processRouter = express.Router();

// Routes
processRouter.get('/rebuild', rebuildServer);