import * as request from 'request';
import * as Promise from 'bluebird';
import * as _ from 'lodash';
import * as fs from 'fs';
import * as path from 'path';
import * as express from 'express';

var emojiData = require('emoji-data');
var config = require('../../abodeConfig.json');

export let webmentionRouter = express.Router();

// Routes
webmentionRouter.get('/alert', webmentionAlert);

function webmentionAlert(req, res) {
    console.log("Webmention Alert");
    console.log(req.body);

    // Slack Incoming Webhook
    // https://hooks.slack.com/services/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

    //payload={"channel": "#general", "username": "webhookbot", "text": "This is posted to #general and comes from a bot named webhookbot.", "icon_emoji": ":ghost:"}

//     {
// 	"fallback": "Required text summary of the attachment that is shown by clients that understand attachments but choose not to show them.",

// 	"text": "Optional text that should appear within the attachment",
// 	"pretext": "Optional text that should appear above the formatted data",

// 	"color": "#36a64f", // Can either be one of 'good', 'warning', 'danger', or any hex color code

// 	// Fields are displayed in a table on the message
// 	"fields": [
// 		{
// 			"title": "Required Field Title", // The title may not contain markup and will be escaped for you
// 			"value": "Text value of the field. May contain standard message markup and must be escaped as normal. May be multi-line.",
// 			"short": false // Optional flag indicating whether the `value` is short enough to be displayed side-by-side with other values
// 		}
// 	]
// }				
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

            Promise.each(webmentionData.links, (mention: any) => {
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