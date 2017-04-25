import * as MicropubFormatter from 'format-microformat';
import * as moment from 'moment';
import * as fs from 'fs';
import * as path from 'path';
import * as http from 'http';
import * as git from '../git';
import * as jekyll from '../jekyll';

var config = require('../../abodeConfig.json');

let formatter = new MicropubFormatter();

// Support Functions
export function convertMicropubToJekyll(micropubDocument, req): Promise<any> {
	console.log("Micropub Retrieved");
    console.log(micropubDocument);

    if (micropubDocument.properties.checkin != undefined) {

        git.runGitPull().then(() => {

            return formatter.preFormat(micropubDocument)
            .then(function (preFormatted) {
                return Promise.all([
                    formatFilename(preFormatted),
                    formatUrl(preFormatted),
                    formatContent(preFormatted)
                ]);
            })
            .then(function (formatted) {

                var filename = formatted[0];
                var contentUrl = formatted[1];
                var fileContent = formatted[2];
                
                console.log("Formatted Micropub");
                console.log(filename);
                console.log(contentUrl);
                console.log(formatted);
                fs.writeFile(__dirname + "/../../jekyll/_source/" + filename, fileContent, (err) => {
                    if(err) {
                        return console.log(err);
                    }

                    console.log("The file was saved!");
                }); 
                return { url: contentUrl };
            })
            .then((results) => {
                // All tasks are done, we can restart the jekyll server, etc.
                console.log("Rebuild ready...");

                return jekyll.runJekyllBuild()
                .then(() => { return git.runGitStageAll(); })
                .then(() => { return git.runGitCommit(); })
                .then(() => { return git.runGitPush(); })
                .then(() => {
                    return results;
                }).catch((error) => {
                    console.log("Caught Error");
                    console.log(error);
                    return {}
                });
                
            });

        });

        
    } else {
        var writeJson = JSON.stringify(micropubDocument, null, 2);

        fs.writeFile(path.join(__dirname, '../../log-files/' + moment().unix() + '.json'), writeJson, (err) => {
            if(err) {
                return console.log(err);
            }

            console.log("Non-checkin Micropub Recieved");
        }); 

        return Promise.resolve().then(function () {
            return { url: "https://eddiehinkle.com/404" };
        });
    }
}

function formatContent(preformattedData): Promise<any> {
    return new Promise((resolve, reject) => {

        if (preformattedData.type[0] == "h-entry") {
            var properties = preformattedData.properties;

            var contentString =  '---\n';
            contentString += "date: " + moment(properties.published[0]).format("YYYY-MM-DD HH:mm:ss ZZ") + "\n";
            contentString += "layout: entry\n";
            if (properties.title == undefined) {
                contentString += "title: \"\"\n";
            } else {
                contentString += "title: " + properties.title[0] + "\n";
            }
            
            contentString += "properties:\n";

            if (properties.checkin != undefined && properties.checkin.length > 0 && properties.checkin[0].type == "h-card") {
                var checkin = properties.checkin[0].properties;
                contentString += "  checkin:\n";
                contentString += "    type: " + properties.checkin[0].type + "\n";
                contentString += "    properties:\n";
                for (let key in checkin) {
                    var value: String;
                    if (key == "latitude" || key == "longitude") {
                        value = checkin[key];
                    } else {
                        value = '"' + checkin[key] + '"';
                    }
                    contentString += "      " + key + ": " + value + "\n";
                }
            }

            // if (properties['like-of'] != undefined && properties['like-of'].length > 0) {
			// 	contentString += "  like-of:\n";
            //     for (let like of properties['like-of']) {
            //         contentString += "    type: h-cite\n";
            //         contentString += "    properties:\n";
            //         contentString += "      url:" + like + "\n";
            //         //http://pin13.net/mf2/?url=
            //         //contentString += "    - " + like + "\n";
            //     }
                // like-of:
                //     type: h-cite
                //     properties:
                //         url: https://aaronparecki.com/2017/03/17/16/day-87-quill
                //         name: "Day 87: Docs for Favorites in Quill #100DaysOfIndieWeb"
                //         author:
                //             type: h-card
                //             properties:
                //                 name: "Aaron Parecki"
                //                 url: https://aaronparecki.com
                //                 photo: "https://webmention.io/avatar/aaronparecki.com/2b8e1668dcd9cfa6a170b3724df740695f73a15c2a825962fd0a0967ec11ecdc.jpeg"
			//}
            
            if (properties.photo != undefined && properties.photo.length > 0) {
                contentString += "  photo:\n";
                for (let photo of properties.photo) {
                    contentString += "    - " + photo + "\n";
                }
            }
            
            if (properties.syndication != undefined && properties.syndication.length > 0) {
                contentString += "  syndication:\n";
                for (let syndicated of properties.syndication) {
                    var syndicatedName: String, syndicatedIcon: String;
                    if (syndicated.indexOf("swarmapp.com") > -1) {
                        syndicatedName = "Swarm";
                        syndicatedIcon = "fa-foursquare"
                    }
                    contentString += "    - name: \"" + syndicatedName + "\"\n";
                    contentString += "      icon: " + syndicatedIcon + "\n";
                    contentString += "      url: " + syndicated + "\n";
                }
            }

            if (properties.category != undefined && properties.category.length > 0) {
                if (properties.checkin != undefined && properties.checkin.length > 0) {
                    properties.category.push("checkin");
                }
                
                if (properties.category != undefined && properties.category.length > 0) {
                    contentString += "tags:\n";
                    for (let tag of properties.category) {
                        contentString += "  - " + tag + "\n";
                    }
                }
            }

            contentString += "permalink: /:year/:month/:title/checkin/\n";
            contentString += '---\n' + properties.content[0];
            resolve(contentString);
        } else {
            reject("Unrecognized Type " + preformattedData.type);
        }

    });
}

function formatUrl(preformattedData): Promise<any> {
	return new Promise((resolve, reject) => {
        console.log("Formatting URL");
        let properties = preformattedData.properties;
        let year = moment(properties.published[0]).format("YYYY");
        let month = moment(properties.published[0]).format("MM");
        let slug = (preformattedData.mp != undefined && preformattedData.mp.slug != undefined) ? preformattedData.mp.slug[0] : preformattedData.properties.slug[0];
        resolve('https://eddiehinkle.com/' + year + "/" + month + "/" + slug + "/" + "checkin/");
    });
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
				resolve("_note/likes/" + formatFileSlug(publishedDate, slug));
			}
			else if (preformattedData.properties['repost-of'] != undefined && preformattedData.properties['repost-of'].length > 0) {
				resolve("_note/repost/" + formatFileSlug(publishedDate, slug));
			}
			else if (preformattedData.properties['checkin'] != undefined && preformattedData.properties['checkin'].length > 0) {
				resolve("_note/checkins/" + formatFileSlug(publishedDate, slug));
            } else {
                formatter.formatFilename(preformattedData).then(function(data){
                    resolve(data);
                });
            }
		}
	});
}

function formatFileSlug(date, slug) {
	return moment(date).format("Y-MM-DD") + "-" + slug + ".md";
}