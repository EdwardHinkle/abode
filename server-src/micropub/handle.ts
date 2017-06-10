import * as MicropubFormatter from 'format-microformat';
import * as moment from 'moment';
import * as fs from 'fs';
import * as path from 'path';
import * as http from 'http';
import * as git from '../git';
import * as jekyll from '../jekyll';
import * as _ from 'lodash';
import * as mfTypes from '../mf2';
import * as yaml from 'js-yaml';
import * as toMarkdown from 'to-markdown';
import * as mfo from 'mf-obj';

let imageType = require('image-type');

import { People } from '../people';

let config = require('../../abodeConfig.json');
let dataDir = __dirname + "/../../jekyll/_source/";
let imageDir = `${dataDir}/images`;
let entryImageDirName = `entry-images`;

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

    let authorizedPostTypes: [mfTypes.postType] = [
        "Checkin",
        "Ate",
        "Drank",
        "Note",
        "Like",
        "Reply",
        "Article",
        "Photo",
        "Repost"
    ];

    let tagsForPostType = {
        "Checkin": ["checkin"],
        "Ate": ["ate"],
        "Drank": ["drank"]
    }

    let micropubPropertiesToIgnore = [
        "published",
        "syndication",
        "content",
        "name",
        "category",
        "post-status",
        "mp-slug",
        "place_name"
    ]

    let micropubPropertiesToExpand = [
        "like-of",
        "repost-of",
        "in-reply-to"
    ]

    console.log("Post Type Check");
    let micropubPostType = mfTypes.getPostType(micropubDocument);
    console.log(micropubPostType);
    console.log(authorizedPostTypes.indexOf(micropubPostType) > -1);

    if (authorizedPostTypes.indexOf(micropubPostType) > -1) {

        //return //git.runGitStageAll()
            //.then(() => { return git.runGitCommit(); })
            //.then(() => { return git.runGitPull(); })
            return new Promise((resolve, reject) => { resolve(); }).then(() => {

            return preparePostInfo(micropubDocument).then(function(postInfo: any){

                    new Promise((resolve, reject) => {

                        let yamlDocument: any = {};
                        let yamlDocumentReady = [];
                        
                        // Take Micropub Document and Modify to Output Structure to match YAML

                        console.log("Before date");

                        // For posts the date needs to be in the root object
                        if (micropubDocument.properties.published != undefined) {
                            yamlDocument.date = moment(micropubDocument.properties.published[0]).format("YYYY-MM-DD HH:mm:ss ZZ");
                        } else {
                            yamlDocument.date = moment().format("YYYY-MM-DD HH:mm:ss ZZ");
                        }

                        console.log("After published date");

                        // Jekyll is always markdown
                        yamlDocument['content-type'] = "text/markdown";

                        // Bring in client_id
                        if (micropubDocument.client_id != undefined) {
                            yamlDocument.client_id = micropubDocument.client_id;
                        }

                        // Layout should be the type minus the prefix
                        yamlDocument.layout = micropubDocument.type[0].split("-").pop();

                        // Get visibility or default visibility to public
                        yamlDocument.visibility = micropubDocument.properties.visibility ? micropubDocument.properties.visibility : "public";

                        // Get post-status or default post-status to published
                        yamlDocument["post-status"] = micropubDocument.properties["post-status"] ? micropubDocument.properties["post-status"] : "published";

                        // Convert name to title
                        if (micropubDocument.properties.name != undefined) {
                            yamlDocument.title = micropubDocument.properties.name[0];
                        }

                        let micropubContent: any = "";

                        // Check if content is an object
                        if (micropubDocument.properties.content instanceof Array) {
                            micropubContent = micropubDocument.properties.content[0];
                        } else {
                            micropubContent = micropubDocument.properties.content;
                        }
                        
                        if (typeof micropubContent === 'object') {
                            if (micropubContent.html != undefined) {
                                micropubContent = toMarkdown(micropubContent.html);
                            }
                        }

                        // if there is no title or if the title is the prefix to the content, ignore it
                        if (yamlDocument.title == undefined || micropubContent.indexOf(yamlDocument.title) == 0) {
                            yamlDocument.title = "";
                        }

                        // Loop through all properties
                        // If they are an object, process them
                        yamlDocument.properties = {};

                        console.log("About to deal with properties");
                        for (let propertyName in micropubDocument.properties) {

                            // Make sure this isn't in the list of properties to ignore
                            if (micropubPropertiesToIgnore.indexOf(propertyName) == -1) {
                                
                                console.log(`Working on property ${propertyName}`);
                                console.log(micropubDocument.properties[propertyName][0]);
                                
                                if (typeof micropubDocument.properties[propertyName][0] === 'object' && micropubDocument.properties[propertyName][0].type != undefined) {
                                    yamlDocument.properties[propertyName] = {
                                        type: micropubDocument.properties[propertyName][0].type[0],
                                        properties: {}
                                    };
                                } else {
                                    // Specific Embeded Use-Cases

                                    // Add h-food to ate and drank
                                    if (propertyName == "drank") {
                                        yamlDocument.properties[propertyName] = {
                                            type: "h-food",
                                            properties: {}
                                        };
                                    }

                                    if (propertyName == "ate") {
                                        yamlDocument.properties[propertyName] = {
                                            type: "h-food",
                                            properties: {}
                                        };
                                    }
                                }

                                if (typeof yamlDocument.properties[propertyName] === 'object' && yamlDocument.properties[propertyName].type) {
                                    console.log("In switch");
                                    switch(yamlDocument.properties[propertyName].type) {
                                        case 'h-card':
                                                for (let subPropertyName in micropubDocument.properties[propertyName][0].properties) {
                                                    if (micropubDocument.properties[propertyName][0].properties[subPropertyName] instanceof Array) {
                                                        yamlDocument.properties[propertyName].properties[subPropertyName] = micropubDocument.properties[propertyName][0].properties[subPropertyName][0];
                                                    } else {
                                                        yamlDocument.properties[propertyName].properties[subPropertyName] = micropubDocument.properties[propertyName][0].properties[subPropertyName];
                                                    }
                                                };
                                                break;
                                        default:
                                                yamlDocument.properties[propertyName].properties = micropubDocument.properties[propertyName][0].properties;
                                                break;
                                    }
                                } else {
                                    console.log("Outside switch");
                                    if (typeof yamlDocument.properties[propertyName] === 'object') {
                                        yamlDocument.properties[propertyName].properties = micropubDocument.properties[propertyName].properties;
                                    } else {
                                        if (micropubDocument.properties[propertyName].length > 1) {
                                            yamlDocument.properties[propertyName] = micropubDocument.properties[propertyName];
                                        } else {
                                            yamlDocument.properties[propertyName] = micropubDocument.properties[propertyName][0];
                                        }
                                    }
                                }

                                console.log(yamlDocument.properties[propertyName]);
                            }
                        }

                        console.log("About to deal with expanded context");
                        for (let propertyToExpand of micropubPropertiesToExpand) {

                            let getContextProperty = yamlDocument.properties[propertyToExpand];
                            if (typeof getContextProperty === 'string') {
                                console.log("Finding context for: " + propertyToExpand);
                                yamlDocumentReady.push(mfo.getEntry(getContextProperty)
                                .then((entry) => {

                                    if (entry.name == undefined) {
                                        console.log("No name found: ");
                                        console.log(entry);
                                        throw new Error("No name found");
                                    }
                                    
                                    let entryPropertiesToAdd: any = {};
                                    
                                    entryPropertiesToAdd.name = entry.name;

                                    if (entry.url != undefined) {
                                        entryPropertiesToAdd.url = entry.url;
                                    }

                                    if (entry.summary != undefined) {
                                        entryPropertiesToAdd.summary = entry.summary;
                                    }

                                    if (entry.author != undefined) {
                                        entryPropertiesToAdd.author = {
                                            type: "h-card",
                                            properties: {
                                                name: entry.author.name,
                                                photo: entry.author.photo,
                                                url: entry.author.url,
                                                uid: entry.author.uid
                                            }
                                        }
                                    }

                                    if (entry.photo != undefined) {
                                        entryPropertiesToAdd.photo = entry.photo;
                                    }

                                    yamlDocument.properties[propertyToExpand] = {
                                        type: "h-cite",
                                        properties: entryPropertiesToAdd
                                    }
                                }).catch((err) => {
                                    if (err.message == "All strategies failed: Error: Multiple h-entries found") {
                                        return mfo.getCard(getContextProperty).then((card) => {
                                            
                                            yamlDocument.properties[propertyToExpand] = {
                                                type: "h-card",
                                                properties: card
                                            }

                                        }).catch((err) => {
                                            console.log("Error trying to get card");
                                            console.log(err);
                                            return;
                                        });
                                    } else {
                                        console.log("Error trying to get entry");
                                        console.log(err);
                                        return;
                                    }
                                    
                                }));
                            }
                        }

                        console.log("About to deal with location");

                        // Set up location
                        if (micropubDocument.properties.location != undefined && micropubDocument.properties.location.length > 0) {
                            // Only use 1 location
                            let loc = micropubDocument.properties.location[0];
                                
                            if (typeof loc == "string") {
                                let locationObject = {
                                    type: 'h-adr',
                                    properties: {}
                                };
                                
                                var geoInfo = loc.split("geo:").pop();
                                var locInfo: string[];
                                if (geoInfo.indexOf(";")) {
                                    locInfo = geoInfo.split(";");
                                } else {
                                    locInfo = [geoInfo];
                                }
                                var locArray = locInfo[0].split(",");
                                if (locArray.length > 0) {
                                     let locObject = {
                                        latitude: parseFloat(locArray[0]),
                                        longitude: parseFloat(locArray[1])
                                    } as LocationObject;

                                    if (locInfo.length > 1) {
                                        locObject.uncertainty = parseFloat(locInfo[1].split("=").pop());
                                    }
                                    locationObject.properties = locObject;
                                }
                                yamlDocument.properties.location = locationObject;
                            } else {
                                yamlDocument.properties.location = loc;
                            }
                        }

                        if (micropubDocument.properties.place_name != undefined && micropubDocument.properties.place_name.length > 0) {
                            
                            let placeName = micropubDocument.properties.place_name[0];
                            let placeSegments: string[];
                            if (placeName.indexOf(" - ") > -1) {
                                placeSegments = placeName.split(" - ");
                            } else {
                                if (placeName.indexOf(", ") > -1) {
                                    placeSegments = [undefined, placeName];
                                } else {
                                    placeSegments = [placeName];
                                }
                            }
                            let name = placeSegments[0];
                            if (placeSegments.length > 1 && placeSegments[1].indexOf(", ")) {
                                placeSegments = placeSegments[1].split(", ");
                            } else {
                                placeSegments = [placeSegments[1]];
                            }
                            let locality = placeSegments[0];
                            let region = placeSegments[1];

                            if (yamlDocument.properties.location == undefined) {
                                yamlDocument.properties.location = {
                                    type: 'h-adr',
                                    properties: {}
                                };
                            }

                            if (name != undefined) {
                                yamlDocument.properties.location.type = "h-card"
                                yamlDocument.properties.location.properties.name = name;
                            }

                            if (locality != undefined) {
                                yamlDocument.properties.location.properties.locality = locality;
                            }
                            if (region != undefined) {
                                yamlDocument.properties.location.properties.region = region;
                                yamlDocument.properties.location.properties['country-name'] = "USA";
                            }

                        }

                        console.log("About to deal with syndication");

                        // Set up syndication
                        if (micropubDocument.properties.syndication != undefined && micropubDocument.properties.syndication.length > 0) {
                            yamlDocument.properties.syndication = [];
                            for (let syndicated of micropubDocument.properties.syndication) {
                                
                                let syndicatedObject;
                                if (syndicated.indexOf("swarmapp.com") > -1) {
                                    syndicatedObject = {
                                        name: "Swarm",
                                        icon: "fa-foursquare",
                                        url: syndicated
                                    }
                                }
                                if (syndicated.indexOf("instagram.com") > -1) {
                                    syndicatedObject = {
                                        name: "Instagram",
                                        icon: "fa-instagram",
                                        url: syndicated
                                    }
                                }
                                yamlDocument.properties.syndication.push(syndicatedObject);

                            };
                        }

                        console.log("About to deal with categories");

                        if (micropubContent != undefined) {
                            yamlDocument.content = micropubContent as String;
                        } else {
                            yamlDocument.content = "";
                        }

                        // Convert categories to tags
                        yamlDocument.tags = micropubDocument.categories;

                        // If there weren't any categories, create the tags array
                        if (yamlDocument.tags == undefined) {
                            yamlDocument.tags = [];
                        }

                        // Add tags from properties
                        if (micropubDocument.properties.category != undefined) {
                            yamlDocument.tags = yamlDocument.tags.concat(micropubDocument.properties.category);
                        }

                        // Add tags based on post type
                        if (tagsForPostType[micropubPostType] != undefined) {
                            yamlDocument.tags = yamlDocument.tags.concat(tagsForPostType[micropubPostType]);
                        }

                        // Extract tags from post content
                        let regExTagToken = /#(\w*)/g
                        let match = null;
                        let foundTags = [];
                        while(match = regExTagToken.exec(micropubContent)) {
                            foundTags.push(match[1]);
                        }

                        for (let tag of foundTags) {
                            console.log(tag);
                            if (yamlDocument.tags.indexOf(tag) == -1) {
                                yamlDocument.tags.push(tag);
                            }
                            yamlDocument.content = yamlDocument.content.replace(`#${tag}`, '');
                        }

                        // Check if there are any person tags within the content
                        yamlDocumentReady.push(People.getPeople().then((people) => {

                            let regExNicknameToken = /@(\w*)/g
                            let match = null;
                            let foundIdentities = [];
                            while(match = regExNicknameToken.exec(micropubContent)) {
                                foundIdentities.push(match[1]);
                            }
                            
                            // Set slug number to post index
                            yamlDocument.slug = '' + postInfo.postIndex;

                            // Create type slug for permalink based on post type but lowercase
                            let typeSlug = micropubPostType.toLowerCase();
                            
                            // Create Permalink
                            yamlDocument.permalink = `/:year/:month/:day/:slug/${typeSlug}/`;

                            for (let nickname of foundIdentities) {
                                console.log(nickname);
                                let taggedPerson = people.getPersonByNickname(nickname);
                                console.log(taggedPerson);
                                if (taggedPerson != undefined) {
                                    yamlDocument.tags.push(taggedPerson.getRepresentitiveUrl());
                                    yamlDocument.content = yamlDocument.content.replace(`@${nickname}`, '');
                                }
                            }

                            yamlDocument.content = yamlDocument.content.trim();

                            if (_.keys(yamlDocument.properties).length == 0) {
                                delete yamlDocument.properties;
                            }

                            if (micropubDocument.files != undefined && micropubDocument.files.photo != undefined && micropubDocument.files.photo.length > 0) {

                                if (yamlDocument.properties.photo == undefined) {
                                    yamlDocument.properties.photo = [];
                                }

                                let count = 1;
                                let date = moment(yamlDocument.date, "YYYY-MM-DD HH:mm:ss ZZ");
                                let year = date.format("YYYY");
                                let month = date.format("MM");
                                let day = date.format("DD");

                                for (let image of micropubDocument.files.photo) {
                                    let imageBuffer = Buffer.from(image.buffer);
                                    let imageExt = imageType(imageBuffer).ext;

                                    while(fs.existsSync(`${imageDir}/${entryImageDirName}/${year}-${month}-${day}_${yamlDocument.slug}_${count}.${imageExt}`)) {
                                        count++;
                                    }

                                    fs.writeFileSync(`${imageDir}/${entryImageDirName}/${year}-${month}-${day}_${yamlDocument.slug}_${count}.${imageExt}`, imageBuffer);
                                    yamlDocument.properties.photo.push(`https://eddiehinkle.com/images/${entryImageDirName}/${year}-${month}-${day}_${yamlDocument.slug}_${count}.${imageExt}`)
                                    count++;
                                }
                            }

                        }));

                        Promise.all(yamlDocumentReady).then(() => {
                            console.log("Yaml Document Complete");
                            resolve(yamlDocument);
                        });

                    })
                    .then((yamlDocument: any) => {

                        // Move content out of yaml into the main body
                        let postContents = yamlDocument.content;
                        delete yamlDocument.content;

                        if (postContents == undefined ) {
                            postContents = "";
                        }

                        console.log("Testing YAML Data");
                        console.log(yamlDocument);

                        // Save YAML File
                        var fileData = "---\n" + yaml.safeDump(yamlDocument, { lineWidth: 800 }) + "---\n" + postContents;
                        var fileName = formatFilename(yamlDocument);

                        console.log(`Test Fileoutput for ${fileName}`);
                        console.log(fileData);

                        fs.writeFile(fileName, fileData, function(err) {
                            if(err) {
                                return console.log(err);
                            }

                            console.log(`Finished saving: ${fileName}`);
                        }); 

                        return;
                    // })
                    // .then(() => {
                        // All tasks are done, we can restart the jekyll server, etc.
                        // console.log("Rebuild ready...");

                        // git.runGitStageAll()
                        // .then(() => { return git.runGitCommit(); })
                        // .then(() => { return git.runGitPush(); })
                        // .then(() => { return jekyll.runJekyllBuild(); })                        
                        
                        // return;
                        
                    })
                    .then(() => { return jekyll.runJekyllBuild(); })
                    .catch((error) => {
                        console.log("Caught Error");
                        console.log(error);
                    });

                    // Make sure the document has the post index
                    let micropubInfoForUrl = _.clone(micropubDocument);
                    micropubInfoForUrl.postInfo = postInfo;

                    // Return the URL
                    return formatUrl(micropubInfoForUrl).then(function(returnUrl) {
                        return { url: returnUrl };
                    });

                });

        });
        
    } else {
        console.log("Non-supported Micropub Recieved...check the log files");

        return Promise.resolve().then(function () {
            return { url: "https://eddiehinkle.com/404" };
        });
    }
}

