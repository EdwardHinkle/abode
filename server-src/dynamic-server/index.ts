import * as express from 'express';
import * as yaml from 'js-yaml';
import {Posts, SearchPostsInfo} from "../model/posts.model";
import {Post, PostType} from "../model/post.model";
import * as requestPromise from "request-promise";
import * as pug from 'pug';
import {Pages} from "../model/pages.model";
import * as fs from "fs";
import {ChannelData} from "../model/channel.model";
import {DataController} from "../model/data.controller";
import * as path from "path";
import {LocationController} from "../location/location.controller";
import {Mention} from "../model/mention.model";
import {Card} from "../model/card.model";
import * as moment from "moment-timezone";
import * as turf from "@turf/turf";
import * as geoViewport from "@mapbox/geo-viewport";
import {checkForUserToken} from "../indieauth/auto-auth";

export let dynamicRouter = express.Router();

dynamicRouter.use('/images/', express.static(path.join(__dirname, '../../images/')));
dynamicRouter.use('/resources/', express.static(path.join(__dirname, '../../resources/')));

// Static Routes
dynamicRouter.get('/', getHomepage);
dynamicRouter.get('/new-home', getHomepageNew);
dynamicRouter.get('/now', getNowPage);
dynamicRouter.get('/today/', forwardToToday);

// Channel Routes
dynamicRouter.get('/:channel([a-z\-]+)', requireDatabaseCache, getChannelFeed);
dynamicRouter.get('/:channel([a-z\-]+)/feed.json', requireDatabaseCache, getChannelJsonFeed);
dynamicRouter.get('/:channel([a-z\-]+)/feed.xml', requireDatabaseCache, getChannelRssFeed);

// Tag Routes
dynamicRouter.get('/tag/:tag([a-z0-9\-,]+)', requireDatabaseCache, getTagFeed);
dynamicRouter.get('/tag/:tag([a-z0-9\-,]+)/feed.json', requireDatabaseCache, getTagJsonFeed);
dynamicRouter.get('/tag/:tag([a-z0-9\-,]+)/feed.xml', requireDatabaseCache, getTagRssFeed);

// Interaction Routes
dynamicRouter.get('/interaction/:tagUrl([a-z0-9\-\.]+)', requireDatabaseCache, getInteractionFeed);
//dynamicRouter.get('/interaction/:tag([a-z0-9\-]+)/feed.json', requireDatabaseCache, getTagJsonFeed);
//dynamicRouter.get('/interaction/:tag([a-z0-9\-]+)/feed.xml', requireDatabaseCache, getTagRssFeed);

// Photo Routes
dynamicRouter.get('/photos/:year(\\d+)?/:month(\\d+)?/:day(\\d+)?/', requireDatabaseCache, getDatePhotoGallery);

// Date based Routes
dynamicRouter.get('/:year(\\d+)/', getYearSummary);
dynamicRouter.get('/:year(\\d+)/:month(\\d+)/', getMonthSummary);
dynamicRouter.get('/:year(\\d+)/:month(\\d+)/stats/', getMonthStats);
dynamicRouter.get('/:year(\\d+)/:month(\\d+)/:day(\\d+)/', getDaySummary);

// Post routes
dynamicRouter.get('/:year(\\d+)/:month(\\d+)/:day(\\d+)/:postIndex(\\d+)/debug/', debugPostData);
dynamicRouter.get('/:year(\\d+)/:month(\\d+)/:day(\\d+)/:postIndex(\\d+)/reindex/', reindexPost);
dynamicRouter.get('/:year(\\d+)/:month(\\d+)/:day(\\d+)/:postIndex(\\d+)/:postType?/', checkForUserToken, getPostPage);

// Generic page route
dynamicRouter.get('/:pageSlug', getPage);


function requireDatabaseCache(req, res, next) {
    if (DataController.available) {
        next();
    } else {
        return res.status(503).render('posts/errorMessage', {
            errorMessage: "Site is temporarily down for maintenance. Please try back in 10 minutes."
        });
    }
}

function getRequestedUrl(req) {
    return `${req.protocol}://${req.headers.host}${req.url}`;
}

function forwardToToday(req, res) {
    let today = moment();
    return res.redirect(`/${today.format("YYYY")}/${today.format("MM")}/${today.format("DD")}/`);
}

function getJSONFeedUrl(currentUrl: string) {
    let jsonFeedUrl = currentUrl;
    if (jsonFeedUrl.charAt(jsonFeedUrl.length-1) !== "/") {
        jsonFeedUrl = jsonFeedUrl + "/";
    }
    return jsonFeedUrl + "feed.json";
}

function getChannelFeed(req, res, next) {

    return new Promise((resolve, reject) => {
        
        console.log('user info');
        console.log(req.session.username);
        
        // Fetch Channel Data
        let channelData: ChannelData[] = JSON.parse(fs.readFileSync(`${__dirname}/../../jekyll/_source/_note/channels/channels.json`, 'utf8'));

        // Check to see if our channel exists
        let selectedChannel = channelData.filter(channel => channel.id === req.params.channel);

        // Return channel info
        resolve(selectedChannel.length > 0 ? selectedChannel[0] : undefined);
    }).then((channel: ChannelData) => {
        if (channel) {

            if (channel.type === 'static') {
                Posts.searchPosts({
                    inChannel: channel.id,
                    showPrivate: req.session.username === 'https://eddiehinkle.com/',
                    orderBy: ['published'],
                    orderDirection: ['DESC'],
                    limit: 20,
                }).then(posts => {
                    let currentUrl = getRequestedUrl(req);

                    res.render(`posts/${channel.layout}`, {
                        feed_url: currentUrl,
                        jsonfeed_url: getJSONFeedUrl(currentUrl),
                        title: channel.name,
                        posts: posts
                    })
                });
            } else if (channel.type === 'dynamic') {
                let channelQuery = channel.query;

                channelQuery.showPrivate = req.session.username === 'https://eddiehinkle.com/';

                Posts.searchPosts(channelQuery).then(posts => {

                    let finalPosts;

                    if (channel.layout === 'archives') {
                        finalPosts = [];
                        let yearIndex = 0;
                        let monthIndex = 0;
                        let lastYear = posts[0].properties.date.format("YYYY");
                        let lastMonth = posts[0].properties.date.format("MM");

                        posts.forEach(post => {
                            let year = post.properties.date.format("YYYY");
                            let month = post.properties.date.format("MM");
                            let monthLabel = post.properties.date.format("MMMM");

                            if (year != lastYear) {
                                yearIndex++;
                                monthIndex = 0;
                            } else if (month != lastMonth) {
                                monthIndex++;
                            }

                            if (finalPosts[yearIndex] === undefined) {
                                finalPosts[yearIndex] = {label: year, items: []};
                            }

                            if (finalPosts[yearIndex].items[monthIndex] === undefined) {
                                finalPosts[yearIndex].items[monthIndex] = {label: monthLabel, items: []};
                            }

                            finalPosts[yearIndex].items[monthIndex].items.push(post);

                            lastYear = year;
                            lastMonth = month;
                        });
                    } else {
                        finalPosts = posts;
                    }

                    let currentUrl = getRequestedUrl(req);

                    res.render(`posts/${channel.layout}`, {
                        feed_url: currentUrl,
                        jsonfeed_url: getJSONFeedUrl(currentUrl),
                        title: channel.name,
                        posts: finalPosts
                    })
                });
            }

        } else {
            next();
        }
    });

}

