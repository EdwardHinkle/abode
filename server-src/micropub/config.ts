import * as fs from 'fs';
import * as yaml from 'js-yaml';
import * as moment from "moment";
import {Posts} from "../model/posts.model";

let config = require('../../abodeConfig.json');
let dataDir = __dirname + "/../../jekyll/_source/";
let imageDir = `${dataDir}/images`;
let entryImageDirName = `entry-images`;

let syndicateData = fs.readFileSync(__dirname + '/../../config/syndicate.yaml', 'utf8');
let syndicateTargets = yaml.safeLoad(syndicateData);

export function getMicropubConfig(queryType, req): Promise<any> {
    return Promise.resolve().then(function () {
        switch(queryType) {
            case 'syndicate-to':
                return {
                    "syndicate-to": syndicateTargets
                };
            case 'config':
                return {
                    "media-endpoint": "https://eddiehinkle.com/micropub/media",
                    "syndicate-to": syndicateTargets,
                    "post-types": [
                        {
                            "type": "note",
                            "name": "Note"
                        },
                        {
                            "type": "article",
                            "name": "Article"
                        },
                        {
                            "type": "photo",
                            "name": "Photo"
                        },
                        {
                            "type": "video",
                            "name": "Video"
                        },
                        {
                            "type": "audio",
                            "name": "Podcast"
                        },
                        {
                            "type": "reply",
                            "name": "Reply"
                        },
                        {
                            "type": "like",
                            "name": "Like"
                        },
                        {
                            "type": "repost",
                            "name": "Repost"
                        },
                        {
                            "type": "rsvp",
                            "name": "RSVP"
                        },
                        {
                            "type": "bookmark",
                            "name": "Bookmark"
                        }
                    ]
                };
            case 'source':
                if (req.query.url === undefined) {
                    let thisYear = moment().format("YYYY");
                    let thisMonth = moment().format("MM");

                    return Posts.getPosts({
                        year: thisYear,
                        month: thisMonth
                    }).then(posts => {

                        if (req.query['post-type'] !== undefined) {
                            posts = posts.filter(post => post.getPostType().toLowerCase() === req.query['post-type']);
                        }

                        if (req.query.limit !== undefined) {
                            posts = posts.slice(0, req.query.limit);
                        }

                        return {
                            "before": posts[0].getOfficialPermalink().split("/").slice(1, 4).join("-"),
                            "items": posts.map(post => post.toMf2())
                        };
                    });
                } else {
                    let urlSegments = req.query.url.split("/");
                    let year = urlSegments[3];
                    let month = urlSegments[4];
                    let day = urlSegments[5];
                    let index = urlSegments[6];

                    return Posts.getPost({
                        year: year,
                        month: month,
                        day: day,
                        postIndex: index
                    }).then(post => {
                        let requestedProperties;

                        if (req.query.properties !== undefined && req.query.properties.length > 0) {
                            requestedProperties = req.query.properties;
                        } else if (typeof req.query.properties === 'string') {
                            requestedProperties = [req.query.properties];
                        }

                        return post.toMf2(requestedProperties);
                    });
                }
        }
    });
}