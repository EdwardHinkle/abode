import * as MicropubFormatter from 'format-microformat';
import * as moment from 'moment';
import * as fs from 'fs';
import * as path from 'path';
import * as _ from 'lodash';
import * as mfTypes from '../mf2';
import * as yaml from 'js-yaml';
import * as toMarkdown from 'to-markdown';
import * as request from 'request';
import * as cheerio from 'cheerio';
import * as getWebmentionUrl from 'get-webmention-url';

let imageType = require('image-type');
let readingTime = require('reading-time');

import { People } from '../people';

// let config = require('../../abodeConfig.json');
let dataDir = __dirname + "/../../jekyll/_source/";
let lukeDataDir = __dirname + "/../../../production/luke.hinkle.life/storage/";
let imageDir = `${dataDir}/images`;
let mediaStorageDir = `${__dirname}/../../media-server-storage`;
let entryImageDirName = `entry-images`;

let syndicateData = fs.readFileSync(__dirname + '/../../config/syndicate.yaml', 'utf8');
let syndicateTargets = yaml.safeLoad(syndicateData);
let syndicateByShortcodes = {};
syndicateTargets.forEach(target => {
    syndicateByShortcodes[target.shortcode] = target;
});

let formatter = new MicropubFormatter();

// Support Functions
export function convertMicropubToJekyll(micropubDocument, req): Promise<any> {

    let config = req.app.get('config');

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

    let tagsForPostType = {
        "Checkin": ["checkin"],
        "Ate": ["ate", "health"],
        "Drank": ["drank", "health"]
    };

    let micropubPropertiesToIgnore = [
        "published",
        "syndication",
        "content",
        "name",
        "category",
        "post-status",
        "mp-slug",
        "place_name",
        "mp-syndicate-to",
        "uid"
    ];

    let micropubPropertiesToExpand = [
        "like-of",
        "repost-of",
        "in-reply-to",
        "bookmark-of"
    ];

    console.log("Post Type Check");
    let micropubPostType = mfTypes.getPostType(micropubDocument);
    console.log(micropubPostType);

    return new Promise((resolve, reject) => { resolve(); }).then(() => {

    return preparePostInfo(micropubDocument).then(function(postInfo: any){

            let infoForUrl = _.clone(micropubDocument);

            new Promise((resolve, reject) => {

                let yamlDocument: any = {};
                let yamlDocumentReady = [];
                
                if (micropubDocument.mp === undefined) {
                	micropubDocument.mp = {};
                }

                // Take Micropub Document and Modify to Output Structure to match YAML

                // check to see if mp-syndicate-to exists, if not create it
                if (micropubDocument.mp['syndicate-to'] === undefined) {
                    micropubDocument.mp['syndicate-to'] = [];
                }

                // For posts the date needs to be in the root object
                if (micropubDocument.properties.published != undefined) {
                    let dateString = (micropubDocument.properties.published instanceof Array ? micropubDocument.properties.published[0] : micropubDocument.properties.published);
                    yamlDocument.date = moment(dateString).format("YYYY-MM-DD HH:mm:ss ZZ");
                } else {
                    yamlDocument.date = moment().format("YYYY-MM-DD HH:mm:ss ZZ");
                }

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
                    if (micropubDocument.properties.name instanceof Array) {
                        yamlDocument.title = micropubDocument.properties.name[0];
                    } else {
                        yamlDocument.title = micropubDocument.properties.name;
                    }
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

                if (yamlDocument.title > "" && micropubContent > "") {
                    if (micropubDocument.properties['in-reply-to'] === undefined) {
                        // Add featured if there is a title and content
                        yamlDocument.featured = true;
                    }

                    // Add duration estimate
                    yamlDocument.duration = Math.round(readingTime(micropubContent).minutes);
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

                if (micropubDocument.client_id === 'https://micro.blog/') {
                    micropubDocument.mp['syndicate-to'].push("https://eddiehinkle.com/timeline");
                }

                console.log("About to deal with expanded context");
                for (let propertyToExpand of micropubPropertiesToExpand) {

                    let getContextProperty = yamlDocument.properties[propertyToExpand];
                    if (typeof getContextProperty === 'string') {
                        console.log("Finding context for: " + propertyToExpand);

                        yamlDocumentReady.push(new Promise((resolve, reject) => {
                            let replyContext = undefined;
                            let replyContextUrl = undefined;

                            replyContextUrl = `${config.xray.url}parse?url=${getContextProperty}`;

                            console.log('parse url for context');
                            console.log(replyContextUrl);

                            request(replyContextUrl, function(error, response, body) {
                                if (error !== null) {
                                    console.log('error getting location');
                                    console.log(error);
                                } else {
                                    replyContext = JSON.parse(body);
                                }

                                if (replyContext !== undefined && replyContext.data !== null) {
                                    console.log(replyContext.data);
                                }

                                resolve();
                            });

                        }));
                    }
                }

                console.log("About to deal with syndication");

                if (yamlDocument.properties['abode-channel'] === undefined) {
                    yamlDocument.properties['abode-channel'] = [];
                }
                yamlDocument.properties.syndication = [];

                // Set up syndication
                if (micropubDocument.properties.syndication != undefined && micropubDocument.properties.syndication.length > 0) {
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
                        if (syndicated.indexOf("facebook.com") > -1) {
                            syndicatedObject = {
                                name: "Facebook",
                                icon: "fa-facebook",
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

                // Check if ^_^ and change to a private post
                if (yamlDocument.content.indexOf('^_^') > 0) {
                    yamlDocument.content = yamlDocument.content.replace(`^_^`, '');
                    yamlDocument.visibility = 'private';
                }

                // Detect syndicate shortcodes such as +mb
                let regExSyndicateToken = /\+(\w*)/g;
                let syndicateMatch = null;
                let foundSyndications = [];
                while(syndicateMatch = regExSyndicateToken.exec(micropubContent)) {
                    foundSyndications.push(syndicateMatch[1]);
                }

                for (let shortcode of foundSyndications) {
                    console.log(shortcode);
                    let syndicateTarget = syndicateByShortcodes[shortcode];
                    console.log(syndicateTarget);
                    if (syndicateTarget != undefined) {
                        micropubDocument.mp['syndicate-to'].push(syndicateTarget.uid);
                        yamlDocument.content = yamlDocument.content.replace(`+${shortcode}`, '');
                    }
                }

                console.log('syndicate targets');
                console.log(micropubDocument.mp['syndicate-to']);

                // If syndicate-to micro.blog is set, we should create a syndication entry to allow the feed to display it
                if (micropubDocument.mp['syndicate-to'].indexOf('https://eddiehinkle.com/timeline') > -1) {
                    yamlDocument.properties.syndication.push({
                        name: "micro.blog",
                        include: '<svg aria-labelledby="simpleicons-microblog-icon" role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title id="simpleicons-microblog-icon">Micro.blog icon</title><path d="M21.4 17.7c-2 2.6-1 4.8-.3 5.9.3.4-.1.4-.3.4a6 6 0 0 1-4-2.7c-.2-.1-.3-.2-.5-.1-1.4.4-2.8.7-4.3.6C5.4 21.8 0 17 0 11 0 5 5.4 0 12 0s12 4.9 12 11c0 2.5-1 4.8-2.6 6.7zM12 14l3.2 2.2a.4.4 0 0 0 .6-.4L14.6 12l3.1-2.4a.4.4 0 0 0-.2-.6h-3.9l-1.3-3.8a.4.4 0 0 0-.6 0L10.4 9h-4a.4.4 0 0 0-.1.7l3 2.4-1 3.7a.4.4 0 0 0 .5.4L12 14z"/></svg>',
                        url: 'https://micro.blog/EddieHinkle'
                    });

                    yamlDocument.properties['abode-channel'].push('timeline');

                    let mblogIndex = micropubDocument.mp['syndicate-to'].indexOf('https://eddiehinkle.com/timeline');
                    micropubDocument.mp['syndicate-to'].splice(mblogIndex, 1);
                }

                // If syndicate-to has IndieNews, add syndication link to post
                if (micropubDocument.mp['syndicate-to'].indexOf('https://news.indieweb.org/en') > -1) {
                    yamlDocument.properties.syndication.push({
                        name: "IndieNews",
                        image: "images/indiewebcamp.svg",
                        url: 'https://news.indieweb.org/en'
                    });

                    let syndicateIndex = micropubDocument.mp['syndicate-to'].indexOf('https://news.indieweb.org/en');
                    micropubDocument.mp['syndicate-to'].splice(syndicateIndex, 1);
                }

                // If syndicate-to has indieweb.xyz, add syndication link to post
                // Loop through all the syndication targets
                for (let syndicateTargetIndex in micropubDocument.mp['syndicate-to']) {
                    // Check if the syndication target starts with indieweb.xyz
                    if (micropubDocument.mp['syndicate-to'][syndicateTargetIndex] !== undefined &&
                        micropubDocument.mp['syndicate-to'][syndicateTargetIndex].indexOf('https://indieweb.xyz/en') > -1) {
                        yamlDocument.properties.syndication.push({
                            name: "IndieWeb XYZ",
                            icon: "globe",
                            url: micropubDocument.mp['syndicate-to'][syndicateTargetIndex]
                        });

                        // TODO: Do we actually need to remove the data from this?
                        // micropubDocument.mp['syndicate-to'].splice(syndicateTargetIndex, 1);
                    }

                    // Check if the syndication target starts with twitter.com
                    if (micropubDocument.mp['syndicate-to'][syndicateTargetIndex] !== undefined &&
                        micropubDocument.mp['syndicate-to'][syndicateTargetIndex].indexOf('twitter.com') > -1) {
                        yamlDocument.properties.syndication.push({
                            name: "Twitter",
                            icon: "fa-twitter",
                            url: micropubDocument.mp['syndicate-to'][syndicateTargetIndex]
                        });
                    }

                    // Check if the syndication target starts with github.com
                    if (micropubDocument.mp['syndicate-to'][syndicateTargetIndex] !== undefined &&
                        micropubDocument.mp['syndicate-to'][syndicateTargetIndex].indexOf('github.com') > -1) {
                        yamlDocument.properties.syndication.push({
                            name: "GitHub",
                            icon: "fa-github",
                            url: micropubDocument.mp['syndicate-to'][syndicateTargetIndex]
                        });
                    }
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
                let regExTagToken = /\B#((?:\w|-)*)/g;
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
                    
                    yamlDocument.content = yamlDocument.content.replace(`#${tag}`, '[#' + tag + '](https://eddiehinkle.com/tag/' + tag.toLowerCase() + '/)');
                }

                let locationPromise = new Promise((resolve, reject) => {

                    console.log("About to deal with location");

                    let locationInfo = undefined;
                    let locationQueryUrl = undefined;

                    if (yamlDocument.date !== undefined) {
                        let postTimestamp = moment(yamlDocument.date, 'YYYY-MM-DD HH:mm:ss ZZ');
                        locationQueryUrl = `${config.compass.url}api/last?before=${postTimestamp.format('YYYY-MM-DDTHH:mm:ssZZ')}&geocode=true&token=${config.compass.token.read}`;
                    } else {
                        locationQueryUrl = `${config.compass.url}api/last?geocode=true&token=${config.compass.token.read}`;
                    }

                    request(locationQueryUrl, function(error, response, body) {
                        if (error !== null) {
                            console.log('error getting location');
                            console.log(error);
                        } else {
                            locationInfo = JSON.parse(body);
                        }

                        if (locationInfo !== undefined && locationInfo.data !== null) {
                            if (locationInfo.geocode != undefined) {
                                yamlDocument.properties.location = {
                                    type: 'h-adr',
                                    properties: {
                                        'latitude': locationInfo.geocode.latitude,
                                        'longitude': locationInfo.geocode.longitude,
                                        'altitude': locationInfo.data.properties.altitude,
                                        'locality': locationInfo.geocode.locality,
                                        'region': locationInfo.geocode.region,
                                        'country-name': locationInfo.geocode.country,
                                    }
                                }
                            } else {
                                yamlDocument.properties.location = {
                                    type: 'h-adr',
                                    properties: {
                                        'latitude': locationInfo.data.geometry.coordinates[1],
                                        'longitude': locationInfo.data.geometry.coordinates[0],
                                        'altitude': locationInfo.data.properties.altitude
                                    }
                                }
                            }
                        } else {

                            let postedDate = moment(yamlDocument.date, 'YYYY-MM-DD HH:mm:ss ZZ');

                            if (postedDate.year() >= 2017) {
                                // Let me know compass isn't returning locations if post is 2017 or later
                                request.post(`https://aperture.eddiehinkle.com/micropub/`, {
                                    'auth': {
                                        'bearer': `my7XNxxxB9EYoyDCLBQppcqD7Hsqz45R`
                                    },
                                    body: {
                                        type: ['h-entry'],
                                        properties: {
                                            content: [`Compass did not return a location for the micropub request`],
                                            published: [moment().format()],
                                            author: [{
                                                type: ['h-card'],
                                                properties: {
                                                    name: ['eddiehinkle.com'],
                                                    url: ['https://eddiehinkle.com']
                                                }
                                            }]
                                        }
                                    },
                                    json: true
                                }, (err, data) => {
                                    if (err != undefined) {
                                        console.log(`ERROR: ${err}`);
                                    }
                                    if (data.statusCode !== 201 && data.statusCode !== 202) {
                                        console.log("oops Microsub Notification Error");
                                    } else {
                                        console.log("Successfully sent Microsub Notification");
                                    }
                                });
                            }

                            // Only activate these if there is no iPhone powered location
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
                                    yamlDocument.properties.location.type = "h-card";
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
                        }

                        resolve();
                    });

                });
                yamlDocumentReady.push(locationPromise);

                yamlDocumentReady.push(new Promise((resolve, reject) => {
                    console.log("Weather promise set to wait for location");
                    locationPromise.then(() => {
                        // Now that the location is fetched, we can fetch the weather
                        console.log("About to deal with weather");

                        if (yamlDocument.properties.location === undefined || yamlDocument.properties.location.properties === undefined) {
                            console.log('no location to be able to find the weather');
                            resolve();
                            return;
                        }

                        let weatherInfo;
                        let weatherQueryUrl = `https://api.darksky.net/forecast/${config.darksky.token}/${yamlDocument.properties.location.properties.latitude},${yamlDocument.properties.location.properties.longitude}`;

                        if (yamlDocument.date !== undefined) {
                            let postTimestamp = moment(yamlDocument.date, 'YYYY-MM-DD HH:mm:ss ZZ');
                            weatherQueryUrl += `,${postTimestamp.format('YYYY-MM-DDTHH:mm:ssZZ')}`;
                        }

                        request(weatherQueryUrl, function(error, response, body) {
                            if (error !== null) {
                                console.log('error getting weather');
                                console.log(error);
                            } else {
                                weatherInfo = JSON.parse(body);
                            }

                            if (weatherInfo !== undefined && weatherInfo.currently !== null) {
                                yamlDocument.properties.weather = {
                                    type: 'h-entry',
                                    properties: weatherInfo.currently
                                };

                                if (yamlDocument.properties.weather.properties.visibility !== undefined) {
                                    yamlDocument.properties.weather.properties.sightVisibility = yamlDocument.properties.weather.properties.visibility;
                                    delete yamlDocument.properties.weather.properties.visibility;
                                }
                                delete yamlDocument.properties.weather.properties.time;

                                if (weatherInfo.daily.data[0].sunriseTime) {
                                    yamlDocument.properties.weather.properties.sunriseTime = weatherInfo.daily.data[0].sunriseTime;
                                }

                                if (weatherInfo.daily.data[0].sunsetTime) {
                                    yamlDocument.properties.weather.properties.sunsetTime = weatherInfo.daily.data[0].sunsetTime;
                                }

                                if (weatherInfo.daily.data[0].moonPhase) {
                                    yamlDocument.properties.weather.properties.moonPhase = weatherInfo.daily.data[0].moonPhase;
                                }
                            }

                            resolve()
                        });

                    });
                }));

                // Check if there are any person tags within the content
                yamlDocumentReady.push(People.getPeople().then((people) => {

                    // Detect person tags such as +ash
                    let regExNicknameToken = /\+(\w*)/g
                    let match = null;
                    let foundIdentities = [];
                    while(match = regExNicknameToken.exec(micropubContent)) {
                        foundIdentities.push(match[1]);
                    }

                    for (let nickname of foundIdentities) {
                        console.log(nickname);
                        let taggedPerson = people.getPersonByNickname(nickname);
                        console.log(taggedPerson);
                        if (taggedPerson != undefined) {
                            yamlDocument.tags.push(taggedPerson.getRepresentitiveUrl());
                            yamlDocument.content = yamlDocument.content.replace(`+${nickname}`, '');
                        }
                    }

                    // If slug exists use that
                    if (micropubDocument.properties['mp-slug'] !== undefined) {
                        yamlDocument.slug = micropubDocument.properties['mp-slug'][0];
                    } else {
                        // Set slug number to post index
                        yamlDocument.slug = '' + postInfo.postIndex;
                    }

                    // Create type slug for permalink based on post type but lowercase
                    let typeSlug = micropubPostType.toLowerCase();

                    // Create Permalink
                    yamlDocument.permalink = `/:year/:month/:day/:slug/${typeSlug}/`;

                    // Detect person mentions such as @manton
                    let regExNicknameTokenMention = /@(\w*)/g
                    let matchMention = null;
                    let foundIdentitiesMention = [];
                    while(matchMention = regExNicknameTokenMention.exec(micropubContent)) {
                        foundIdentitiesMention.push(matchMention[1]);
                    }

                    for (let nickname of foundIdentitiesMention) {
                        console.log(nickname);
                        let taggedPerson = people.getPersonByNickname(nickname);
                        console.log(taggedPerson);
                        if (taggedPerson != undefined) {
                            yamlDocument.content = yamlDocument.content.replace(`@${nickname}`, `[@${nickname}](${taggedPerson.getRepresentitiveUrl()})`);
                        } else if (yamlDocument.properties.syndication.find(syndication => syndication.name === 'micro.blog') !== undefined) {
                            // if no one found in nickname cache, and syndication exists to micro.blog, auto-link to micro.blog account
                            yamlDocument.content = yamlDocument.content.replace(`@${nickname}`, `[@${nickname}](https://micro.blog/${nickname})`);
                        }
                    }

                    // Trim content
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

                    if (micropubDocument.files != undefined && micropubDocument.files.audio != undefined && micropubDocument.files.audio.length > 0) {

                        if (yamlDocument.properties.audio == undefined) {
                            yamlDocument.properties.audio = [];
                        }

                        let count = 1;
                        let date = moment(yamlDocument.date, "YYYY-MM-DD HH:mm:ss ZZ");
                        let year = date.format("YYYY");
                        let month = date.format("MM");
                        let day = date.format("DD");

                        for (let audio of micropubDocument.files.audio) {
                            let audioBuffer = Buffer.from(audio.buffer);
                            let audioExt = 'mp3'; // for now we will just assume all audio is mp3

                            while(fs.existsSync(`${mediaStorageDir}/${year}-${month}-${day}_${count}.${audioExt}`)) {
                                count++;
                            }

                            fs.writeFileSync(`${mediaStorageDir}/${year}-${month}-${day}_${count}.${audioExt}`, audioBuffer);
                            yamlDocument.properties.audio.push(`https://eddiehinkle.com/media/${year}-${month}-${day}_${count}.${audioExt}`)
                            count++;
                        }
                    }

                }));

                if (micropubDocument.properties['listen-of'] !== undefined) {

                    yamlDocumentReady.push(new Promise((resolve, reject) => {
                        var podcastUrl = micropubDocument.properties['listen-of'][0];

                        console.log("Checking listen post");
                        console.log(podcastUrl);

                        if (podcastUrl.indexOf("overcast.fm") > -1) {
                            console.log("Podcast URL is from overcast.fm");
                            request(podcastUrl, function (error, response, html) {
                                if (!error) {
                                    var $ = cheerio.load(html);

                                    var podcastData = {
                                        name: $("head title").text().split(" — ")[0],
                                        url: $("#speedcontrols + div a:first-child").attr("href"),
                                        audio: $("#audioplayer source").attr("src").split("#")[0],
                                        photo: decodeURIComponent($(".fullart").attr("src").split("u=").pop())
                                    }

                                    yamlDocument.properties['listen-of'] = {
                                        'type': 'h-cite',
                                        'properties': podcastData
                                    };
                                    if (yamlDocument.properties['task-status'] === undefined) {
                                        yamlDocument.properties['task-status'] = 'finished'
                                    }
                                    resolve();

                                }
                            });
                            return;
                        } else if (podcastUrl.indexOf("castro.fm") > -1) {
                            console.log("Podcast URL is from castro.fm");
                            request(podcastUrl, function(error, response, html){
                                if(!error){
                                    var $ = cheerio.load(html);

                                    var podcastData = {
                                        name: $("#co-supertop-castro-metadata h1").text(),
                                        url: $("footer a").first().attr("href"),
                                        audio: $("#co-supertop-castro-episode source").attr("src"),
                                        photo: decodeURIComponent($("#artwork-container img").attr("src"))
                                    }

                                    yamlDocument.properties['listen-of'] = {
                                        'type': 'h-cite',
                                        'properties': podcastData
                                    };
                                    if (yamlDocument.properties['task-status'] === undefined) {
                                        yamlDocument.properties['task-status'] = 'finished'
                                    }
                                    resolve();

                                }
                            });
                            return;
                        } else {
                            // todo: Need to find out how to use podcastUrl to get normal podcast info
                            console.log('Tried to add a listen post not from overcast');
                            resolve();
                        }

                    }));

                }

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

                if (yamlDocument.tags !== undefined && yamlDocument.tags.length === 0) {
                    delete yamlDocument.tags;
                }

                // console.log("Testing YAML Data");
                // console.log(JSON.stringify(yamlDocument, null, 2));

                // Save YAML File
                var fileData = "---\n" + yaml.safeDump(yamlDocument, { lineWidth: 800, skipInvalid: true }) + "---\n" + postContents;
                // var fileName = formatFilename(yamlDocument);
                var fileName = postInfo.postDir;

                console.log(`Test Fileoutput for ${fileName}`);

                fs.writeFile(fileName, fileData, function(err) {
                    if(err) {
                        return console.log(err);
                    }

                    console.log(`Finished saving: ${fileName}`);

                    // Make sure the document has the post index
                    infoForUrl.postInfo = postInfo;

                    // Return the URL
                    formatUrl(micropubInfoForUrl).then(function(returnUrl) {

                        if (micropubDocument.mp['syndicate-to'].indexOf('https://luke.hinkle.life') > -1) {
                            let copyYamlDocument = JSON.parse(JSON.stringify(yamlDocument));
                            copyYamlDocument.canonical = returnUrl;
                            let fileData = "---\n" + yaml.safeDump(copyYamlDocument, { lineWidth: 800, skipInvalid: true }) + "---\n" + postContents;
                            let fileName = formatFilenameForLukeSyndication(copyYamlDocument);

                            console.log(`Saved ${fileName} `);

                            fs.writeFile(fileName, fileData, function(err) {
                                if (err) {
                                    return console.log(err);
                                }

                                console.log(`Finished saving: ${fileName}`);
                            });
                        }

                        // request.post({
                        //     url: `https://hooks.slack.com/services/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`,
                        //     json: {
                        //         "channel": "#website",
                        //         "username": "website-bot",
                        //         "text": `Micropub request finished saving: ${returnUrl}`,
                        //         "attachments": undefined
                        //     }
                        // }, (err, data) => {
                        //     if (err != undefined) {
                        //         console.log(`ERROR: ${err}`);
                        //     }
                        //     if (data.statusCode != 200) {
                        //         console.log("oops Slack Error");
                        //     } else {
                        //         console.log("Successfull sent Slack Message");
                        //     }
                        // });

                        request.post(`https://aperture.eddiehinkle.com/micropub/`, {
                            'auth': {
                                'bearer': `my7XNxxxB9EYoyDCLBQppcqD7Hsqz45R`
                            },
                            body: {
                                type: ['h-entry'],
                                properties: {
                                    content: [`Micropub request finished saving: ${returnUrl}`],
                                    url: [returnUrl],
                                    published: [moment().format()],
                                    author: [{
                                        type: ['h-card'],
                                        properties: {
                                            name: ['eddiehinkle.com'],
                                            url: ['https://eddiehinkle.com']
                                        }
                                    }]
                                }
                            },
                            json: true
                        }, (err, data) => {
                            if (err != undefined) {
                                console.log(`ERROR: ${err}`);
                            }
                            if (data.statusCode !== 201 && data.statusCode !== 202) {
                                console.log("oops Microsub Notification Error");
                            } else {
                                console.log("Successfully sent Microsub Notification");
                            }
                        });

                        let syndicateData = fs.readFileSync(`${config.app_root}/../config/syndicate.yaml`, 'utf8');
                        let syndicateTargets = yaml.safeLoad(syndicateData);
                        let twitterSyndicationTargets = syndicateTargets.filter(target => target.uid.indexOf("twitter.com") > -1);
                        let githubSyndicationTargets = syndicateTargets.filter(target => target.uid.indexOf("github.com") > -1);

                        // Loop through syndications
                        yamlDocument.properties.syndication.forEach(syndication => {
                            // Check to see if any syndications are actually a twitter syndication target
                            twitterSyndicationTargets.forEach(twitterTarget => {
                                if (syndication.url.indexOf(twitterTarget.uid) > -1) {
                                    request.post(config.telegraph.url, {
                                        form: {
                                            token: config.telegraph.token,
                                            source: returnUrl,
                                            target: "https://brid.gy/publish/twitter",
                                            callback: "https://eddiehinkle.com/webmention/callback"
                                        }
                                    }, (err, data) => {
                                        if (err != undefined) {
                                            console.log(`ERROR: ${err}`);
                                        }
                                        if (data.statusCode !== 201 && data.statusCode !== 202) {
                                            console.log("oops twitter syndication error");
                                        } else {
                                            console.log("Successfully sent twitter syndication webmention");
                                        }
                                    });
                                }
                            });

                            // Check to see if any syndications are actually a github syndication target
                            githubSyndicationTargets.forEach(githubTarget => {
                                if (syndication.url.indexOf(githubTarget.uid) > -1) {
                                    request.post(config.telegraph.url, {
                                        form: {
                                            token: config.telegraph.token,
                                            source: returnUrl,
                                            target: "https://brid.gy/publish/github",
                                            callback: "https://eddiehinkle.com/webmention/callback"
                                        }
                                    }, (err, data) => {
                                        if (err != undefined) {
                                            console.log(`ERROR: ${err}`);
                                        }
                                        if (data.statusCode !== 201 && data.statusCode !== 202) {
                                            console.log("oops github syndication error");
                                        } else {
                                            console.log("Successfully sent github syndication webmention");
                                        }
                                    });
                                }
                            });

                            // Check if we should syndicate to indieweb news
                            if (syndication.url.indexOf("https://news.indieweb.org/en") > -1) {
                                request.post(config.telegraph.url, {
                                    form: {
                                        token: config.telegraph.token,
                                        source: returnUrl,
                                        target: "https://news.indieweb.org/en",
                                        callback: "https://eddiehinkle.com/webmention/callback"
                                    }
                                }, (err, data) => {
                                    if (err != undefined) {
                                        console.log(`ERROR: ${err}`);
                                    }
                                    if (data.statusCode !== 201 && data.statusCode !== 202) {
                                        console.log("oops indieweb news syndication error");
                                    } else {
                                        console.log("Successfully sent indieweb news syndication webmention");
                                    }
                                });
                            }

                            // Check if we should syndicate to indieweb xyz
                            if (syndication.url.indexOf("https://indieweb.xyz/en") > -1) {
                                request.post(config.telegraph.url, {
                                    form: {
                                        token: config.telegraph.token,
                                        source: returnUrl,
                                        target: syndication.url,
                                        callback: "https://eddiehinkle.com/webmention/callback"
                                    }
                                }, (err, data) => {
                                    if (err != undefined) {
                                        console.log(`ERROR: ${err}`);
                                    }
                                    if (data.statusCode !== 201 && data.statusCode !== 202) {
                                        console.log("oops indieweb xyz syndication error");
                                    } else {
                                        console.log("Successfully sent indieweb xyz syndication webmention");
                                    }
                                });
                            }
                        });

                        // TODO: Add Bookmark Webmentions
                        // TODO: Add Listen Of, Watch Of posts
                        // TODO: Add Webmentions that aren't listed as anything in particular

                        // Send like webmentions
                        let likeOfUrl;
                        if (yamlDocument.properties['like-of'] != undefined) {
                            if (yamlDocument.properties['like-of'].type != undefined) {
                                likeOfUrl = yamlDocument.properties['like-of'].properties.url;
                            } else {
                                likeOfUrl = yamlDocument.properties['like-of'];
                            }
                        }

                        if (likeOfUrl) {
                            // Special webmentions if twitter or github, else send normal webmention

                            // Send to Bridgy Twitter
                            request.post(config.telegraph.url, {
                                form: {
                                    token: config.telegraph.token,
                                    source: returnUrl,
                                    target: "https://brid.gy/publish/twitter",
                                    callback: "https://eddiehinkle.com/webmention/callback"
                                }
                            }, (err, data) => {
                                if (err != undefined) {
                                    console.log(`ERROR: ${err}`);
                                }
                                if (data.statusCode !== 201 && data.statusCode !== 202) {
                                    console.log("oops twitter like syndication error");
                                } else {
                                    console.log("Successfully sent twitter like syndication webmention");
                                }
                            });

                            request.post(config.telegraph.url, {
                                form: {
                                    token: config.telegraph.token,
                                    source: returnUrl,
                                    target: "https://brid.gy/publish/github",
                                    callback: "https://eddiehinkle.com/webmention/callback"
                                }
                            }, (err, data) => {
                                if (err != undefined) {
                                    console.log(`ERROR: ${err}`);
                                }
                                if (data.statusCode !== 201 && data.statusCode !== 202) {
                                    console.log("oops github like syndication error");
                                } else {
                                    console.log("Successfully sent github like syndication webmention");
                                }
                            });


                            // Send a normal webmention
                            request.post(config.telegraph.url, {
                                form: {
                                    token: config.telegraph.token,
                                    source: returnUrl,
                                    target: likeOfUrl,
                                    callback: "https://eddiehinkle.com/webmention/callback"
                                }
                            }, (err, data) => {
                                if (err != undefined) {
                                    console.log(`ERROR: ${err}`);
                                }
                                if (data.statusCode !== 201 && data.statusCode !== 202) {
                                    console.log("oops like of webmention error");
                                } else {
                                    console.log("Successfully sent like of webmention");
                                }
                            });
                        }

                        // Send reply webmentions
                        let replyToUrl;
                        if (yamlDocument.properties['in-reply-to'] != undefined) {
                            if (yamlDocument.properties['in-reply-to'].type != undefined) {
                                replyToUrl = yamlDocument.properties['in-reply-to'].properties.url;
                            } else {
                                replyToUrl = yamlDocument.properties['in-reply-to'];
                            }
                        }

                        if (replyToUrl) {
                            // Special webmentions if twitter or github, else send normal webmention

                            // Send to Bridgy Twitter
                            request.post(config.telegraph.url, {
                                form: {
                                    token: config.telegraph.token,
                                    source: returnUrl,
                                    target: "https://brid.gy/publish/twitter",
                                    callback: "https://eddiehinkle.com/webmention/callback"
                                }
                            }, (err, data) => {
                                if (err != undefined) {
                                    console.log(`ERROR: ${err}`);
                                }
                                if (data.statusCode !== 201 && data.statusCode !== 202) {
                                    console.log("oops twitter reply syndication error");
                                } else {
                                    console.log("Successfully sent twitter reply syndication webmention");
                                }
                            });

                            request.post(config.telegraph.url, {
                                form: {
                                    token: config.telegraph.token,
                                    source: returnUrl,
                                    target: "https://brid.gy/publish/github",
                                    callback: "https://eddiehinkle.com/webmention/callback"
                                }
                            }, (err, data) => {
                                if (err != undefined) {
                                    console.log(`ERROR: ${err}`);
                                }
                                if (data.statusCode !== 201 && data.statusCode !== 202) {
                                    console.log("oops github reply syndication error");
                                } else {
                                    console.log("Successfully sent github reply syndication webmention");
                                }
                            });

                            // Send normal webmention process
                            getWebmentionUrl(replyToUrl, function (err, webmentionUrl) {
                                if (err) throw err;

                                // If post's webmention receiver is not micro.blog, then send a copy to micro.blog
                                if (webmentionUrl !== 'https://micro.blog/webmention') {
                                    request.post('https://micro.blog/webmention', {
                                        form: {
                                            source: returnUrl,
                                            target: replyToUrl
                                        }
                                    }, (err, data) => {
                                        if (err != undefined) {
                                            console.log(`ERROR: ${err}`);
                                        }
                                        if (data.statusCode !== 201 && data.statusCode !== 202) {
                                            console.log("oops micro.blog webmention error");
                                        } else {
                                            console.log("Successfully sent micro.blog webmention");
                                        }
                                    });
                                }

                                request.post(config.telegraph.url, {
                                    form: {
                                        token: config.telegraph.token,
                                        source: returnUrl,
                                        target: replyToUrl,
                                        callback: "https://eddiehinkle.com/webmention/callback"
                                    }
                                }, (err, data) => {
                                    if (err != undefined) {
                                        console.log(`ERROR: ${err}`);
                                    }
                                    if (data.statusCode !== 201 && data.statusCode !== 202) {
                                        console.log("oops reply of webmention error");
                                    } else {
                                        console.log("Successfully sent reply of webmention");
                                    }
                                });

                            });
                        }

                    });
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
            //.then(() => { return jekyll.runJekyllBuild(); })
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
        

}

function formatUrl(micropubDocument): Promise<any> {
	return new Promise((resolve, reject) => {
        console.log("Formatting URL");

        if (micropubDocument.properties['mp-slug'] === undefined) {
            let date;
            if (micropubDocument.properties.published != undefined) {
                let dateString = (micropubDocument.properties.published instanceof Array ? micropubDocument.properties.published[0] : micropubDocument.properties.published);
                date = moment(dateString);
            } else {
                date = moment();
            }

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
        } else {
            resolve(`https://eddiehinkle.com/${micropubDocument.properties['mp-slug'][0]}`);
            console.log("Finished URL Formatting");
        }
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

function formatFilenameForLukeSyndication(data) {
    console.log("Formatting Filename");
    let date = moment(data.date, "YYYY-MM-DD HH:mm:ss ZZ");
    let year = date.format("YYYY");
    let month = date.format("MM");
    let day = date.format("DD");

    let yearDir = lukeDataDir + year + "/";
    if (!fs.existsSync(yearDir)) {
        fs.mkdirSync(yearDir);
        console.log(yearDir + " created");
    }

    let monthDir = yearDir + month + "/";
    if (!fs.existsSync(monthDir)) {
        fs.mkdirSync(monthDir);
        console.log(monthDir + " created");
    }

    let dayDir = monthDir + day + "/";
    let postIndex = 1;
    if (!fs.existsSync(dayDir)) {
        fs.mkdirSync(dayDir);
        console.log(dayDir + " created");
    } else {
        let dirContents = fs.readdirSync(dayDir);
        dirContents = _.filter(dirContents, (filename) => {
            return (fs.statSync(dayDir + "/" + filename).isDirectory() && fs.existsSync(`${dayDir}${filename}/post.md`));
        });
        postIndex = dirContents.length + 1;
    }

    while(fs.existsSync(`${dayDir}/${postIndex}/post.md`)) {
        postIndex++;
    }

    let postDir = dayDir + postIndex + "/";

    if (!fs.existsSync(postDir)) {
        fs.mkdirSync(postDir);
        console.log(postDir + " created");
    }

    return `${postDir}post.md`;
}

function preparePostInfo(preformattedData) {
    return new Promise((resolve, reject) => {
        let properties = preformattedData.properties;

        let postDir;

        if (properties['mp-slug'] === undefined) {

            let date;
            if (properties.published != undefined) {
                let dateString = (properties.published instanceof Array ? properties.published[0] : properties.published);
                date = moment(dateString);
            } else {
                date = moment();
            }

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

            while (fs.existsSync(`${dayDir}/${postIndex}/post.md`)) {
                postIndex++;
            }

            postDir = `${dayDir}/${postIndex}`;

        } else {

            console.log('page filename');
            console.log(preformattedData);

            postDir = dataDir + "_note/pages/" + properties['mp-slug'][0];

            if (!fs.existsSync(postDir)) {
                fs.mkdirSync(postDir);
                console.log(postDir + " created");
            }

        }

        fs.writeFile(`${postDir}/post.md`, '', function(err) {
            if(err) {
                console.log(err);
                reject(err);
            }

            console.log(`Created: ${postDir}/post.md`);
            resolve({
                postIndex: postIndex,
                postDir: postDir
            });
        });
        // resolve({
        //     postIndex: postIndex,
        //     postDir: postDir
        // });
        
    });
}

interface LocationObject {
    longitude: number;
    latitude: number;
    uncertainty?: number;
}