function getChannelJsonFeed(req, res, next) {

    return new Promise((resolve, reject) => {
        // Fetch Channel Data
        let channelData: ChannelData[] = JSON.parse(fs.readFileSync(`${__dirname}/../../jekyll/_source/_note/channels/channels.json`, 'utf8'));

        // Check to see if our channel exists
        let selectedChannel = channelData.filter(channel => channel.id === req.params.channel);

        // Return channel info
        resolve(selectedChannel.length > 0 ? selectedChannel[0] : undefined);
    }).then((channel: ChannelData) => {
        if (channel) {

            if (channel.type === 'static') {
                Posts.searchPosts({
                    inChannel: channel.id,
                    showPrivate: req.session.username === 'https://eddiehinkle.com/',
                    orderBy: ['published'],
                    orderDirection: ['DESC'],
                    limit: 20
                }).then(posts => {

                    convertPostsToJsonFeed(posts, `${channel.name} Feed`, getRequestedUrl(req)).then(jsonFeed => {
                        res.json(jsonFeed);
                    });

                });
            } else if (channel.type === 'dynamic') {
                let channelQuery = channel.query;

                channelQuery.showPrivate = req.session.username === 'https://eddiehinkle.com/',
                channelQuery.limit = 40;

                Posts.searchPosts(channelQuery).then(posts => {

                    convertPostsToJsonFeed(posts, `${channel.name} Feed`, getRequestedUrl(req)).then(jsonFeed => {
                        res.json(jsonFeed);
                    });

                });
            }

        } else {
            next();
        }
    });

}

function getChannelRssFeed(req, res, next) {

    return new Promise((resolve, reject) => {
        // Fetch Channel Data
        let channelData: ChannelData[] = JSON.parse(fs.readFileSync(`${__dirname}/../../jekyll/_source/_note/channels/channels.json`, 'utf8'));

        // Check to see if our channel exists
        let selectedChannel = channelData.filter(channel => channel.id === req.params.channel);

        // Return channel info
        resolve(selectedChannel.length > 0 ? selectedChannel[0] : undefined);
    }).then((channel: ChannelData) => {
        if (channel) {

            if (channel.type === 'static') {
                Posts.searchPosts({
                    inChannel: channel.id,
                    showPrivate: req.session.username === 'https://eddiehinkle.com/',
                    orderBy: ['published'],
                    orderDirection: ['DESC'],
                    limit: 20
                }).then(posts => {
                    res.set('Content-Type', 'application/rss+xml');
                    res.render('posts/rss-feed', {
                        title: `${channel.name} Feed`,
                        posts: posts,
                        description: 'This is a sample description',
                        feed_url: getRequestedUrl(req),
                        parent_url: getRequestedUrl(req).replace("feed.xml", ""),
                        date: moment().format("ddd, DD MMM YYYY HH:mm:ss ZZ")
                    });

                });
            } else if (channel.type === 'dynamic') {
                let channelQuery = channel.query;

                channelQuery.showPrivate = req.session.username === 'https://eddiehinkle.com/';
                channelQuery.limit = 40;

                Posts.searchPosts(channelQuery).then(posts => {
                    res.set('Content-Type', 'application/rss+xml');
                    res.render('posts/rss-feed', {
                        title: `${channel.name} Feed`,
                        posts: posts,
                        description: 'This is a sample description',
                        feed_url: getRequestedUrl(req),
                        parent_url: getRequestedUrl(req).replace("feed.xml", ""),
                        date: moment().format("ddd, DD MMM YYYY HH:mm:ss ZZ")
                    });

                });
            }

        } else {
            next();
        }
    });

}

function getInteractionFeed(req, res, next) {
    let tagUrl = req.params.tagUrl;
    
    Card.loadCard(tagUrl).then(card => {
        Posts.searchPosts({
            taggedWith: [card.getRepresentitiveUrl()],
            showPrivate: req.session.username === 'https://eddiehinkle.com/',
            orderBy: ['published'],
            orderDirection: ['DESC'],
            limit: 20
        }).then(posts => {
    
            let currentUrl = getRequestedUrl(req);
    
            res.render(`posts/cards`, {
                feed_url: currentUrl,
                jsonfeed_url: getJSONFeedUrl(currentUrl),
                title: `Interactions with ${card.getName()}`,
                posts: posts
            })
        });
    });
    
}

function getTagFeed(req, res, next) {

    let tags: string[];
    
    if (req.params.tag.indexOf(",") > -1) {
        tags = req.params.tag.split(",").map(tag => tag.toLowerCase());
    } else {
        tags = [req.params.tag.toLowerCase()];
    }

    Posts.searchPosts({
        taggedWith: tags,
        showPrivate: req.session.username === 'https://eddiehinkle.com/',
        orderBy: ['published'],
        orderDirection: ['DESC'],
        limit: 20
    }).then(posts => {

        let currentUrl = getRequestedUrl(req);

        res.render(`posts/cards`, {
            feed_url: currentUrl,
            jsonfeed_url: getJSONFeedUrl(currentUrl),
            title: tags.join(" and "),
            posts: posts
        })
    });

}

function getTagJsonFeed(req, res, next) {

    let tags: string[];
    
    if (req.params.tag.indexOf(",") > -1) {
        tags = req.params.tag.split(",").map(tag => tag.toLowerCase());
    } else {
        tags = [req.params.tag.toLowerCase()];
    }

    Posts.searchPosts({
        taggedWith: tags,
        showPrivate: req.session.username === 'https://eddiehinkle.com/',
        orderBy: ['published'],
        orderDirection: ['DESC'],
        limit: 20
    }).then(posts => {
        convertPostsToJsonFeed(posts, `${tags.join(" and ")} tag feed`, getRequestedUrl(req)).then(jsonFeed => {
            res.json(jsonFeed);
        });
    });

}

function getTagRssFeed(req, res, next) {

    let tags: string[];
    
    if (req.params.tag.indexOf(",") > -1) {
        tags = req.params.tag.split(",").map(tag => tag.toLowerCase());
    } else {
        tags = [req.params.tag.toLowerCase()];
    }

    Posts.searchPosts({
        taggedWith: tags,
        showPrivate: req.session.username === 'https://eddiehinkle.com/',
        orderBy: ['published'],
        orderDirection: ['DESC'],
        limit: 20
    }).then(posts => {
        res.set('Content-Type', 'application/rss+xml');
        res.render('posts/rss-feed', {
            title: `${tags.join(" and ")} tag Feed`,
            posts: posts,
            description: `This is a feed of posts that are tagged with #{tags.join(" and ")}`,
            feed_url: getRequestedUrl(req),
            parent_url: getRequestedUrl(req).replace("feed.xml", ""),
            date: moment().format("ddd, DD MMM YYYY HH:mm:ss ZZ")
        });
    });

}