function formatUrl(micropubDocument): Promise<any> {
	return new Promise((resolve, reject) => {
        console.log("Formatting URL");
        let date = micropubDocument.properties.published != undefined ? moment(micropubDocument.properties.published[0]) : moment();
        let year = date.format("YYYY");
        let month = date.format("MM");
        let day = date.format("DD");
        
        var yearDir = dataDir + "_note/" + year + "/";
        var monthDir = yearDir + month + "/";
        var dayDir = monthDir + day + "/";
        
        let index = micropubDocument.postInfo.postIndex;
        
        // Create type slug for permalink based on post type but lowercase
        let micropubPostType = mfTypes.getPostType(micropubDocument);
        let typeSlug = micropubPostType.toLowerCase();

        resolve(`https://eddiehinkle.com/${year}/${month}/${day}/${index}/${typeSlug}/`);
        console.log("Finished URL Formatting");
    });
}

function formatFilename(data) {
		console.log("Formatting Filename");
        let date = moment(data.date, "YYYY-MM-DD HH:mm:ss ZZ");
        let year = date.format("YYYY");
        let month = date.format("MM");
        let day = date.format("DD");

        var yearDir = dataDir + "_note/" + year + "/";
        var monthDir = yearDir + month + "/";
        var dayDir = monthDir + day + "/";
        
        var postDir = dayDir + data.slug + "/";
        if (!fs.existsSync(postDir)) {
            fs.mkdirSync(postDir);
            console.log(postDir + " created");
        }

        return `${postDir}post.md`;
}

