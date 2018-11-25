import {Moment} from "moment";
import * as fs from "fs";
import {UrlUtility} from "../utilities/url.utility";
import {Post} from "./post.model";
import * as moment from "moment";

const emojiRegex = require('emoji-regex')();
const emojiStrip = require('emoji-strip');

const storageDir = `${__dirname}/../../jekyll/_source/_note`;

export class Mention {

    type: 'entry' | 'event' | string;
    author: MentionAuthor;
    url: string;
    published: Moment;
    'wm-received': Moment;
    'wm-id': number;
    'wm-property': string;
    'wm-private': boolean;
    content: MentionContent;
    
    constructor(mentionData: MentionInfo) {
        let dateKeys = ['published', 'wm-received'];

        if (mentionData.published == null) {
            mentionData.published = mentionData['wm-received'];
        }

        for (let key in mentionData) {
            if (dateKeys.indexOf(key) > -1) {
                this[key] = moment(mentionData[key]);
            } else {
                this[key] = mentionData[key];
            }
        }

        if (this['wm-property'] === 'like-of') {
            if (this.content === undefined) {
                this.content = {
                    "content-type": "text",
                    "html": "",
                    "text": "",
                    "value": "",
                };
            }

            this.content.value = '👍';
            this.content.html = '👍';
            this.content.text = '👍';
        }
    }

    public getPublishedDate(): string {
        return this.published.format();
    }

    public semiRelativeDateFormat(date?: Moment): string {
        let today = moment().hour(0).minute(0).second(0).millisecond(0);

        if (date === undefined) {
            date = this.published;
        }


        if (date.isSameOrAfter(today)) {
            return 'Today';
        } else {
            return date.format("MMM DD, YYYY");
        }
    }

    public semiRelativeDateTimeFormat(date?: Moment): string {

        if (date === undefined) {
            date = this.published;
        }

        let dateString = this.semiRelativeDateFormat(date);
        return dateString + ' ' +  date.format("h:mma");
    }

    getTarget(): string {
        let urlProperty = this['wm-property'];
        if (urlProperty === 'rsvp') {
            urlProperty = 'in-reply-to';
        }
        return this[urlProperty].split('?')[0];
    }

    getMentionType(): MentionType {
        let emojiOnly = false;

        if (this.content) {
            let testContent = this.content.text;
            let contentWithoutEmoji = emojiStrip(testContent).replace(/\s/, "");
            if (contentWithoutEmoji.length === 0) {
                emojiOnly = true;
            }
        }

        if (emojiOnly) {
            return 'reacji';
        } else {
            switch(this['wm-property']) {
                case 'in-reply-to':
                    return 'reply';
                case 'bookmark-of':
                    return 'bookmark';
                default:
                    return 'mention';
            }
        }
    }

    displayReacji(): string {
        let matches = this.content.value.match(emojiRegex);
        if (matches.length > 0) {
            return matches[0];
        }
        return "";
    }

    targetMatches(match: string): boolean {
        return this.getTarget().indexOf(match) > -1;
    }

    isCurrentPermalink(): boolean {
        let target = this.getTarget();
        let regex = new RegExp(/https?:\/\/eddiehinkle.com\/[0-9]{4}\/[0-9]{2}\/[0-9]{2}\/[0-9]{1,2}\/[a-z]+\/?$|https?:\/\/eddiehinkle.com\/[a-z]+\/?$/);
        let currentPermalink = regex.test(target);
        return currentPermalink;
    }

    isHomepageMention(): boolean {
        let regex = new RegExp(/https?:\/\/eddiehinkle.com[\/]?$/);
        return regex.test(this.getTarget());
        // return this.getTarget() === 'https://eddiehinkle.com/';
    }

    getPostPath(): string {
        let target = this.getTarget();
        let regex = new RegExp(/https?:\/\/eddiehinkle.com\/([0-9]{4})\/([0-9]{2})\/([0-9]{2})\/([0-9]{1,2})\/[a-z]+\/?$|https?:\/\/eddiehinkle.com\/([a-z]+)\/?$/);
        let matches = target.match(regex);

        if (matches[5] !== undefined) {
            return `pages/${matches[5]}`;
        } else {
            return `posts/${matches[1]}/${matches[2]}/${matches[3]}/${matches[4]}`;
        }
    }