function convertPostsToJsonFeed(posts: Post[], feed_title: string, feed_url: string): Promise<any> {

    return new Promise<any>((resolve, reject) => {

        let jsonFeed = {
            "version": "https://jsonfeed.org/version/1",
            "title": feed_title,
            "home_page_url": "https://eddiehinkle.com/",
            "feed_url": feed_url,
            "hubs": [
                {
                    "type": "WebSub",
                    "url": "https://switchboard.p3k.io/"
                }
            ],
            "author": {
                "name": "Eddie Hinkle",
                "url": "https://eddiehinkle.com/",
                "avatar": "https://eddiehinkle.com/images/profile.jpg"
            },
            "items": []
        };

        posts.forEach(post => {

            let feedItem: any = {
                "id": `https://eddiehinkle.com${post.getOfficialPermalink()}`,
                "url": `https://eddiehinkle.com${post.getOfficialPermalink()}`,
                "date_published": post.properties.date.format()
            };

            if (post.properties.name !== undefined && post.properties.name > "") {
                feedItem.title = post.properties.name;
            }

            feedItem.content_html = pug.renderFile(`${__dirname}/../../views/posts/jsonfeed-item.pug`, {
                post: post
            });

            jsonFeed.items.push(feedItem);

        });

        resolve(jsonFeed);

    });
}

function reindexPost(req, res) {
    let year = req.params.year;
    let month = req.params.month;
    let day = req.params.day;
    let postIndex = req.params.postIndex;

    Posts.getPost({
        year: year,
        month: month,
        day: day,
        postIndex: postIndex
    }).then(post => {

        console.log('Time to reindex this post');
        console.log(post);

        post.reindexCache();
        res.redirect(post.getOfficialPermalink());

    });
}

function getPostPage(req, res) {

    let year = req.params.year;
    let month = req.params.month;
    let day = req.params.day;
    let postIndex = req.params.postIndex;

    Posts.getPost({
        year: year,
        month: month,
        day: day,
        postIndex: postIndex
    }).then(post => {

        // Check if it is private and if you are authenticated
        console.log(req.session.username + ' trying to access ' + post.getPostDir());
        if (!post.isAccessibleByUser(req.session.username)) {
            console.log("tried to view a private post without being authenticated");
            res.setHeader('WWW-Authenticate', 'Bearer scope="read"');
            res.setHeader('Link', '<https://eddiehinkle.com/auth/token>; rel="token_endpoint"');

            res.status(401).render("posts/errorMessage", {
                errorMessage: "Sorry, the post you are looking for is still processing"
            });
            return;
        }

        // Check if the post path is the official permalink path.
        if (!post.verifyPostPermalink(req)) {
            // Redirect to the official permalink path
            res.redirect(302, post.getOfficialPermalink());
            return;
        }

        let mentions = {};
        let initialMentions = Mention.getMentionsForPost(post);
        initialMentions.sort((a, b) => a.published.diff(b.published));
        initialMentions.forEach(mention => {

            let mentionType = mention.getMentionType();

            if (mentions[mentionType] === undefined) {
                mentions[mentionType] = [];
            }

            mentions[mentionType].push(mention);
        });

        // Now we need to display the post
        res.render("posts/fullPost", {
            post: post,
            mentions: mentions
        });
        return;
    }).catch(error => {
        if (error !== undefined) {
            console.log(`Failed to load post ${year}/${month}/${day}/${postIndex}`);
            console.log(error);
            res.render("posts/errorMessage", {
                errorMessage: "Sorry, the post you are looking for is still processing"
            });
            return;
        }
    });

}

function getPage(req, res, next) {

    Pages.getPage({
        slug: req.params.pageSlug
    }).then(page => {

        res.render("posts/fullPost", {
            post: page
        });

    }).catch(error => {
        console.log("ERROR", error);
        next();
    });

}

function getYearSummary(req, res, next) {

    let pageDate = moment();
    pageDate.year(req.params.year);
    
    let now = moment().hour(0).minute(0).second(0).millisecond(0);

    Posts.getPosts({
        year: pageDate.format("YYYY")
    }).then(posts => {

        posts.sort((a: Post, b: Post) => {
            return b.properties.date.diff(a.properties.date);
        });
       
        let currentUrl = getRequestedUrl(req);       
        
        let watchPosts = [];
        let listenPosts = [];
        let consumed = [];
        let social = [];
        let podcasts = [];
        let articles = [];
        let postsWithoutType = [];
        let photos = [];
        let checkins = [];

        posts.forEach((post, index) => {
            let postType = post.getPostType();

            switch(postType) {
                case PostType.Audio:
                    podcasts.push(post);
                    break;
                case PostType.Drank:
                case PostType.Ate:
                    if (consumed.length > 0) {
                        let lastMeal = consumed[consumed.length - 1];
                        if (lastMeal[0].properties.date.diff(post.properties.date, 'minutes') < 30) {
                            consumed[consumed.length - 1].push(post);
                        } else {
                            consumed.push([post]);
                        }
                    } else {
                        consumed.push([post]);
                    }
                    break;
                case PostType.Checkin:
                    checkins.push(post);
                     break;
                case PostType.Photo:
                    photos.push(post);
                    break;
                case PostType.Watch:
                    let tvShowExists = watchPosts.filter(checkPost => checkPost.properties['show_name'] === post.properties['show_name'] && checkPost.properties['show_season'] === post.properties['show_season']);
                    if (tvShowExists.length === 0) {
                        watchPosts.push(post);
                    }
                    break;
                case PostType.Listen:
                    let podcastExists = listenPosts.filter(checkPost => {
                        if (checkPost.properties['listen-of'].properties.author === undefined || post.properties['listen-of'].properties.author === undefined) {
                            return true;
                        } else {
                            return checkPost.properties['listen-of'].properties.author.properties.name === post.properties['listen-of'].properties.author.properties.name;
                        }
                    });
                    if (podcastExists.length === 0) {
                        listenPosts.push(post);
                    }
                    break;
                case PostType.Note:
                    social.push(post);
                    break;
                case PostType.Article:
                    articles.push(post);
                    break;
                case PostType.Like:
                case PostType.Reply:
                case PostType.Bookmark:
                    social.push(post);
                    break;
                default:
                    postsWithoutType.push(post);
            }
        });
        
        let checkinImageUrl;
        
        if (checkins.length > 0) {
            let checkinPoints = checkins.map(checkin => checkin.getGeoJson('checkin'))
/*             let mapCenter = turf.centroid({
                "type": "FeatureCollection",
                "features": checkinPoints
            });
            */ 
            let checkinMarkers = checkinPoints.map(point => `pin-m+24b1f3(${point.geometry.coordinates[0]},${point.geometry.coordinates[1]})`).join(",");
            
            let checkinBox = turf.bbox({
                "type": "FeatureCollection",
                "features": checkinPoints
            });
            
            let mapWidth = 800;
            let mapHeight = 400;
            console.log('checkin box');
            console.log(checkinBox);
            let mapCenter = geoViewport.viewport(checkinBox, [mapWidth, mapHeight])
            let mapZoomLevel = mapCenter.zoom - 2;
            if (mapZoomLevel < 0) {
                mapZoomLevel = 0;
            }
            if (mapZoomLevel > 13) {
                mapZoomLevel = 13;
            }
            
            if (checkinMarkers) { 
                checkinImageUrl = `https://api.mapbox.com/styles/v1/mapbox/streets-v9/static/${checkinMarkers}/${mapCenter.center[0]},${mapCenter.center[1]},${mapZoomLevel},0,0/${mapWidth}x${mapHeight}@2x?access_token=pk.eyJ1IjoiZWRkaWVoaW5rbGUiLCJhIjoiY2oxa3o1aXdiMDAwNDMzbjFjNGQ0ejl1eSJ9.WQZ6i6b-TYYe_96IQ6iXdg&attribution=false&logo=false`;
            }
        
        }

        let pageData: any = {
            feed_url: currentUrl,
            jsonfeed_url: getJSONFeedUrl(currentUrl),
            title: `${pageDate.format("YYYY")}`,
            posts: postsWithoutType,
            watchPosts: watchPosts,
            listenPosts: listenPosts,
            consumed: consumed,
            social: social,
            podcasts: podcasts,
            articles: articles,
            photos: photos,
            checkinImageUrl: checkinImageUrl
        };

        let nextDate = pageDate.clone().add(1, "year");
        if (now.diff(nextDate, "year") >= 0) {
            let linkDate = nextDate;
            pageData.next = {
                label: `${linkDate.format("YYYY")}`,
                link: `/${linkDate.format("YYYY")}/`
            }
        }

        let previousDate = pageDate.clone().subtract(1, "year");
        if (moment("06/21/1987", "MM/DD/YYYY").diff(previousDate, "year") < 0) {
            let linkDate = previousDate;
            pageData.previous = {
                label: `${linkDate.format("YYYY")}`,
                link: `/${linkDate.format("YYYY")}/`
            }
        }

        res.render("posts/monthSummary", pageData);
    }).catch(error => {
        console.log("ERROR", error);
        next();
    });
}

