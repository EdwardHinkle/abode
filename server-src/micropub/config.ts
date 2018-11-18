import * as fs from 'fs';
import * as yaml from 'js-yaml';
import * as moment from "moment";
import {Posts} from "../model/posts.model";
import {Channel} from "../model/channel.model";
import {Categories} from "../model/categories.model";
import {Category} from "../model/category.model";
import {Card} from "../model/card.model";
import {Cards} from "../model/cards.model";

let config = require('../../abodeConfig.json');
let dataDir = __dirname + "/../../jekyll/_source/";
let imageDir = `${dataDir}/images`;
let entryImageDirName = `entry-images`;

let syndicateData = fs.readFileSync(__dirname + '/../../config/syndicate.yaml', 'utf8');
let syndicateTargets = yaml.safeLoad(syndicateData);
let syndicationChannels = Channel.getChannels().filter(channel => channel.type === 'static').map(channel => {
    return {
        name: `Channel: ${channel.name}`,
        uid: `https://eddiehinkle.com/${channel.id}`,
        shortcode: channel.id
    };
});

export function getMicropubConfig(queryType, req): Promise<any> {
    return Promise.resolve().then(function () {
        switch(queryType) {
            case 'syndicate-to':
                return {
                    "syndicate-to": syndicationChannels.concat(syndicateTargets)
                };
            case 'config':
                return {
                    "media-endpoint": "https://eddiehinkle.com/micropub/media",
                    "syndicate-to": syndicationChannels.concat(syndicateTargets),
                    "post-types": [
                        {
                            "type": "itinerary",
                            "name": "Itinerary"
                        },
                        {
                            "type": "event",
                            "name": "Event"
                        },
                        {
                            "type": "card",
                            "name": "Card"
                        },
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
            case 'category':
                let fetchedCategories: Promise<Category[]>;
                if (req.query.search === undefined) {
                    fetchedCategories = Categories.getAll();
                } else {
                    fetchedCategories = Categories.search({
                        tag_name: req.query.search
                    });
                }

                return fetchedCategories.then(categories => {
                    return {
                        categories: categories
                    }
                });
            case 'contact':
                let fetchedCards: Promise<Card[]>;
                if (req.query.search === undefined) {
                    fetchedCards = Cards.getAllContacts();
                } else {
                    // fetchedCards = Cards.searchContacts({
                    //     all: req.query.search
                    // });
                    return {
                        error: "Contact Search Unsupported"
                    };
                }

                return fetchedCards.then(cards => {
                    return {
                        contacts: cards
                    }
                });
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
                            "before": posts[0].getOfficialPermalink().split("/").slice(1, 5).join("-"),
                            "after": posts[posts.length - 1].getOfficialPermalink().split("/").slice(1, 5).join("-"),
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
