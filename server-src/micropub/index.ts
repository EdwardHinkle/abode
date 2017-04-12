import * as express from "express";
import * as micropub from 'micropub-express';
import * as MicropubFormatter from 'format-microformat';
import * as moment from 'moment';
import * as fs from 'fs';
import * as path from 'path';

var config = require('../../abodeConfig.json');

export let micropubRouter = express.Router();
let formatter = new MicropubFormatter();

// Routes
micropubRouter.use('/', micropub({
	tokenReference: {
		me: config.micropub.authenticationEndpoint,
		endpoint: config.micropub.tokenEndpoint
	},
	handler: micropubHandler
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
		return { url: "https://eddiehinkle.com/now" };
	});
// 	return formatter.preFormat(micropubDocument)
//   .then(function (preFormatted) {
// 		return Promise.all([
// 			formatFilename(preFormatted),
// 			formatter.formatURL(preFormatted),
// 			formatter.format(preFormatted)
// 		]);
//   	})
// 	.then(function (formatted) {

// 		var filename = formatted[0];
// 		var contentUrl = formatted[1];
// 		var fileContent = formatted[2];
		
// 		console.log("Formatted Micropub");
// 		console.log(formatted);
// 		fs.writeFile(__dirname + "/../savedDocuments/" + filename, fileContent, (err) => {
// 			if(err) {
// 				return console.log(err);
// 			}

// 			console.log("The file was saved!");
// 		}); 
	// 	return { url: "https://eddiehinkle.com/now" };
	// });
}

function formatFilename(preformattedData) {
	return new Promise((resolve, reject) => {
		console.log("Formatting Filename");
		console.log(preformattedData);
		var slug = (preformattedData.mp != undefined && preformattedData.mp.slug != undefined) ? preformattedData.mp.slug[0] : preformattedData.properties.slug[0];
		if (preformattedData.type[0] == "h-entry") {
			var publishedDate = preformattedData.properties.published[0];
			if (preformattedData.properties['in-reply-to'] != undefined && preformattedData.properties['in-reply-to'].length > 0) {
				resolve("_note/reply/" + formatFileSlug(publishedDate, slug));
			}
			else if (preformattedData.properties['like-of'] != undefined && preformattedData.properties['like-of'].length > 0) {
				resolve("_note/like/" + formatFileSlug(publishedDate, slug));
			}
			else if (preformattedData.properties['repost-of'] != undefined && preformattedData.properties['repost-of'].length > 0) {
				resolve("_note/repost/" + formatFileSlug(publishedDate, slug));
			}
		}
	});
}

function formatFileSlug(date, slug) {
	return moment(date).format("Y-MM-DD") + "-" + slug + ".md";
}