function getMonthSummary(req, res, next) {

    let pageDate = moment();
    pageDate.year(req.params.year);
    pageDate.month(parseInt(req.params.month)-1);

    let now = moment().hour(0).minute(0).second(0).millisecond(0);

    Posts.getPosts({
        year: pageDate.format("YYYY"),
        month: pageDate.format("MM")
    }).then(posts => {

        posts.sort((a: Post, b: Post) => {
            return b.properties.date.diff(a.properties.date);
        });

        let currentUrl = getRequestedUrl(req);
        
        let watchPosts = [];
        let listenPosts = [];
        let consumed = [];
        let social = [];
        let podcasts = [];
        let articles = [];
        let postsWithoutType = [];
        let photos = [];
        let checkins = [];

        posts.forEach((post, index) => {
            let postType = post.getPostType();

            switch(postType) {
                case PostType.Audio:
                    podcasts.push(post);
                    break;
                case PostType.Drank:
                case PostType.Ate:
                    if (consumed.length > 0) {
                        let lastMeal = consumed[consumed.length - 1];
                        if (lastMeal[0].properties.date.diff(post.properties.date, 'minutes') < 30) {
                            consumed[consumed.length - 1].push(post);
                        } else {
                            consumed.push([post]);
                        }
                    } else {
                        consumed.push([post]);
                    }
                    break;
                case PostType.Checkin:
                    checkins.push(post);
                     break;
                case PostType.Photo:
                    photos.push(post);
                    break;
                case PostType.Watch:
                    let tvShowExists = watchPosts.filter(checkPost => checkPost.properties['show_name'] === post.properties['show_name'] && checkPost.properties['show_season'] === post.properties['show_season']);
                    if (tvShowExists.length === 0) {
                        watchPosts.push(post);
                    }
                    break;
                case PostType.Listen:
                    let podcastExists = listenPosts.filter(checkPost => {
                        if (checkPost.properties['listen-of'].properties.author === undefined || post.properties['listen-of'].properties.author === undefined) {
                            return true;
                        } else {
                            return checkPost.properties['listen-of'].properties.author.properties.name === post.properties['listen-of'].properties.author.properties.name;
                        }
                    });
                    if (podcastExists.length === 0) {
                        listenPosts.push(post);
                    }
                    break;
                case PostType.Note:
                    social.push(post);
                    break;
                case PostType.Article:
                    articles.push(post);
                    break;
                case PostType.Like:
                case PostType.Reply:
                case PostType.Bookmark:
                    social.push(post);
                    break;
                default:
                    postsWithoutType.push(post);
            }
        });
        
        let checkinImageUrl;
        
        if (checkins.length > 0) {
            let checkinPoints = checkins.map(checkin => checkin.getGeoJson('checkin'))
/*             let mapCenter = turf.centroid({
                "type": "FeatureCollection",
                "features": checkinPoints
            });
            */ 
            let checkinMarkers = checkinPoints.map(point => `pin-m+24b1f3(${point.geometry.coordinates[0]},${point.geometry.coordinates[1]})`).join(",");
            
            let checkinBox = turf.bbox({
                "type": "FeatureCollection",
                "features": checkinPoints
            });
            
            let mapWidth = 800;
            let mapHeight = 400;
            console.log('checkin box');
            console.log(checkinBox);
            let mapCenter = geoViewport.viewport(checkinBox, [mapWidth, mapHeight])
            let mapZoomLevel = mapCenter.zoom - 2;
            if (mapZoomLevel < 0) {
                mapZoomLevel = 0;
            }
            if (mapZoomLevel > 13) {
                mapZoomLevel = 13;
            }
            
            if (checkinMarkers) { 
                checkinImageUrl = `https://api.mapbox.com/styles/v1/mapbox/streets-v9/static/${checkinMarkers}/${mapCenter.center[0]},${mapCenter.center[1]},${mapZoomLevel},0,0/${mapWidth}x${mapHeight}@2x?access_token=pk.eyJ1IjoiZWRkaWVoaW5rbGUiLCJhIjoiY2oxa3o1aXdiMDAwNDMzbjFjNGQ0ejl1eSJ9.WQZ6i6b-TYYe_96IQ6iXdg&attribution=false&logo=false`;
            }
        
        }

        let pageData: any = {
            feed_url: currentUrl,
            jsonfeed_url: getJSONFeedUrl(currentUrl),
            title: `${pageDate.format("MMMM YYYY")}`,
            posts: postsWithoutType,
            watchPosts: watchPosts,
            listenPosts: listenPosts,
            consumed: consumed,
            social: social,
            podcasts: podcasts,
            articles: articles,
            photos: photos,
            checkinImageUrl: checkinImageUrl
        };

        let nextDate = pageDate.clone().add(1, "month");
        if (now.diff(nextDate, "month") >= 0) {
            let linkDate = nextDate;
            pageData.next = {
                label: `${linkDate.format("MMM YYYY")}`,
                link: `/${linkDate.format("YYYY")}/${linkDate.format("MM")}/`
            }
        }

        let previousDate = pageDate.clone().subtract(1, "month");
        if (moment("06/21/1987", "MM/DD/YYYY").diff(previousDate, "month") < 0) {
            let linkDate = previousDate;
            pageData.previous = {
                label: `${linkDate.format("MMM YYYY")}`,
                link: `/${linkDate.format("YYYY")}/${linkDate.format("MM")}/`
            }
        }

        res.render(`posts/monthSummary`, pageData);

    }).catch(error => {
        console.log("ERROR", error);
        next();
    });
}