    saveFile(overridePath?: string) {
        let mentionDir;

        if (overridePath) {
            mentionDir = overridePath;

            // Create mention directory if it doesn't exist
            if (!fs.existsSync(mentionDir)) {
                fs.mkdirSync(mentionDir);
            }
        } else {

            if (this.isHomepageMention()) {

                mentionDir = `${storageDir}/mentions/homepage`;

                // Create mention directory if it doesn't exist
                if (!fs.existsSync(mentionDir)) {
                    fs.mkdirSync(mentionDir);
                }

            } else {

                let postPath = this.getPostPath();
                let postDir = `${storageDir}/${postPath}`;
                mentionDir = `${postDir}/mentions`;

                if (!fs.existsSync(postDir)) {
                    console.log(`Post directory doesn't exist: ${postDir}. Ignoring webmentions for deleted post`);
                    return;
                }

                // Create mention directory if it doesn't exist
                if (!fs.existsSync(mentionDir)) {
                    fs.mkdirSync(mentionDir);
                }

            }
        }

        fs.writeFile(`${mentionDir}/${UrlUtility.getCleanUrl(this.url)}.json`, JSON.stringify(this), {
            encoding: 'utf8'
        }, (err) => {
            if (err) {
                console.log(`There was an error saving file ${mentionDir}/${UrlUtility.getCleanUrl(this.url)}.json`);
            }
        });

    }

    static getMentionsForPost(postInfo: MentionPostInfo | Post): Mention[] {
        let mentions = [];
        let mentionPath;

        if (postInfo instanceof Post) {
            mentionPath = `${postInfo.getPostDir()}/mentions`;
        } else {
            mentionPath = `${storageDir}/${postInfo.year}/${postInfo.month}/${postInfo.day}/${postInfo.postIndex}/mentions`;
        }

        if (fs.existsSync(mentionPath)) {
            let mentionDir = fs.readdirSync(mentionPath);
            mentionDir.forEach(mentionFilename => {
                try {
                    let mentionData = JSON.parse(fs.readFileSync(`${mentionPath}/${mentionFilename}`, {encoding: 'utf8'}));
                    mentions.push(new Mention(mentionData));
                } catch (error) {
                    console.log(`Failed to load mention ${mentionPath}/${mentionFilename}`);
                    console.log(error);
                }
            });
        }
        return mentions;
    }

}

export interface MentionInfo {
    type: 'entry' | 'event' | string;
    author: MentionAuthor;
    url: string;
    published: string
    'wm-received': string;
    'wm-id': number;
    content: MentionContent;
    'in-reply-to': string;
    'wm-property': string;
    'wm-private': boolean;
}

export interface MentionAuthor {
    type: 'card';
    name: string;
    photo: string;
    url: string;
}

export interface MentionContent {
    'content-type': string;
    value: string;
    html?: string;
    text: string;
}

export interface MentionPostInfo {
    year: number;
    month: number;
    day: number;
    postIndex: number;
}

export type MentionType = 'mention' | 'reply' | 'bookmark' | 'reacji';

let historicalPathMap = {
    "http://eddiehinkle.com/article/2017/03/receiving-webmentions.html": "https://eddiehinkle.com/2017/03/23/1/article/",
    "https://eddiehinkle.com/social/2017/06/rsvp-indieweb-june-28/": "",
    "https://eddiehinkle.com/social/2017/04/1234/": "",
    "https://eddiehinkle.com/article/2017/03/making-watch-posts.html": "",
    "https://eddiehinkle.com/article/2017/03/viewing-webmentions.html": "",
    "https://eddiehinkle.com/watch/2017/04/beauty-and-the-beast-finished/": "",
    "https://eddiehinkle.com/watch/2017/04/gotham-s3-e15-interested/": "",
    "https://eddiehinkle.com/listen/2017/04/appstories-1-welcome-to-appstories-finished/": "",
    "https://eddiehinkle.com/watch/2017/04/thor-ragnorak-finished/": "",
    "https://eddiehinkle.com/watch/2017/04/prison-break-s5-e3-finished/": "",
    "https://eddiehinkle.com/watch/2017/04/james-river-our-plans-gods-purpose-finished/": "",
    "https://eddiehinkle.com/watch/2017/04/star-wars-the-last-jedi-official-teaser-finished/": "",
    "https://eddiehinkle.com/watch/2017/04/its-the-easter-beagle,-charlie-brown-finished/": "",
    "http://eddiehinkle.com/social/2017/04/1234/": "",
    "http://eddiehinkle.com/article/2017/03/viewing-webmentions.html": "",
    "http://eddiehinkle.com/article/2017/03/u-sit-how-far-is-too-far.html": "",
    "http://eddiehinkle.com/article/2017/03/testing-emoji-reactions.html": "",
    "http://eddiehinkle.com/article/2017/03/making-watch-posts.html": "",
    "https://eddiehinkle.com/tag/worldnewstonight/": "",
    "https://eddiehinkle.com/tag/iosreviewtime/": "",
    "https://eddiehinkle.com/on-this-day/": "",
    "https://eddiehinkle.com/projects/indigenous/": "",
    "https://eddiehinkle.com/projects/indigenous": "",
    "https://eddiehinkle.com/podcasts/authors-note/": "",
    "https://eddiehinkle.com/tag/tv-review/": ""
};