function preparePostInfo(preformattedData) {
    return new Promise((resolve, reject) => {
        let properties = preformattedData.properties;
        let date = properties.published != undefined ? moment(properties.published[0]) : moment();
        let year = date.format("YYYY");
        let month = date.format("MM");
        let day = date.format("DD");
        
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
        var dayDir = monthDir + day;
        if (!fs.existsSync(dayDir)) {
            fs.mkdirSync(dayDir);
            console.log(dayDir + " created");
        } else {
            var dirContents = fs.readdirSync(dayDir);
            dirContents = _.filter(dirContents, (filename) => {
                return (fs.statSync(dayDir + "/" + filename).isDirectory() && fs.existsSync(`${dayDir}${filename}/post.md`));
            });
            postIndex = dirContents.length + 1;
        }

        while(fs.existsSync(`${dayDir}/${postIndex}/post.md`)) {
            postIndex++;
        }

        fs.writeFile(`${dayDir}/${postIndex}/post.md`, '', function(err) {
            if(err) {
                console.log(err);
                reject(err);
            }

            console.log(`Created: ${dayDir}/${postIndex}/post.md`);
            resolve({ postIndex: postIndex });
        }); 
        resolve({ postIndex: postIndex });
        
    });
}

interface LocationObject {
    longitude: number;
    latitude: number;
    uncertainty?: number;
}