function getDaySummary(req, res, next) {

    let pageDate = moment();
    pageDate.year(req.params.year);
    pageDate.month(parseInt(req.params.month)-1);
    pageDate.date(parseInt(req.params.day));
    pageDate.hour(0).minute(0).second(0).millisecond(0);

    let now = moment().hour(0).minute(0).second(0).millisecond(0);

    if (now.diff(pageDate, "day") < 0) {

        res.render("posts/futureDay", {
            today: {
                label: `Check out what's happening today`,
                link: `/${now.format("YYYY")}/${now.format("MM")}/${now.format("DD")}/`
            }
        });
        return;

    }

    Posts.getPosts({
        year: pageDate.format("YYYY"),
        month: pageDate.format("MM"),
        day: pageDate.format("DD")
    }).then(posts => {

        posts.sort((a: Post, b: Post) => {
            return b.properties.date.diff(a.properties.date);
        });

        let watchPosts = [];
        let listenPosts = [];
        let consumed = [];
        let social = [];
        let podcasts = [];
        let articles = [];
        let postsWithoutType = [];
        let photos = [];
        let checkins = [];
        let likes = [];
        let replies = [];
        let reacji = [];
        let bookmarks = [];

        posts.forEach((post, index) => {
            let postType = post.getPostType();

            switch(postType) {
                case PostType.Audio:
                    podcasts.push(post);
                    break;
                case PostType.Drank:
                case PostType.Ate:
                    if (consumed.length > 0) {
                        let lastMeal = consumed[consumed.length - 1];
                        if (lastMeal[0].properties.date.diff(post.properties.date, 'minutes') < 30) {
                            consumed[consumed.length - 1].push(post);
                        } else {
                            consumed.push([post]);
                        }
                    } else {
                        consumed.push([post]);
                    }
                    break;
                case PostType.Checkin:
                    checkins.push(post);
                     break;
                case PostType.Photo:
                    photos.push(post);
                    break;
                case PostType.Watch:
                    watchPosts.push(post);
                    break;
                case PostType.Listen:
                    listenPosts.push(post);
                    break;
                case PostType.Note:
                    social.push(post);
                    break;
                case PostType.Article:
                    articles.push(post);
                    break;
                case PostType.Like:
                    likes.push(post);
                    break;
                case PostType.Reply:
                    replies.push(post);
                    break;
                case PostType.Bookmark:
                    bookmarks.push(post);
                    break;
                case PostType.Reacji:
                    reacji.push(post);
                    break;
                default:
                    postsWithoutType.push(post);
            }
        });
        
        let checkinImageUrl;
        
        if (checkins.length > 0) {
            let checkinPoints = checkins.map(checkin => checkin.getGeoJson('checkin'))
/*             let mapCenter = turf.centroid({
                "type": "FeatureCollection",
                "features": checkinPoints
            });
            */ 
            let checkinMarkers = checkinPoints.map(point => `pin-m+24b1f3(${point.geometry.coordinates[0]},${point.geometry.coordinates[1]})`).join(",");
            
            let checkinBox = turf.bbox({
                "type": "FeatureCollection",
                "features": checkinPoints
            });
            
            let mapWidth = 800;
            let mapHeight = 400;
            console.log('checkin box');
            console.log(checkinBox);
            let mapCenter = geoViewport.viewport(checkinBox, [mapWidth, mapHeight])
            let mapZoomLevel = mapCenter.zoom - 2;
            if (mapZoomLevel < 0) {
                mapZoomLevel = 0;
            }
            if (mapZoomLevel > 13) {
                mapZoomLevel = 13;
            }
            
            if (checkinMarkers) { 
                checkinImageUrl = `https://api.mapbox.com/styles/v1/mapbox/streets-v9/static/${checkinMarkers}/${mapCenter.center[0]},${mapCenter.center[1]},${mapZoomLevel},0,0/${mapWidth}x${mapHeight}@2x?access_token=pk.eyJ1IjoiZWRkaWVoaW5rbGUiLCJhIjoiY2oxa3o1aXdiMDAwNDMzbjFjNGQ0ejl1eSJ9.WQZ6i6b-TYYe_96IQ6iXdg&attribution=false&logo=false`;
            }
        
        }

        let pageData: any = {
            title: `${pageDate.format("MMM DD, YYYY")}`,
            posts: postsWithoutType,
            watchPosts: watchPosts,
            listenPosts: listenPosts,
            consumed: consumed,
            social: social,
            checkins: checkins,
            podcasts: podcasts,
            articles: articles,
            photos: photos,
            likes: likes,
            bookmarks: bookmarks,
            replies: replies,
            reacji: reacji,
            checkinImageUrl: checkinImageUrl
        };

        let nextDate = pageDate.clone().add(1, "day");
        if (now.diff(nextDate, "day") >= 0) {
            let linkDate = nextDate;
            pageData.next = {
                label: `${linkDate.format("MMM DD, YYYY")}`,
                link: `/${linkDate.format("YYYY")}/${linkDate.format("MM")}/${linkDate.format("DD")}/`
            }
        }

        let previousDate = pageDate.clone().subtract(1, "day");
        if (moment("06/21/1987", "MM/DD/YYYY").diff(previousDate, "day") < 0) {
            let linkDate = previousDate;
            pageData.previous = {
                label: `${linkDate.format("MMM DD, YYYY")}`,
                link: `/${linkDate.format("YYYY")}/${linkDate.format("MM")}/${linkDate.format("DD")}/`
            }
        }

        res.render("posts/daySummary", pageData);
    }).catch(error => {
        console.log("ERROR", error);
        next();
    });
}

