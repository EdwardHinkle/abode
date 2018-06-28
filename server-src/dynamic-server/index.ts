import * as express from 'express';
import * as path from 'path';
import * as fs from "fs";

export let dynamicRouter = express.Router();

dynamicRouter.get('/testDynamic', (req, res, next) => {
    res.send('hello world')
});