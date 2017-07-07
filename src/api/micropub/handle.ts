import * as MicropubFormatter from 'format-microformat';
import * as moment from 'moment';
import * as fs from 'fs';
import * as path from 'path';
import * as http from 'http';
import * as _ from 'lodash';
import * as mfTypes from '../mf2';
import * as yaml from 'js-yaml';
import * as toMarkdown from 'to-markdown';
import * as mfo from 'mf-obj';

const imageType = require('image-type');
const readingTime = require('reading-time');

import { People } from '../people';

const config = require('../../../abodeConfig.json');
const dataDir = __dirname + '/../../../data/';
const imageDir = `${dataDir}/images`;
const entryImageDirName = `entry-images`;

const formatter = new MicropubFormatter();

// Support Functions
export function convertMicropubToJekyll(micropubDocument, req): Promise<any> {
    console.log('Micropub Retrieved');
    console.log(micropubDocument);

    // This section is mainly to log everything for debugging later
    const writeJson = JSON.stringify(micropubDocument, null, 2);

    fs.writeFile(path.join(__dirname, '../../log-files/' + moment().format('YYYY-MM-DD-HH:mm:ss') + '.json'), writeJson, (err) => {
        if (err) {
            return console.log(err);
        }
    });
    // This is the end of the debugging section

    const authorizedPostTypes: [mfTypes.postType] = [
        'Checkin',
        'Ate',
        'Drank',
        'Note',
        'Like',
        'Reply',
        'Article',
        'Photo',
        'Repost'
    ];

    const tagsForPostType = {
        'Checkin': ['checkin'],
        'Ate': ['ate'],
        'Drank': ['drank']
    }

    const micropubPropertiesToIgnore = [
        'published',
        'syndication',
        'content',
        'name',
        'category',
        'post-status',
        'mp-slug',
        'place_name'
    ]

    const micropubPropertiesToExpand = [
        'like-of',
        'repost-of',
        'in-reply-to'
    ]

    console.log('Post Type Check');
    const micropubPostType = mfTypes.getPostType(micropubDocument);
    console.log(micropubPostType);
    console.log(authorizedPostTypes.indexOf(micropubPostType) > -1);

    if (authorizedPostTypes.indexOf(micropubPostType) > -1) {

            return new Promise((resolve, reject) => { resolve(); }).then(() => {

            return preparePostInfo(micropubDocument).then(function(postInfo: any){

                    new Promise((resolve, reject) => {

                        const yamlDocument: any = {};
                        const yamlDocumentReady = [];

                        // Take Micropub Document and Modify to Output Structure to match YAML

                        console.log('Before date');

                        // For posts the date needs to be in the root object
                        if (micropubDocument.properties.published !== undefined) {
                            const dateString = (micropubDocument.properties.published instanceof Array ?
                                                micropubDocument.properties.published[0] : micropubDocument.properties.published);
                            yamlDocument.date = moment(dateString).format('YYYY-MM-DD HH:mm:ss ZZ');
                        } else {
                            yamlDocument.date = moment().format('YYYY-MM-DD HH:mm:ss ZZ');
                        }

                        console.log('After published date');

                        // Jekyll is always markdown
                        yamlDocument['content-type'] = 'text/markdown';

                        // Bring in client_id
                        if (micropubDocument.client_id !== undefined) {
                            yamlDocument.client_id = micropubDocument.client_id;
                        }

                        // Layout should be the type minus the prefix
                        yamlDocument.layout = micropubDocument.type[0].split('-').pop();

                        // Get visibility or default visibility to public
                        yamlDocument.visibility = micropubDocument.properties.visibility ?
                                            micropubDocument.properties.visibility : 'public';

                        // Get post-status or default post-status to published
                        yamlDocument['post-status'] = micropubDocument.properties['post-status'] ?
                                        micropubDocument.properties['post-status'] : 'published';

                        // Convert name to title
                        if (micropubDocument.properties.name !== undefined) {
                            if (micropubDocument.properties.name instanceof Array) {
                                yamlDocument.title = micropubDocument.properties.name[0];
                            } else {
                                yamlDocument.title = micropubDocument.properties.name;
                            }
                        }

                        let micropubContent: any = '';

                        // Check if content is an object
                        if (micropubDocument.properties.content instanceof Array) {
                            micropubContent = micropubDocument.properties.content[0];
                        } else {
                            micropubContent = micropubDocument.properties.content;
                        }

                        if (typeof micropubContent === 'object') {
                            if (micropubContent.html !== undefined) {
                                micropubContent = toMarkdown(micropubContent.html);
                            }
                        }

                        // if there is no title or if the title is the prefix to the content, ignore it
                        if (yamlDocument.title === undefined || micropubContent.indexOf(yamlDocument.title) === 0) {
                            yamlDocument.title = '';
                        }

                        if (yamlDocument.title > '' && micropubContent > '') {
                            // Add featured if there is a title and content
                            yamlDocument.featured = true;

                            // Add duration estimate
                            yamlDocument.duration = readingTime(micropubContent);
                        }

                        // Loop through all properties
                        // If they are an object, process them
                        yamlDocument.properties = {};

                        console.log('About to deal with properties');
                        for (const propertyName in micropubDocument.properties) {

                            // Make sure this isn't in the list of properties to ignore
                            if (micropubPropertiesToIgnore.indexOf(propertyName) === -1) {

                                console.log(`Working on property ${propertyName}`);
                                console.log(micropubDocument.properties[propertyName][0]);

                                if (typeof micropubDocument.properties[propertyName][0] === 'object' &&
                                    micropubDocument.properties[propertyName][0].type !== undefined) {
                                    yamlDocument.properties[propertyName] = {
                                        type: micropubDocument.properties[propertyName][0].type[0],
                                        properties: {}
                                    };
                                } else {
                                    // Specific Embeded Use-Cases

                                    // Add h-food to ate and drank
                                    if (propertyName === 'drank') {
                                        yamlDocument.properties[propertyName] = {
                                            type: 'h-food',
                                            properties: {}
                                        };
                                    }

                                    if (propertyName === 'ate') {
                                        yamlDocument.properties[propertyName] = {
                                            type: 'h-food',
                                            properties: {}
                                        };
                                    }
                                }

                                if (typeof yamlDocument.properties[propertyName] === 'object' &&
                                    yamlDocument.properties[propertyName].type) {

                                    console.log('In switch');

                                    switch (yamlDocument.properties[propertyName].type) {
                                        case 'h-card':
                                                for (const subPropertyName in micropubDocument.properties[propertyName][0].properties) {
                                                    // tslint:disable-next-line:max-line-length
                                                    if (micropubDocument.properties[propertyName][0].properties[subPropertyName] instanceof Array) {
                                                        yamlDocument.properties[propertyName].properties[subPropertyName] = micropubDocument.properties[propertyName][0].properties[subPropertyName][0];
                                                    } else {
                                                        // tslint:disable-next-line:max-line-length
                                                        yamlDocument.properties[propertyName].properties[subPropertyName] = micropubDocument.properties[propertyName][0].properties[subPropertyName];
                                                    }
                                                };
                                                break;
                                        default:
                                                // tslint:disable-next-line:max-line-length
                                                yamlDocument.properties[propertyName].properties = micropubDocument.properties[propertyName][0].properties;
                                                break;
                                    }
                                } else {
                                    console.log('Outside switch');
                                    if (typeof yamlDocument.properties[propertyName] === 'object') {
                                        // tslint:disable-next-line:max-line-length
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

                        console.log('About to deal with expanded context');
                        for (const propertyToExpand of micropubPropertiesToExpand) {

                            const getContextProperty = yamlDocument.properties[propertyToExpand];
                            if (typeof getContextProperty === 'string') {
                                console.log('Finding context for: ' + propertyToExpand);
                                yamlDocumentReady.push(mfo.getEntry(getContextProperty)
                                .then((entry) => {

                                    if (entry.name === undefined) {
                                        console.log('No name found: ');
                                        console.log(entry);
                                        throw new Error('No name found');
                                    }

                                    const entryPropertiesToAdd: any = {};

                                    entryPropertiesToAdd.name = entry.name;

                                    if (entry.url !== undefined) {
                                        entryPropertiesToAdd.url = entry.url;
                                    }

                                    if (entry.summary !== undefined) {
                                        entryPropertiesToAdd.summary = entry.summary;
                                    }

                                    if (entry.author !== undefined) {
                                        entryPropertiesToAdd.author = {
                                            type: 'h-card',
                                            properties: {
                                                name: entry.author.name,
                                                photo: entry.author.photo,
                                                url: entry.author.url,
                                                uid: entry.author.uid
                                            }
                                        }
                                    }

                                    if (entry.photo !== undefined) {
                                        entryPropertiesToAdd.photo = entry.photo;
                                    }

                                    yamlDocument.properties[propertyToExpand] = {
                                        type: 'h-cite',
                                        properties: entryPropertiesToAdd
                                    }
                                }).catch((err) => {
                                    if (err.message === 'All strategies failed: Error: Multiple h-entries found') {
                                        return mfo.getCard(getContextProperty).then((card) => {

                                            yamlDocument.properties[propertyToExpand] = {
                                                type: 'h-card',
                                                properties: card
                                            }

                                        }).catch((err2) => {
                                            console.log('Error trying to get card');
                                            console.log(err2);
                                            return;
                                        });
                                    } else {
                                        console.log('Error trying to get entry');
                                        console.log(err);
                                        return;
                                    }

                                }));
                            }
                        }

                        console.log('About to deal with location');

                        // Set up location
                        if (micropubDocument.properties.location !== undefined && micropubDocument.properties.location.length > 0) {
                            // Only use 1 location
                            const loc = micropubDocument.properties.location[0];

                            if (typeof loc === 'string') {
                                const locationObject = {
                                    type: 'h-adr',
                                    properties: {}
                                };

                                const geoInfo = loc.split('geo:').pop();
                                let locInfo: string[];
                                if (geoInfo.indexOf(';')) {
                                    locInfo = geoInfo.split(';');
                                } else {
                                    locInfo = [geoInfo];
                                }

                                const locArray = locInfo[0].split(',');
                                if (locArray.length > 0) {
                                     const locObject = {
                                        latitude: parseFloat(locArray[0]),
                                        longitude: parseFloat(locArray[1])
                                    } as LocationObject;

                                    if (locInfo.length > 1) {
                                        locObject.uncertainty = parseFloat(locInfo[1].split('=').pop());
                                    }
                                    locationObject.properties = locObject;
                                }
                                yamlDocument.properties.location = locationObject;
                            } else {
                                yamlDocument.properties.location = loc;
                            }
                        }

                        if (micropubDocument.properties.place_name !== undefined && micropubDocument.properties.place_name.length > 0) {

                            const placeName = micropubDocument.properties.place_name[0];
                            let placeSegments: string[];
                            if (placeName.indexOf(' - ') > -1) {
                                placeSegments = placeName.split(' - ');
                            } else {
                                if (placeName.indexOf(', ') > -1) {
                                    placeSegments = [undefined, placeName];
                                } else {
                                    placeSegments = [placeName];
                                }
                            }
                            const name = placeSegments[0];
                            if (placeSegments.length > 1 && placeSegments[1].indexOf(', ')) {
                                placeSegments = placeSegments[1].split(', ');
                            } else {
                                placeSegments = [placeSegments[1]];
                            }
                            const locality = placeSegments[0];
                            const region = placeSegments[1];

                            if (yamlDocument.properties.location === undefined) {
                                yamlDocument.properties.location = {
                                    type: 'h-adr',
                                    properties: {}
                                };
                            }

                            if (name !== undefined) {
                                yamlDocument.properties.location.type = 'h-card'
                                yamlDocument.properties.location.properties.name = name;
                            }

                            if (locality !== undefined) {
                                yamlDocument.properties.location.properties.locality = locality;
                            }
                            if (region !== undefined) {
                                yamlDocument.properties.location.properties.region = region;
                                yamlDocument.properties.location.properties['country-name'] = 'USA';
                            }

                        }

                        console.log('About to deal with syndication');

                        // Set up syndication
                        if (micropubDocument.properties.syndication !== undefined && micropubDocument.properties.syndication.length > 0) {
                            yamlDocument.properties.syndication = [];
                            for (const syndicated of micropubDocument.properties.syndication) {

                                let syndicatedObject;
                                if (syndicated.indexOf('swarmapp.com') > -1) {
                                    syndicatedObject = {
                                        name: 'Swarm',
                                        icon: 'fa-foursquare',
                                        url: syndicated
                                    }
                                }
                                if (syndicated.indexOf('instagram.com') > -1) {
                                    syndicatedObject = {
                                        name: 'Instagram',
                                        icon: 'fa-instagram',
                                        url: syndicated
                                    }
                                }
                                yamlDocument.properties.syndication.push(syndicatedObject);

                            };
                        }

                        console.log('About to deal with categories');

                        if (micropubContent !== undefined) {
                            yamlDocument.content = micropubContent as String;
                        } else {
                            yamlDocument.content = '';
                        }

                        // Convert categories to tags
                        yamlDocument.tags = micropubDocument.categories;

                        // If there weren't any categories, create the tags array
                        if (yamlDocument.tags === undefined) {
                            yamlDocument.tags = [];
                        }

                        // Add tags from properties
                        if (micropubDocument.properties.category !== undefined) {
                            yamlDocument.tags = yamlDocument.tags.concat(micropubDocument.properties.category);
                        }

                        // Add tags based on post type
                        if (tagsForPostType[micropubPostType] !== undefined) {
                            yamlDocument.tags = yamlDocument.tags.concat(tagsForPostType[micropubPostType]);
                        }

                        // Extract tags from post content
                        const regExTagToken = /#(\w*)/g
                        let match = null;
                        const foundTags = [];
                        while (match = regExTagToken.exec(micropubContent)) {
                            foundTags.push(match[1]);
                        }

                        for (const tag of foundTags) {
                            console.log(tag);
                            if (yamlDocument.tags.indexOf(tag) === -1) {
                                yamlDocument.tags.push(tag);
                            }
                            yamlDocument.content = yamlDocument.content.replace(`#${tag}`, '');
                        }

                        // Check if there are any person tags within the content
                        yamlDocumentReady.push(People.getPeople().then((people) => {

                            const regExNicknameToken = /@(\w*)/g
                            const foundIdentities = [];

                            while (match = regExNicknameToken.exec(micropubContent)) {
                                foundIdentities.push(match[1]);
                            }

                            // Set slug number to post index
                            yamlDocument.slug = '' + postInfo.postIndex;

                            // Create type slug for permalink based on post type but lowercase
                            const typeSlug = micropubPostType.toLowerCase();

                            // Create Permalink
                            yamlDocument.permalink = `/:year/:month/:day/:slug/${typeSlug}/`;

                            for (const nickname of foundIdentities) {
                                console.log(nickname);
                                const taggedPerson = people.getPersonByNickname(nickname);
                                console.log(taggedPerson);
                                if (taggedPerson !== undefined) {
                                    yamlDocument.tags.push(taggedPerson.getRepresentitiveUrl());
                                    yamlDocument.content = yamlDocument.content.replace(`@${nickname}`, '');
                                }
                            }

                            yamlDocument.content = yamlDocument.content.trim();

                            if (_.keys(yamlDocument.properties).length === 0) {
                                delete yamlDocument.properties;
                            }

                            // tslint:disable-next-line:max-line-length
                            if (micropubDocument.files !== undefined && micropubDocument.files.photo !== undefined && micropubDocument.files.photo.length > 0) {

                                if (yamlDocument.properties.photo === undefined) {
                                    yamlDocument.properties.photo = [];
                                }

                                let count = 1;
                                const date = moment(yamlDocument.date, 'YYYY-MM-DD HH:mm:ss ZZ');
                                const year = date.format('YYYY');
                                const month = date.format('MM');
                                const day = date.format('DD');

                                for (const image of micropubDocument.files.photo) {
                                    const imageBuffer = Buffer.from(image.buffer);
                                    const imageExt = imageType(imageBuffer).ext;

                                    // tslint:disable-next-line:max-line-length
                                    while (fs.existsSync(`${imageDir}/${entryImageDirName}/${year}-${month}-${day}_${yamlDocument.slug}_${count}.${imageExt}`)) {
                                        count++;
                                    }

                                    // tslint:disable-next-line:max-line-length
                                    fs.writeFileSync(`${imageDir}/${entryImageDirName}/${year}-${month}-${day}_${yamlDocument.slug}_${count}.${imageExt}`, imageBuffer);
                                    yamlDocument.properties.photo.push(`https://eddiehinkle.com/images/${entryImageDirName}/${year}-${month}-${day}_${yamlDocument.slug}_${count}.${imageExt}`)
                                    count++;
                                }
                            }

                        }));

                        Promise.all(yamlDocumentReady).then(() => {
                            console.log('Yaml Document Complete');
                            resolve(yamlDocument);
                        });

                    })
                    .then((yamlDocument: any) => {

                        // Move content out of yaml into the main body
                        let postContents = yamlDocument.content;
                        delete yamlDocument.content;

                        if (postContents === undefined ) {
                            postContents = '';
                        }

                        console.log('Testing YAML Data');
                        console.log(yamlDocument);

                        // Save YAML File
                        const fileData = '---\n' + yaml.safeDump(yamlDocument, { lineWidth: 800 }) + '---\n' + postContents;
                        const fileName = formatFilename(yamlDocument);

                        console.log(`Test Fileoutput for ${fileName}`);
                        console.log(fileData);

                        fs.writeFile(fileName, fileData, function(err) {
                            if (err) {
                                return console.log(err);
                            }

                            console.log(`Finished saving: ${fileName}`);
                        });

                        return;
                    })
                    .catch((error) => {
                        console.log('Caught Error');
                        console.log(error);
                    });

                    // Make sure the document has the post index
                    const micropubInfoForUrl = _.clone(micropubDocument);
                    micropubInfoForUrl.postInfo = postInfo;

                    // Return the URL
                    return formatUrl(micropubInfoForUrl).then(function(returnUrl) {
                        return { url: returnUrl };
                    });

                });

        });

    } else {
        console.log('Non-supported Micropub Recieved...check the log files');

        return Promise.resolve().then(function () {
            return { url: 'https://eddiehinkle.com/404' };
        });
    }
}

function formatUrl(micropubDocument): Promise<any> {
    return new Promise((resolve, reject) => {
        console.log('Formatting URL');
        let date;
        if (micropubDocument.properties.published !== undefined) {
            // tslint:disable-next-line:max-line-length
            const dateString = (micropubDocument.properties.published instanceof Array ? micropubDocument.properties.published[0] : micropubDocument.properties.published);
            date = moment(dateString);
        } else {
            date = moment();
        }

        const year = date.format('YYYY');
        const month = date.format('MM');
        const day = date.format('DD');

        const yearDir = dataDir + '_note/' + year + '/';
        const monthDir = yearDir + month + '/';
        const dayDir = monthDir + day + '/';

        const index = micropubDocument.postInfo.postIndex;

        // Create type slug for permalink based on post type but lowercase
        const micropubPostType = mfTypes.getPostType(micropubDocument);
        const typeSlug = micropubPostType.toLowerCase();

        resolve(`https://eddiehinkle.com/${year}/${month}/${day}/${index}/${typeSlug}/`);
        console.log('Finished URL Formatting');
    });
}

function formatFilename(data) {
        console.log('Formatting Filename');
        const date = moment(data.date, 'YYYY-MM-DD HH:mm:ss ZZ');
        const year = date.format('YYYY');
        const month = date.format('MM');
        const day = date.format('DD');

        const yearDir = dataDir + '_note/' + year + '/';
        const monthDir = yearDir + month + '/';
        const dayDir = monthDir + day + '/';

        const postDir = dayDir + data.slug + '/';

        if (!fs.existsSync(postDir)) {
            fs.mkdirSync(postDir);
            console.log(postDir + ' created');
        }

        return `${postDir}post.md`;
}

function preparePostInfo(preformattedData) {
    return new Promise((resolve, reject) => {
        const properties = preformattedData.properties;
        let date;
        if (properties.published !== undefined) {
            const dateString = (properties.published instanceof Array ? properties.published[0] : properties.published);
            date = moment(dateString);
        } else {
            date = moment();
        }

        const year = date.format('YYYY');
        const month = date.format('MM');
        const day = date.format('DD');

        let postIndex = 1;
        const yearDir = dataDir + '_note/' + year + '/';

        if (!fs.existsSync(yearDir)) {
            fs.mkdirSync(yearDir);
            console.log(yearDir + ' created');
        }

        const monthDir = yearDir + month + '/';
        if (!fs.existsSync(monthDir)) {
            fs.mkdirSync(monthDir);
            console.log(monthDir + ' created');
        }

        const dayDir = monthDir + day;

        if (!fs.existsSync(dayDir)) {
            fs.mkdirSync(dayDir);
            console.log(dayDir + ' created');
        } else {
            let dirContents = fs.readdirSync(dayDir);
            dirContents = _.filter(dirContents, (filename) => {
                return (fs.statSync(dayDir + '/' + filename).isDirectory() && fs.existsSync(`${dayDir}${filename}/post.md`));
            });
            postIndex = dirContents.length + 1;
        }

        while (fs.existsSync(`${dayDir}/${postIndex}/post.md`)) {
            postIndex++;
        }

        fs.writeFile(`${dayDir}/${postIndex}/post.md`, '', function(err) {
            if (err) {
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