function getMonthStats(req, res, next) {

    let currentMonth = moment();
    currentMonth.year(req.params.year);
    currentMonth.month(parseInt(req.params.month) - 1);
    let lastMonth = currentMonth.clone();
    lastMonth.subtract(1, "month");

    let postPromises = [];

    postPromises.push(Posts.getPosts({
        year: currentMonth.format("YYYY"),
        month: currentMonth.format("MM")
    }));

    // postPromises.push(Posts.getPosts({
    //     year: lastMonth.format("YYYY"),
    //     month: lastMonth.format("MM")
    // }));

    Promise.all(postPromises).then(posts => {

        let thisMonthPosts = posts[0];
        // let lastMonthPosts = posts[1];

        let currentPodcasts = [];
        let currentArticles = [];
        let currentPhotos = [];
        let finales = [];
        let premieres = [];
        let shows = [];
        let movies = [];
        let currentListens = [];
        let ate = {};
        let drank = {};

        let postsWithoutType = [];

        thisMonthPosts.forEach((post, index) => {
            let postType = post.getPostType();

            switch(postType) {
                case PostType.Audio:
                    currentPodcasts.push(post);
                    break;
                case PostType.Drank:
                    let drankName = post.properties.drank.properties.name;
                    if (drank[drankName] === undefined) {
                        drank[drankName] = 1;
                    } else {
                        drank[drankName]++;
                    }
                    break;
                case PostType.Ate:
                    let ateName = post.properties.ate.properties.name;
                    if (ate[ateName] === undefined) {
                        ate[ateName] = 1;
                    } else {
                        ate[ateName]++;
                    }
                    break;
                // case PostType.Checkin:
                //     if (latestCheckin === undefined) {
                //         latestCheckin = post;
                //     }
                //     break;
                case PostType.Photo:
                    currentPhotos.push(post);
                    break;
                case PostType.Watch:
                    if (post.properties['show_name']) {
                        if (post.properties['season_finale'] || post.properties['show_finale']) {
                            finales.push(post);
                        }
                        if (post.properties['season_premiere'] || post.properties['show_premiere']) {
                            premieres.push(post);
                        }
                        shows.push(post);
                    } else if (post.properties['movie_name']) {
                        movies.push(post);
                    }
                    break;
                case PostType.Listen:
                    currentListens.push(post);
                    break;
                // case PostType.Note:
                //     social.push(post);
                //     break;
                case PostType.Article:
                    currentArticles.push(post);
                    break;
                // case PostType.Like:
                // case PostType.Reply:
                // case PostType.Bookmark:
                //     social.push(post);
                //     break;
                default:
                    postsWithoutType.push(post);
            }
        });

        res.render("posts/monthStats", {
            title: `${currentMonth.format("MMM YYYY")}`,
            posts: postsWithoutType,
            currentPodcasts: currentPodcasts,
            currentArticles: currentArticles,
            currentPhotos: currentPhotos,
            finales: finales,
            premieres: premieres,
            movies: movies,
            shows: shows,
            currentListens: currentListens,
            ate: ate,
            drank: drank
        });
    }).catch(error => {
        console.log("ERROR", error);
        next();
    });
}

function getDatePhotoGallery(req, res) {

    let searchQuery: SearchPostsInfo = {
        hasType: [PostType.Photo],
        showPrivate: req.session.username === 'https://eddiehinkle.com/',
        orderBy: ['published'],
        orderDirection: ['DESC'],
    };

    if (req.params.year) {
        searchQuery.years = [req.params.year];
    }

    if (req.params.month) {
        searchQuery.months = [req.params.month+1];
    }

    if (req.params.day) {
        searchQuery.days = [req.params.day];
    }

    if (searchQuery.years === undefined) {
        let today = moment();
        searchQuery.years = [today.year()];
        searchQuery.months = [today.month()+1];

        if (today.date() < 5) {
            // If we are less then 5 days into the new month, we should also show last months photos
            searchQuery.months.push(today.month());
        }
    }

    Posts.searchPosts(searchQuery).then(posts => {
        res.render("posts/photos", {
            posts: posts,

        });
    });

}

