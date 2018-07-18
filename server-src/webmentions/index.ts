import * as request from 'request';
import * as _ from 'lodash';
import * as fs from 'fs';
import * as path from 'path';
import * as express from 'express';
import * as moment from 'moment';
import * as mfo from 'mf-obj';
import * as Bluebird from 'bluebird';
import * as multer from 'multer';
import {Posts} from "../model/posts.model";

let upload = multer();
var emojiData = require('emoji-data');
var config = require('../../abodeConfig.json');

export let webmentionRouter = express.Router();

// Routes
webmentionRouter.post('/callback', upload.array(), webmentionCallback);

function webmentionCallback(req, res, next) {
    console.log('WEBMENTION CALLBACK');
    console.log(req.body.source);
    if (req.body.http_body !== undefined) {
        let jsonBody = JSON.parse(req.body.http_body);
        console.log('JSON BODY');
        console.log(jsonBody);

        let filePathSegments = req.body.source.split("/");
        console.log(filePathSegments);

        let postYear = filePathSegments[3];
        let postMonth = filePathSegments[4];
        let postDay = filePathSegments[5];
        let postIndex = filePathSegments[6];

        let testSyndicationUrl = "https://twitter.com/jgmac1106/status/1019577386873049088";
        let syndicationDomain = testSyndicationUrl.split("/")[2];

        console.log('test syndication domain');
        console.log(syndicationDomain);

        Posts.getPost({
            year: postYear,
            month: postMonth,
            day: postDay,
            postIndex: postIndex
        }).then(post => {
            if (post.properties.syndication === undefined) {
                post.properties.syndication = [];
            }
            let syndicationIndex = post.properties.syndication.indexOf(syndication => syndication.url.indexOf(syndicationDomain) > -1);
            if (syndicationIndex > -1) {
                post.properties.syndication[syndicationIndex].url = testSyndicationUrl;
            } else {
                let newSyndication: any = {};

                switch (syndicationDomain) {
                    case 'twitter.com':
                        newSyndication.name = "Twitter";
                        newSyndication.icon = "fa-twitter";
                        break;
                    case 'github.com':
                        newSyndication.name = "GitHub";
                        newSyndication.icon = "fa-github";
                        break;
                    case 'www.facebook.com':
                        newSyndication.name = "Facebook";
                        newSyndication.icon = "fa-facebook";
                        break;
                    default:
                        newSyndication.name = syndicationDomain;
                        newSyndication.icon = "fa-globe";
                }

                newSyndication.url = testSyndicationUrl;
                post.properties.syndication.push(newSyndication);
            }

            console.log('post properties');
            console.log(post.properties);
        });

        if (req.body.http_code === 200 || req.body.http_code === 201 || req.body.http_code === 202) {
            console.log('WEBMENTION SUCCESS');

        } else {
            console.log('WEBMENTION FAILURE');
        }
    }
    res.status(200);
}


webmentionRouter.post('/alert', webmentionAlert);

