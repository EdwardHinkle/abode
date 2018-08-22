import * as express from 'express';
import {dynamicRouter} from "../dynamic-server";
import {ResumeController} from "./resumeController";
import * as path from "path";

export let resumeRouter = express.Router();

resumeRouter.use('/resume/images/', express.static(path.join(__dirname, '../../resources/resume-images/')));
resumeRouter.get('/resume', ResumeController.resumeRoute);