function getHomepage(req, res, next) {

    if (DataController.available) {

        let retrievePosts: Promise<Post[]>[] = [];

        retrievePosts.push(LocationController.getCachedLocation());

        retrievePosts.push(Posts.searchPosts({
            hasType: [PostType.Checkin],
            orderBy: ["published"],
            orderDirection: ["DESC"],
            limit: 1,
            showPrivate: req.session.username === 'https://eddiehinkle.com/'
        }, false));

        retrievePosts.push(Posts.searchPosts({
            hasType: [PostType.Listen],
            orderBy: ["published"],
            orderDirection: ["DESC"],
            limit: 4,
            showPrivate: req.session.username === 'https://eddiehinkle.com/'
        }, false));

        retrievePosts.push(Posts.searchPosts({
            hasType: [PostType.Watch],
            orderBy: ["published"],
            orderDirection: ["DESC"],
            limit: 4,
            showPrivate: req.session.username === 'https://eddiehinkle.com/'
        }, false));

        retrievePosts.push(Posts.searchPosts({
            hasType: [PostType.Photo],
            orderBy: ["published"],
            orderDirection: ["DESC"],
            limit: 4,
            showPrivate: req.session.username === 'https://eddiehinkle.com/'
        }, false));

        retrievePosts.push(Posts.searchPosts({
            hasType: [PostType.Note],
            inChannel: "timeline",
            orderBy: ["published"],
            orderDirection: ["DESC"],
            limit: 2,
            showPrivate: req.session.username === 'https://eddiehinkle.com/'
        }, false));

        retrievePosts.push(Posts.searchPosts({
            hasType: [PostType.Article],
            orderBy: ["published"],
            orderDirection: ["DESC"],
            limit: 3,
            showPrivate: req.session.username === 'https://eddiehinkle.com/'
        }, false));

        retrievePosts.push(Posts.searchPosts({
            hasType: [PostType.Bookmark, PostType.Like, PostType.Reply, PostType.Repost, PostType.RSVP, PostType.Reacji],
            orderBy: ["published"],
            orderDirection: ["DESC"],
            limit: 54,
            showPrivate: req.session.username === 'https://eddiehinkle.com/'
        }, false));

        retrievePosts.push(Posts.searchPosts({
            hasType: [PostType.Audio],
            orderBy: ["published"],
            orderDirection: ["DESC"],
            limit: 4,
            showPrivate: req.session.username === 'https://eddiehinkle.com/'
        }, false));


        Promise.all(retrievePosts).then(posts => {

            let location = posts[0] as any;

            // let latestDrank: Post;
            // let latestAte: Post[] = [];
            let latestCheckin: Post = posts[1][0];
            let latestListen: Post[] = posts[2];
            let latestWatch: Post[] = posts[3];
            let latestPhoto: Post[] = [];
            let latestPhotoCount: number = 0;
            let latestNotes: Post[] = posts[5];
            let latestArticles: Post[] = posts[6];
            let latestSocial: Post[] = posts[7];
            let latestPodcast: Post[] = posts[8];

            posts[4].forEach(photoPost => {
                if (latestPhotoCount < 4) {
                    latestPhoto.push(photoPost);
                    latestPhotoCount += photoPost.properties.photo.length;
                }
            });
            
            let localTime = moment.tz(location.geocode.timezone).format("LT z");
            
            let mapUrl = {
                light: "background-image: url(https://api.mapbox.com/styles/v1/eddiehinkle/cj5csefaa0ei72rphz5zgl03b/static/" + latestCheckin.properties.checkin.properties.longitude + "," + latestCheckin.properties.checkin.properties.latitude + ",8,0,60/1280x400@2x?access_token=pk.eyJ1IjoiZWRkaWVoaW5rbGUiLCJhIjoiY2oxa3o1aXdiMDAwNDMzbjFjNGQ0ejl1eSJ9.WQZ6i6b-TYYe_96IQ6iXdg&attribution=false&logo=false)",
                dark: "background-image: url(https://api.mapbox.com/styles/v1/eddiehinkle/cj5csefaa0ei72rphz5zgl03b/static/" + latestCheckin.properties.checkin.properties.longitude + "," + latestCheckin.properties.checkin.properties.latitude + ",8,0,60/1280x400@2x?access_token=pk.eyJ1IjoiZWRkaWVoaW5rbGUiLCJhIjoiY2oxa3o1aXdiMDAwNDMzbjFjNGQ0ejl1eSJ9.WQZ6i6b-TYYe_96IQ6iXdg&attribution=false&logo=false)"
            };

            res.render("homepage/homepage", {
                // latestDrank: latestDrank,
                // latestAte: latestAte.reverse(),
                localtime: localTime,
                mapUrl: mapUrl,
                location: location,
                latestCheckin: latestCheckin,
                latestListen: latestListen,
                latestWatch: latestWatch,
                latestPhoto: latestPhoto,
                latestNotes: latestNotes,
                latestArticles: latestArticles,
                latestSocial: latestSocial,
                latestPodcasts: latestPodcast
            });

        });

    } else {
        let numberOfPreviousDays = 10;

        let combinedPromises: Promise<Post[]>[] = [];

        for (let date = moment(); moment().diff(date, "days") < numberOfPreviousDays; date.subtract(1, "day")) {

            combinedPromises.push(Posts.getPosts({
                year: date.format("YYYY"),
                month: date.format("MM"),
                day: date.format("DD"),
                required: moment().diff(date, "days") !== 0 // Require every day except today (today doesn't always have posts)
            }));

        }

        Promise.all(combinedPromises)
            .catch(error => {
                console.log("error loading homepage", error);
                return combinedPromises;
            })
            .then(arrayOfPosts => {

                let posts = [].concat.apply([], arrayOfPosts);
                let latestDrank: Post;
                let latestAte: Post[] = [];
                let latestCheckin: Post;
                let latestListen: Post[] = [];
                let latestWatch: Post;
                let latestPhoto: Post[] = [];
                let latestPhotoCount: number = 0;
                let latestNotes: Post[] = [];
                let latestArticles: Post[] = [];
                let latestSocial: Post[] = [];
                let latestPodcast: Post;

                posts.sort((a: Post, b: Post) => {
                    return b.properties.date.diff(a.properties.date);
                });

                posts.forEach(post => {
                    let postType = post.getPostType();

                    switch(postType) {
                        case PostType.Audio:
                            if (latestPodcast === undefined) {
                                latestPodcast = post;
                            }
                            break;
                        case PostType.Drank:
                            if (latestDrank === undefined) {
                                latestDrank = post;
                            }
                            break;
                        case PostType.Ate:
                            if (latestAte.length === 0) {
                                latestAte.push(post);
                            } else if (latestAte[0].properties.date.diff(post.properties.date, 'minutes') < 30) {
                                latestAte.push(post);
                            }
                            break;
                        case PostType.Checkin:
                            if (latestCheckin === undefined) {
                                latestCheckin = post;
                            }
                            break;
                        case PostType.Watch:
                            if (latestWatch === undefined && (post.properties.show_name !== undefined || post.properties.movie_name !== undefined)) {
                                latestWatch = post;
                            }
                            break;
                        case PostType.Listen:
                            if (latestListen.length < 4) {
                                latestListen.push(post);
                            }
                            break;
                        case PostType.Note:
                            if (latestNotes.length < 10) {
                                latestNotes.push(post);
                            }
                            break;
                        case PostType.Article:
                            if (latestArticles.length < 10 && post.isPublic()) {
                                latestArticles.push(post);
                            }
                            break;
                        case PostType.Like:
                        case PostType.Reply:
                        case PostType.Bookmark:
                        case PostType.Reacji:
                            latestSocial.push(post);
                            break;
                        default:
                    }

                    if (latestPhotoCount < 4) {
                        if (post.properties.photo !== undefined &&
                            post.properties.photo.length > 0 &&
                            post.getPostType() !== PostType.Listen &&
                            post.getPostType() !== PostType.Watch &&
                            post.getPostType() !== PostType.Audio &&
                            post.properties.category.indexOf("reading") === -1) {

                            latestPhotoCount += post.properties.photo.length;
                            latestPhoto.push(post);
                        }
                    }
                });

                res.render("homepage/homepage", {
                    latestDrank: latestDrank,
                    latestAte: latestAte.reverse(),
                    latestCheckin: latestCheckin,
                    latestListen: latestListen,
                    latestWatch: latestWatch,
                    latestPhoto: latestPhoto,
                    latestNotes: latestNotes,
                    latestArticles: latestArticles,
                    latestSocial: latestSocial,
                    latestPodcast: latestPodcast
                });
            });
    }

}

