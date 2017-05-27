import * as request from 'request';
import * as _ from 'lodash';
import * as fs from 'fs';
import * as path from 'path';
import * as express from 'express';
import * as moment from 'moment';
import * as mfo from 'mf-obj';
import * as Bluebird from 'bluebird';

var emojiData = require('emoji-data');
var config = require('../../abodeConfig.json');

export let webmentionRouter = express.Router();

// Routes
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

    var slackMessage = {
        "channel": "#website",
        "username": receivedWebmention.post.author.name,
        "icon_url": receivedWebmention.post.author.photo,
        "text": (receivedWebmention.post.content ? receivedWebmention.post.content.value : undefined),
        "attachments": undefined
    }

    var finishedProcessing: Promise<any>[] = [];

    // If it is a like
    if (receivedWebmention.post["wm-property"] == "like-of") {
        let likeOfUrl = receivedWebmention.post[receivedWebmention.post['wm-property']];
         finishedProcessing.push(mfo.getEntry(likeOfUrl)
        .then(entry => {
            slackMessage.text = `<${receivedWebmention.post.url}|liked> <${likeOfUrl}|'${entry.name}'>`;
        }));
    }
    // If it is in reply to
    else if (receivedWebmention.post["wm-property"] == "in-reply-to") {
        let replyToUrl = receivedWebmention.post[receivedWebmention.post['wm-property']];
        finishedProcessing.push(mfo.getEntry(replyToUrl)
        .then(entry => {
            slackMessage.text = `${receivedWebmention.post.content.value} (<${receivedWebmention.post.url}|in reply to>: <${replyToUrl}|${entry.name}>)`;

            if (receivedWebmention.post['swarm-coins'] != undefined) {
                slackMessage.attachments = [
                    {
                        "fallback": `Coins Awarded: ${receivedWebmention.post['swarm-coins']}`,
                        "color": "#36a64f",
                        "fields": [
                            {
                                "title": "Coins Awarded",
                                "value": receivedWebmention.post['swarm-coins'],
                                "short": false
                            }
                        ],
                    }
                ]
            }
        }));
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

    // If it has swarm coins
    

    Promise.all(finishedProcessing).then(() => {
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
                console.log("Successfull sent Slack Message");
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
                
                if (mention.activity.sentence.indexOf("on a post that linked to") > -1 ||
                    (mention.activity.type == "like" && mention.activity.sentence.indexOf("favorited a tweet") > -1)) {
                    if (webmentionsOfLinks[targetPage] === undefined) {
                        webmentionsOfLinks[targetPage] = [];
                    }
                    webmentionsOfLinks[targetPage].push(mention);
                } else {

                    if (webmentions[targetPage] === undefined) {
                        webmentions[targetPage] = { likes: [], replies: [], reactions: [], mentions: [] }
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
                        case 'reply':
                            if (tryAddEmojiReaction(webmentions[targetPage].reactions, mention) == false) {
                                addReplaceOrIgnoreWebMention(webmentions[targetPage].replies, mention);
                            }
                            break;
                    }
                } 

            }).then(() => {
                var json = JSON.stringify(webmentions);
                fs.writeFile(path.join(__dirname, '../../jekyll/_source/_data/webmentions.json'), json, 'utf8', function(error){
                    if (error != undefined) {
                        reject(error);
                    }
                    console.log("Webmentions Retrieved");
                    resolve();
                }); 
                var linksJson = JSON.stringify(webmentionsOfLinks);
                fs.writeFile(path.join(__dirname, '../../jekyll/_source/_data/webmentions_of_links.json'), linksJson, 'utf8', function(error){
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
    var emoji = getEmojiReaction(mention)
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
    var stripContent = mention.data.content.replace(/<\/?[^>]+(>|$)/g, "").replace(/\n/g, "");
    
    emojiData.scan(stripContent).forEach(
        function(ec) {
            if (stripContent.length < 5) {
                emojiFound = {shortName: ec.short_name, display: stripContent};
            }
        }
    );

    return emojiFound;

}

function addReplaceOrIgnoreWebMention(current_array, mention) {
    // Find out if item exists in array
    var replaceIndex = _.findIndex(current_array, (object: any) => {
        return object.data.url == mention.data.url;
    })

    if (replaceIndex == -1) {
        // If item doesn't exist, add it
        current_array.push(mention);
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