function webmentionAlert(req, res) {
    
    let receivedWebmention = req.body as WebmentionIOFatPing;

    if (receivedWebmention.secret != "djasi83h9vhjdjsd3uhc9fhf") {
        console.log("Unauthorized Webmention Alert Attempt");
        res.status(401);
        return;
    }

    console.log("Received Webmention Alert");

    fs.writeFile(`${__dirname}/../../log-files/webmention/${moment().format("YYYY-MM-DD-HH:mm:ss")}.json`, JSON.stringify(req.body, null, 2), (err) => {
        if(err) {
            return console.log(err);
        }
    });

    let micropubNotification = {
        type: ['h-entry'],
        properties: {
            content: [receivedWebmention.post.name ? receivedWebmention.post.name : (receivedWebmention.post.content ? receivedWebmention.post.content.value : "")],
            url: [receivedWebmention.post.url],
            published: [receivedWebmention.post.published],
            author: [{
                type: ['h-card'],
                properties: {
                    name: [receivedWebmention.post.author.name],
                    url: [receivedWebmention.post.author.url],
                    photo: [receivedWebmention.post.author.photo]
                }
            }]
        }
    };

    var slackMessage = {
        "channel": "#website",
        "username": receivedWebmention.post.author.name,
        "icon_url": receivedWebmention.post.author.photo,
        "text": (receivedWebmention.post.name ? receivedWebmention.post.name : (receivedWebmention.post.content ? receivedWebmention.post.content.value : undefined)),
        "attachments": undefined
    }

    var finishedProcessing: Promise<any>[] = [];

    // If it is a like
    if (receivedWebmention.post["wm-property"] == "like-of") {
        let likeOfUrl = receivedWebmention.post[receivedWebmention.post['wm-property']];
         finishedProcessing.push(mfo.getEntry(likeOfUrl)
        .then(entry => {
            slackMessage.text = `<${receivedWebmention.post.url}|liked> <${likeOfUrl}|'${entry.name}'>`;
            micropubNotification.properties.content = [{
                html: `<a href="${receivedWebmention.post.url}">liked</a> <a href="${likeOfUrl}">${entry.name}</a>`,
                value: `liked ${entry.name} (${likeOfUrl})`,
            }];
        }).catch((error) => {
            slackMessage.text = `<${receivedWebmention.post.url}|liked> ${likeOfUrl}`;
             micropubNotification.properties.content = [{
                 html: `<a href="${receivedWebmention.post.url}">liked</a> <a href="${likeOfUrl}">${likeOfUrl}</a>`,
                 value: `liked ${likeOfUrl}`,
             }];
        }));
    }
    // If it is in reply to
    else if (receivedWebmention.post["wm-property"] == "in-reply-to") {
        let replyToUrl = receivedWebmention.post[receivedWebmention.post['wm-property']];
        finishedProcessing.push(mfo.getEntry(replyToUrl)
        .then(entry => {
            slackMessage.text = `<${receivedWebmention.post.url}|New Reply>: <${replyToUrl}|${entry.name}>`;
            let htmlContent = (receivedWebmention.post.content.html ? receivedWebmention.post.content.html : receivedWebmention.post.content.value);
            micropubNotification.properties.content = [{
                html: `${htmlContent} (<a href="${receivedWebmention.post.url}">in reply to</a>: <a href="${replyToUrl}">${entry.name}</a>)`,
                value: `${receivedWebmention.post.content.value} (in reply to: ${entry.name} [${replyToUrl}])`,
            }];
        }).catch((error) => {
            slackMessage.text = `<${receivedWebmention.post.url}|New Reply>: ${replyToUrl})`;
            let htmlContent = (receivedWebmention.post.content.html ? receivedWebmention.post.content.html : receivedWebmention.post.content.value);
            micropubNotification.properties.content = [{
                html: `${htmlContent} (<a href="${receivedWebmention.post.url}">in reply to</a>: ${replyToUrl})`,
                value: `${receivedWebmention.post.content.value} (in reply to: ${replyToUrl})`,
            }];
        }));

        if (receivedWebmention.post['swarm-coins'] != undefined) {
            micropubNotification.properties.content = [`${micropubNotification.properties.content} (${receivedWebmention.post['swarm-coins']} Coins Awarded)`];
        }
    }
    // We don't know what it is, act generically
    else {
        slackMessage.attachments = [
            {
                "fallback": `${receivedWebmention.post.author.name}: ${receivedWebmention.post.content.value}`,
                "color": "#36a64f",
                "author_name": (receivedWebmention.post.name ? receivedWebmention.post.name : 'Note'),
                "author_link": receivedWebmention.post.url,
                "title": receivedWebmention.post['wm-property'],
                "title_link": receivedWebmention.post[receivedWebmention.post['wm-property']],
                "fields": [],
            }
        ]
    }

    Promise.all(finishedProcessing).then(() => {

        if (receivedWebmention.post.author.name !== 'Swarm') {
            // Slack Incoming Webhook
            request.post({
                url: `https://hooks.slack.com/services/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`,
                json: slackMessage
            }, (err, data) => {
                if (err != undefined) {
                    console.log(`ERROR: ${err}`);
                }
                if (data.statusCode != 200) {
                    console.log("oops Slack Error");
                } else {
                    console.log("Successfully sent Slack Message");
                }

            });
        }

        request.post(`https://aperture.eddiehinkle.com/micropub/`, {
            'auth': {
                'bearer': `UI75OpITDk8Dd2J33JRhjsYHgsbNNVcY`
            },
            body: micropubNotification,
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
    });

    res.status(200).send("ok");

}

export function getWebmentionData(): Promise<any> {
    
    return new Promise((resolve, reject) => {
    
        request("https://webmention.io/api/mentions?token=" + config.webmention.token + "&perPage=500", {}, (err, data) => {
            if (err != undefined) {
                reject(err);
            }
            
            var webmentions = {};
            var webmentionData = JSON.parse(data.body);
            var webmentionsOfLinks = {};

            Bluebird.each(webmentionData.links, (mention: any) => {
                var targetPage = mention.target.split("eddiehinkle.com").pop().split("?")[0];

                if (targetPage == "/now" && mention.data.author != undefined && mention.data.author.name == "Swarm") {
                    return;
                }
                
                if (mention.activity.sentence != undefined && mention.activity.sentence.indexOf("on a post that linked to") > -1 ||
                    (mention.activity.type == "like" && mention.activity.sentence.indexOf("favorited a tweet") > -1)) {
                    if (webmentionsOfLinks[targetPage] === undefined) {
                        webmentionsOfLinks[targetPage] = [];
                    }
                    webmentionsOfLinks[targetPage].push(mention);
                } else {

                    if (webmentions[targetPage] === undefined) {
                        webmentions[targetPage] = { likes: [], replies: [], reactions: [], mentions: [], rsvps: [] }
                    }

                    switch(mention.activity.type) {
                        case 'like':
                            // Check if item exists
                            addOrCreateEmojiArray({shortName: "+1", display: "👍"}, webmentions[targetPage].reactions, mention);
                            break;
                        case 'link':
                            if (tryAddEmojiReaction(webmentions[targetPage].reactions, mention) == false) {
                                addReplaceOrIgnoreWebMention(webmentions[targetPage].mentions, mention);
                            }
                            break;
                        case 'rsvp':
                            addReplaceOrIgnoreWebMention(webmentions[targetPage].rsvps, mention);
                            break;
                        case 'reply':
                            if (mention.data.content !== null) {
                                if (tryAddEmojiReaction(webmentions[targetPage].reactions, mention) == false) {
                                    addReplaceOrIgnoreWebMention(webmentions[targetPage].replies, mention);
                                }
                            }
                            break;
                    }
                } 

            }).then(() => {

                var json = JSON.stringify(webmentions);
                fs.writeFile(path.join(__dirname, '../../jekyll/_source/_data/webmentions.json'), json, {
                    encoding: 'utf8'
                }, function(error){
                    if (error != undefined) {
                        reject(error);
                    }
                    console.log("Webmentions Retrieved");
                    resolve();
                }); 
                var linksJson = JSON.stringify(webmentionsOfLinks);
                fs.writeFile(path.join(__dirname, '../../jekyll/_source/_data/webmentions_of_links.json'), linksJson, {
                    encoding: 'utf8'
                }, function(error){
                    if (error != undefined) {
                        reject(error);
                    }
                    console.log("Webmentions of Links Retrieved");
                    resolve();
                }); 
            });
        });

    });
}

function tryAddEmojiReaction(reactionsArray, mention) {
    var emoji = getEmojiReaction(mention);
    if (emoji == undefined) {
        return false;
    } else {
        addOrCreateEmojiArray(emoji, reactionsArray, mention);
        return true;
    }
}

function addOrCreateEmojiArray(emoji, reactionsArray, mention) {
    var reactionIndex = _.findIndex(reactionsArray, (object: any) => {
        return object.code == emoji.shortName;
    });
    
    if (reactionIndex == -1) {
        reactionsArray.push({
            code: emoji.shortName,
            display: "" + emoji.display,
            // display: "" + emojiData.find_by_short_name(emoji),
            content: []
        });
        reactionIndex = reactionsArray.length-1;
    }
    addReplaceOrIgnoreWebMention(reactionsArray[reactionIndex].content, mention);
}

function getEmojiReaction(mention) {
    var emojiFound = undefined;

    if (mention.data.content !== null) {
        var stripContent = mention.data.content.replace(/<\/?[^>]+(>|$)/g, "").replace(/\n/g, "");

        emojiData.scan(stripContent).forEach(
            function (ec) {
                if (stripContent.length < 5) {
                    emojiFound = {shortName: ec.short_name, display: stripContent};
                }
            }
        );
    }

    return emojiFound;

}

function addReplaceOrIgnoreWebMention(current_array, mention) {
    // Find out if item exists in array
    var replaceIndex = _.findIndex(current_array, (object: any) => {
        return object.data.url == mention.data.url;
    })

    if (replaceIndex == -1) {
        // If item doesn't exist, add it
        let insertIndex = _.sortedIndexBy(current_array, mention, function(item) { return -item.data.published_ts; });
        current_array.splice(insertIndex, 0, mention);

        // current_array.push(mention);
    } else {
        // If item does exist, only add it if it has a date and the date is older than the new item
        if (current_array[replaceIndex].data.published_ts != undefined && current_array[replaceIndex].data.published_ts < mention.data.published_ts) {
            current_array[replaceIndex] = mention;
        }
    }
}


interface WebmentionIOFatPing {
    secret: String;
    source: String;
    target: String;
    private: Boolean;
    post: any;
}