function getHomepageNew(req, res, next) {

    if (DataController.available) {

        let retrievePosts: Promise<Post[]>[] = [];

        retrievePosts.push(LocationController.getCachedLocation());

        retrievePosts.push(Posts.searchPosts({
            hasType: [PostType.Checkin],
            orderBy: ["published"],
            orderDirection: ["DESC"],
            limit: 1,
            showPrivate: req.session.username === 'https://eddiehinkle.com/'
        }, false));

        retrievePosts.push(Posts.searchPosts({
            hasType: [PostType.Listen],
            orderBy: ["published"],
            orderDirection: ["DESC"],
            limit: 4,
            showPrivate: req.session.username === 'https://eddiehinkle.com/'
        }, false));

        retrievePosts.push(Posts.searchPosts({
            hasType: [PostType.Watch],
            orderBy: ["published"],
            orderDirection: ["DESC"],
            limit: 1,
            showPrivate: req.session.username === 'https://eddiehinkle.com/'
        }, false));

        retrievePosts.push(Posts.searchPosts({
            hasType: [PostType.Photo],
            orderBy: ["published"],
            orderDirection: ["DESC"],
            limit: 4,
            showPrivate: req.session.username === 'https://eddiehinkle.com/'
        }, false));

        retrievePosts.push(Posts.searchPosts({
            hasType: [PostType.Note],
            inChannel: "timeline",
            orderBy: ["published"],
            orderDirection: ["DESC"],
            limit: 10,
            showPrivate: req.session.username === 'https://eddiehinkle.com/'
        }, false));

        retrievePosts.push(Posts.searchPosts({
            hasType: [PostType.Article],
            orderBy: ["published"],
            orderDirection: ["DESC"],
            limit: 5,
            showPrivate: req.session.username === 'https://eddiehinkle.com/'
        }, false));

        retrievePosts.push(Posts.searchPosts({
            hasType: [PostType.Bookmark, PostType.Like, PostType.Reply, PostType.Repost, PostType.RSVP, PostType.Reacji],
            orderBy: ["published"],
            orderDirection: ["DESC"],
            limit: 54,
            showPrivate: req.session.username === 'https://eddiehinkle.com/'
        }, false));

        retrievePosts.push(Posts.searchPosts({
            hasType: [PostType.Audio],
            orderBy: ["published"],
            orderDirection: ["DESC"],
            limit: 1,
            showPrivate: req.session.username === 'https://eddiehinkle.com/'
        }, false));


        Promise.all(retrievePosts).then(posts => {

            let location = posts[0];

            // let latestDrank: Post;
            // let latestAte: Post[] = [];
            let latestCheckin: Post = posts[1][0];
            let latestListen: Post[] = posts[2];
            let latestWatch: Post = posts[3][0];
            let latestPhoto: Post[] = [];
            let latestPhotoCount: number = 0;
            let latestNotes: Post[] = posts[5];
            let latestArticles: Post[] = posts[6];
            let latestSocial: Post[] = posts[7];
            let latestPodcast: Post = posts[8][0];

            posts[4].forEach(photoPost => {
                if (latestPhotoCount < 4) {
                    latestPhoto.push(photoPost);
                    latestPhotoCount += photoPost.properties.photo.length;
                }
            });

            res.render("homepage/homepage-new", {
                // latestDrank: latestDrank,
                // latestAte: latestAte.reverse(),
                location: location,
                latestCheckin: latestCheckin,
                latestListen: latestListen,
                latestWatch: latestWatch,
                latestPhoto: latestPhoto,
                latestNotes: latestNotes,
                latestArticles: latestArticles,
                latestSocial: latestSocial,
                latestPodcast: latestPodcast
            });

        });

    } else {
        let numberOfPreviousDays = 10;

        let combinedPromises: Promise<Post[]>[] = [];

        for (let date = moment(); moment().diff(date, "days") < numberOfPreviousDays; date.subtract(1, "day")) {

            combinedPromises.push(Posts.getPosts({
                year: date.format("YYYY"),
                month: date.format("MM"),
                day: date.format("DD"),
                required: moment().diff(date, "days") !== 0 // Require every day except today (today doesn't always have posts)
            }));

        }

        Promise.all(combinedPromises)
            .catch(error => {
                console.log("error loading homepage", error);
                return combinedPromises;
            })
            .then(arrayOfPosts => {

                let posts = [].concat.apply([], arrayOfPosts);
                let latestDrank: Post;
                let latestAte: Post[] = [];
                let latestCheckin: Post;
                let latestListen: Post[] = [];
                let latestWatch: Post;
                let latestPhoto: Post[] = [];
                let latestPhotoCount: number = 0;
                let latestNotes: Post[] = [];
                let latestArticles: Post[] = [];
                let latestSocial: Post[] = [];
                let latestPodcast: Post;

                posts.sort((a: Post, b: Post) => {
                    return b.properties.date.diff(a.properties.date);
                });

                posts.forEach(post => {
                    let postType = post.getPostType();

                    switch(postType) {
                        case PostType.Audio:
                            if (latestPodcast === undefined) {
                                latestPodcast = post;
                            }
                            break;
                        case PostType.Drank:
                            if (latestDrank === undefined) {
                                latestDrank = post;
                            }
                            break;
                        case PostType.Ate:
                            if (latestAte.length === 0) {
                                latestAte.push(post);
                            } else if (latestAte[0].properties.date.diff(post.properties.date, 'minutes') < 30) {
                                latestAte.push(post);
                            }
                            break;
                        case PostType.Checkin:
                            if (latestCheckin === undefined) {
                                latestCheckin = post;
                            }
                            break;
                        case PostType.Watch:
                            if (latestWatch === undefined && (post.properties.show_name !== undefined || post.properties.movie_name !== undefined)) {
                                latestWatch = post;
                            }
                            break;
                        case PostType.Listen:
                            if (latestListen.length < 4) {
                                latestListen.push(post);
                            }
                            break;
                        case PostType.Note:
                            if (latestNotes.length < 10) {
                                latestNotes.push(post);
                            }
                            break;
                        case PostType.Article:
                            if (latestArticles.length < 10 && post.isPublic()) {
                                latestArticles.push(post);
                            }
                            break;
                        case PostType.Like:
                        case PostType.Reply:
                        case PostType.Bookmark:
                        case PostType.Reacji:
                            latestSocial.push(post);
                            break;
                        default:
                    }

                    if (latestPhotoCount < 4) {
                        if (post.properties.photo !== undefined &&
                            post.properties.photo.length > 0 &&
                            post.getPostType() !== PostType.Listen &&
                            post.getPostType() !== PostType.Watch &&
                            post.getPostType() !== PostType.Audio &&
                            post.properties.category.indexOf("reading") === -1) {

                            latestPhotoCount += post.properties.photo.length;
                            latestPhoto.push(post);
                        }
                    }
                });

                res.render("homepage/homepage-new", {
                    latestDrank: latestDrank,
                    latestAte: latestAte.reverse(),
                    latestCheckin: latestCheckin,
                    latestListen: latestListen,
                    latestWatch: latestWatch,
                    latestPhoto: latestPhoto,
                    latestNotes: latestNotes,
                    latestArticles: latestArticles,
                    latestSocial: latestSocial,
                    latestPodcast: latestPodcast
                });
            });
    }

}


function debugPostData(req, res) {

    console.log('DEBUG Post');

    let year = req.params.year;
    let month = req.params.month;
    let day = req.params.day;
    let postIndex = req.params.postIndex;

    let promises = [];
    let postInfo = {
        year: year,
        month: month,
        day: day,
        postIndex: postIndex
    };

    promises.push(Posts.getPostData(postInfo));
    promises.push(Posts.getPost(postInfo));

    Promise.all(promises).then(postArray => {

        let yamlFileArray = postArray[0].split("---\n");
        let yamlData = yaml.safeLoad(yamlFileArray[1]);

        let saveData = postArray[1].getSaveObject();

        // Now we need to display the post
        res.render("posts/debugPost", {
            fileData: JSON.stringify(yamlData, null, 2),
            postData: JSON.stringify(saveData, null, 2)
        });
        return;

    }).catch(error => {
        if (error !== undefined) {
            console.log('url failed');
            console.log(error);
            res.render("posts/errorMessage", {
                errorMessage: "post not able to be found"
            });
            return;
        }
    });

}

function getNowPage(req, res, next) {
    let config = req.app.get('config');

    let promises = [];
    let currentTrip;

    let locationRequestPromise = new Promise((resolve, reject) => {

        promises.push(requestPromise.get(`${config.compass.url}api/trip?token=${config.compass.token.read}`, {
            json: true
        }).then(tripData => {
            currentTrip = tripData.trip;
            let startLocation = currentTrip.start_location.geometry.coordinates;
            let locationRequestUrl = `https://atlas.p3k.io/api/geocode?latitude=${startLocation[1]}&longitude=${startLocation[0]}`;
            console.log(locationRequestUrl);
            requestPromise.get(locationRequestUrl, { json: true }).then(locationInfo => {
                resolve(locationInfo);
            })
        }));
    });

    promises.push(locationRequestPromise);

    promises.push(Pages.getPage({
        slug: 'now'
    }));

    Promise.all(promises).then(data => {

        console.log('now page');

        let startLocation = data[1];
        let page = data[2];

        console.log(currentTrip);
        console.log(startLocation);

        currentTrip.travel_length = moment(currentTrip.start).fromNow();
        currentTrip.current_speed = currentTrip.current_location.properties.speed > 0 ? (currentTrip.current_location.properties.speed * 2.236936) : -1;
        currentTrip.origin_location = startLocation;
        currentTrip.current_time = moment(currentTrip.origin_location.localtime).format("h:mma");

        res.render("posts/nowPage", {
            post: page,
            trip: currentTrip,
            startLocation: startLocation
        });

    }).catch(error => {
        console.log("ERROR", error);
        next();
    });

}
