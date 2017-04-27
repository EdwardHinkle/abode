import * as MicropubFormatter from 'format-microformat';
import * as moment from 'moment';
import * as fs from 'fs';
import * as path from 'path';
import * as http from 'http';
import * as git from '../git';
import * as jekyll from '../jekyll';
import * as _ from 'lodash';

var config = require('../../abodeConfig.json');
var dataDir = __dirname + "/../../jekyll/_source/";

let formatter = new MicropubFormatter();

// Support Functions
export function convertMicropubToJekyll(micropubDocument, req): Promise<any> {
	console.log("Micropub Retrieved");
    console.log(micropubDocument);

    // This section is mainly to log everything for debugging later
    var writeJson = JSON.stringify(micropubDocument, null, 2);

    fs.writeFile(path.join(__dirname, '../../log-files/' + moment().format("YYYY-MM-DD-HH:mm:ss") + '.json'), writeJson, (err) => {
        if(err) {
            return console.log(err);
        }
    });
    // This is the end of the debugging section


    if (micropubDocument.properties.checkin != undefined || micropubDocument.properties.drank != undefined) {

        return git.runGitPull().then(() => {

            return preparePostInfo(micropubDocument).then(function(postInfo){
                
                formatter.preFormat(micropubDocument)
                    .then(function (preFormatted) {
                        preFormatted.postInfo = postInfo;
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
                        fs.writeFile(filename, fileContent, (err) => {
                            if(err) {
                                return console.log(err);
                            }

                            console.log("The file was saved!");
                        }); 
                    })
                    .then((results) => {
                        // All tasks are done, we can restart the jekyll server, etc.
                        console.log("Rebuild ready...");

                        git.runGitStageAll()
                        .then(() => { return git.runGitCommit(); })
                        .then(() => { return git.runGitPush(); })
                        .then(() => { return jekyll.runJekyllBuild(); })
                        .catch((error) => {
                            console.log("Caught Error");
                            console.log(error);
                        });
                        return;
                        
                    });

                    micropubDocument.postInfo = postInfo;
                    return formatUrl(micropubDocument).then(function(returnUrl) {
                        return { url: returnUrl };
                    });

                });

        });
        
    } else {
        console.log("Non-checkin Micropub Recieved...check the log files");

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
            contentString += "content-type: text/markdown\n";
            if (preformattedData.client_id) {
                contentString += "client_id: " + preformattedData.client_id + "\n";
            }
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

            if (properties.drank != undefined && properties.drank.length > 0) {
                var drank = properties.drank[0].properties;
                contentString += "  drank:\n";
                contentString += "    type: h-food\n";
                contentString += "    properties:\n";
                for (let key in drank) {
                    var value: String;
                    if (key == "latitude" || key == "longitude") {
                        value = drank[key];
                    } else {
                        value = '"' + drank[key] + '"';
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

            if (properties.category == undefined) {
                properties.category = [];
            }

            if (properties.checkin != undefined && properties.checkin.length > 0) {   
                properties.category.push("checkin");
            }

            if (properties.drank != undefined && properties.drank.length > 0) {   
                properties.category.push("drank");
            }
               
            if (properties.category != undefined && properties.category.length > 0) {
                contentString += "tags:\n";
                for (let tag of properties.category) {
                    contentString += "  - " + tag + "\n";
                }
            }

            if (properties.location != undefined && properties.location.length > 0) {
                contentString += "location:\n";
                for (let location of properties.location) {
                    if (typeof location == "string") {
                        var geoInfo = location.split("geo:").pop();
                        var locInfo = geoInfo.split(";");
                        var locArray = locInfo[0].split(",");
                        if (locArray.length > 0) {
                            var locationObject = {
                                uncertainty: locInfo[1].split("=").pop(),
                                latitude: locArray[0],
                                longitude: locArray[1]
                            }
                        
                            contentString += "  type: h-adr\n";
                            contentString += "  properties:\n";
                            for (let key in locationObject) {
                                var value: String;
                                if (key == "latitude" || key == "longitude" || key == "uncertainty") {
                                    value = locationObject[key];
                                } else {
                                    value = '"' + locationObject[key] + '"';
                                }
                                contentString += "    " + key + ": " + value + "\n";
                            }
                        }
                    }
                }
            }

            let slug = preformattedData.postInfo.postIndex;
            contentString += "slug: \"" + slug + "\"\n";
            if (preformattedData.properties['checkin'] != undefined && preformattedData.properties['checkin'].length > 0) {
                contentString += "permalink: /:year/:month/:day/:slug/checkin/\n";
            }
            else if (preformattedData.properties['drank'] != undefined && preformattedData.properties['drank'].length > 0) {
                contentString += "permalink: /:year/:month/:day/:slug/drank/\n";
            }
            

            contentString += '---\n';
            if (properties.content != undefined && properties.content.length > 0) {
                contentString += properties.content[0];
            }
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
        let day = moment(properties.published[0]).format("DD");
        
        var yearDir = dataDir + "_note/" + year + "/";
        var monthDir = yearDir + month + "/";
        var dayDir = monthDir + day + "/";
        
        let slug = (preformattedData.mp != undefined && preformattedData.mp.slug != undefined) ? preformattedData.mp.slug[0] : preformattedData.postInfo.postIndex;

        if (preformattedData.properties['checkin'] != undefined && preformattedData.properties['checkin'].length > 0) {
            resolve('https://eddiehinkle.com/' + year + "/" + month + "/" + day + "/" + slug + "/" + "checkin/");
        }
        else if (preformattedData.properties['drank'] != undefined && preformattedData.properties['drank'].length > 0) {
            resolve('https://eddiehinkle.com/' + year + "/" + month + "/" + day + "/" + slug + "/" + "drank/");
        }
    });
}

function formatFilename(preformattedData) {
	return new Promise((resolve, reject) => {
		console.log("Formatting Filename");
		console.log(preformattedData);
		let properties = preformattedData.properties;
        let year = moment(properties.published[0]).format("YYYY");
        let month = moment(properties.published[0]).format("MM");
        let day = moment(properties.published[0]).format("DD");

        var yearDir = dataDir + "_note/" + year + "/";
        var monthDir = yearDir + month + "/";
        var dayDir = monthDir + day + "/";
        
        var postDir = dayDir + preformattedData.postInfo.postIndex + "/";
        if (!fs.existsSync(postDir)) {
            fs.mkdirSync(postDir);
            console.log(postDir + " created");
        }
        
        let slug = (preformattedData.mp != undefined && preformattedData.mp.slug != undefined) ? preformattedData.mp.slug[0] : preformattedData.postInfo.postIndex;
        
		if (preformattedData.type[0] == "h-entry") {
			var publishedDate = preformattedData.properties.published[0];
			if (preformattedData.properties['in-reply-to'] != undefined && preformattedData.properties['in-reply-to'].length > 0) {
				resolve(dataDir + "_note/reply/" + formatFileSlug(publishedDate, slug));
			}
			else if (preformattedData.properties['like-of'] != undefined && preformattedData.properties['like-of'].length > 0) {
				resolve(dataDir + "_note/likes/" + formatFileSlug(publishedDate, slug));
			}
			else if (preformattedData.properties['repost-of'] != undefined && preformattedData.properties['repost-of'].length > 0) {
				resolve(dataDir + "_note/repost/" + formatFileSlug(publishedDate, slug));
			}
			else if (preformattedData.properties['checkin'] != undefined && preformattedData.properties['checkin'].length > 0) {
				resolve(postDir + "post.md");
            }
			else if (preformattedData.properties['drank'] != undefined && preformattedData.properties['drank'].length > 0) {
				resolve(postDir + "post.md");
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

function preparePostInfo(preformattedData) {
    return new Promise((resolve, reject) => {
        let properties = preformattedData.properties;
        let year = moment(properties.published[0]).format("YYYY");
        let month = moment(properties.published[0]).format("MM");
        let day = moment(properties.published[0]).format("DD");
        
        var postIndex = 1;
        var yearDir = dataDir + "_note/" + year + "/";
        if (!fs.existsSync(yearDir)) {
            fs.mkdirSync(yearDir);
            console.log(yearDir + " created");
        }
        var monthDir = yearDir + month + "/";
        if (!fs.existsSync(monthDir)) {
            fs.mkdirSync(monthDir);
            console.log(monthDir + " created");
        }
        var dayDir = monthDir + day + "/";
        if (!fs.existsSync(dayDir)) {
            fs.mkdirSync(dayDir);
            console.log(dayDir + " created");
        } else {
            var dirContents = fs.readdirSync(dayDir);
            dirContents = _.filter(dirContents, (filename) => {
                return fs.statSync(dayDir + "/" + filename).isDirectory();
            });
            postIndex = dirContents.length + 1;
        }
        
        resolve({ postIndex: postIndex });
    });
}