import * as express from "express";
import * as micropub from 'micropub-express';
import * as moment from 'moment';
import * as fs from 'fs';
import * as path from 'path';
import { convertSavedJsonToMarkdown } from './convert';
import { convertMicropubToJekyll } from './handle';
import { getMicropubConfig } from './config';
import { getMediaEndpointRequest } from './mediaEndpoint';
import {Posts} from "../model/posts.model";

var config = require('../../abodeConfig.json');
let dataDir = __dirname + "/../../jekyll/_source";
let imageDir = `${dataDir}/images`;
let entryImageDirName = `entry-images`;

export let micropubRouter = express.Router();

var multer  = require('multer');
var upload = multer({ dest: `${__dirname}/../../media-server-storage/` });

// Routes
// micropubRouter.get('/local', convertSavedJsonToMarkdown);
micropubRouter.post('/media', upload.single('file'), getMediaEndpointRequest);

micropubRouter.get('/', (req, res, next) => {
	if (req.query.q !== 'source') {
		next();
		return;
	}

    let thisYear = moment().format("YYYY");
    let thisMonth = moment().format("MM");

    Posts.getPosts({
        year: thisYear,
        month: thisMonth
    }).then(posts => {

    	if (req.query['post-type'] !== undefined) {
    		posts = posts.filter(post => post.getPostType().toLowerCase() === req.query['post-type']);
		}

        res.json({ "items": posts.map(post => post.toMf2()) });
	});
});

micropubRouter.use('/', micropub({
	tokenReference: {
		me: config.micropub.authenticationEndpoint,
		endpoint: config.micropub.tokenEndpoint
	},
	handler: convertMicropubToJekyll,
	queryHandler: getMicropubConfig
}));

// Support Functions
function micropubHandler(micropubDocument, req) {
	console.log("Micropub Retrieved");
	var writeJson = JSON.stringify(micropubDocument, null, 2);

	fs.writeFile(path.join(__dirname, '../../log-files/' + moment().unix() + '.json'), writeJson, (err) => {
		if(err) {
			return console.log(err);
		}

		console.log("The file was saved!");
	}); 

    return Promise.resolve().then(function () {
		return { url: "https://eddiehinkle.com/404" };
	});

}