import * as express from 'express';
import {dynamicRouter} from "../dynamic-server";
import {ResumeController} from "./resumeController";

export let resumeRouter = express.Router();

resumeRouter.get('/resume', ResumeController.resumeRoute);

