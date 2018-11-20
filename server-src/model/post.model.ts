import * as yaml from "js-yaml";
import {PostInfo} from "./posts.model";
import * as marked from 'marked';
import * as moment from 'moment'; // Actual Library
import { Moment } from "moment";
import * as fs from "fs";
import {DataController} from "./data.controller"; // TypeScript Type
import * as Prism from "prismjs";
import * as loadLanguages from "prismjs/components/";
import {Cards} from "./cards.model";
import {Card} from "./card.model";

const JEKYLL_DATE_FORMAT = 'YYYY-MM-DD h:mm:ss ZZ';
let dataDir = __dirname + "/../../jekyll/_source";

export class Post {

    public permalink: string;
    public type: 'entry' | 'event' = 'entry';
    public properties: PostProperties;
    public client_id: string;

    public constructor() {

    }

    public static createFromJekyllFile(fileData): Promise<Post> {

        let constructionPromises: Promise<any>[] = [];

        return new Promise((resolve, reject) => {

            let fileArray = fileData.split("---\n");
            let doc;
            try {
                doc = yaml.safeLoad(fileArray[1]);
            } catch (error) {
                console.log("Failed loading YAML for post " + fileData.split("---\n")[1]);
                reject(error);
            }
            let post = new Post();

            // Import all initial properties
            post.properties = new PostProperties(doc.properties);

            // Fetch audience h-cards
            if (doc.properties && doc.properties.audience) {
                post.properties.audience = [];
                doc.properties.audience.forEach(audienceFilename => {
                    Card.loadCard(audienceFilename).then(audienceCard => {
                        post.properties.audience.push(audienceCard);
                    });
                });
            }

            // Custom properties and attribute overrides
            post.permalink = doc.permalink;
            post.client_id = doc.client_id;
            post.properties.date = moment(doc.date, JEKYLL_DATE_FORMAT);
            if (post.properties.updated) {
                post.properties.updated = moment(post.properties.updated, JEKYLL_DATE_FORMAT);
            }
            post.properties.postIndex = doc.slug;
            post.properties.duration = doc.duration;
            post.properties.visibility = doc.visibility;

            // TODO: These need to be cleaned up in the actual data
            if (typeof post.properties.photo === "string") {
                post.properties.photo = [post.properties.photo];
            }

            if (doc.photo !== undefined) {
                if (post.properties.photo === undefined) {
                    post.properties.photo = [];
                }
                post.properties.photo.push(doc.photo);
            }

            if (typeof post.properties.video === "string") {
                post.properties.video = [post.properties.video];
            }

            // Convert the jekyll title into a h-entry name
            post.properties.name = doc.title;

            // TV Show Watch Post
            post.properties['task-status'] = doc['task-status'];
            post.properties['show_name'] = doc['show_name'];
            post.properties['show_season'] = doc['show_season'];
            post.properties['show_episode'] = doc['show_episode'];
            post.properties['episode_name'] = doc['episode_name'];
            post.properties['imdb_id'] = doc['imdb_id'];
            post.properties['show_url'] = doc['show_url'];
            post.properties['show_image'] = doc['show_image'];
            post.properties['episode_image'] = doc['episode_image'];
            post.properties['season_finale'] = doc['season_finale'];
            post.properties['season_premiere'] = doc['season_premiere'];
            post.properties['show_premiere'] = doc['show_premiere'];
            post.properties['show_finale'] = doc['show_finale'];

            // Movie Watch Post
            post.properties['movie_name'] = doc['movie_name'];
            post.properties['movie_url'] = doc['movie_url'];
            post.properties['movie_image'] = doc['movie_image'];

            if (doc.properties != undefined && doc.properties['watch-of'] !== undefined) {

                post.properties['task-status'] = doc.properties['task-status'];
                post.properties['imdb_id'] = doc.properties['watch-of'].properties['imdb-id'];

                if (doc.properties['watch-of'].properties.episode !== undefined) {
                    post.properties['show_name'] = doc.properties['watch-of'].properties.name;
                    post.properties['show_url'] = doc.properties['watch-of'].properties.url;
                    post.properties['show_image'] = doc.properties['watch-of'].properties.photo;

                    post.properties['episode_name'] = doc.properties['watch-of'].properties.episode.properties.name;
                    post.properties['episode_image'] = doc.properties['watch-of'].properties.episode.properties.photo;
                    post.properties['show_season'] = doc.properties['watch-of'].properties.episode.properties['season-number'];
                    post.properties['show_episode'] = doc.properties['watch-of'].properties.episode.properties['episode-number'];
                    post.properties['season_finale'] = doc.properties['watch-of'].properties.episode.properties['special-episode'] === 'season_finale' ? true : undefined;
                    post.properties['season_premiere'] = doc.properties['watch-of'].properties.episode.properties['special-episode'] === 'season_premiere' ? true : undefined;
                    post.properties['show_premiere'] = doc.properties['watch-of'].properties.episode.properties['special-episode'] === 'show_premiere' ? true : undefined;
                    post.properties['show_finale'] = doc.properties['watch-of'].properties.episode.properties['special-episode'] === 'show_finale' ? true : undefined;
                }

                if (doc.properties['watch-of'].properties.episode === undefined) {
                    post.properties['movie_name'] = doc.properties['watch-of'].properties.name;
                    post.properties['movie_url'] = doc.properties['watch-of'].properties.url;
                    post.properties['movie_image'] = doc.properties['watch-of'].properties.photo;
                }
            }

            if (post.properties.syndication === undefined) {
                post.properties.syndication = [];
            }

            // Fetch extra data
            if (post.getPostType() === PostType.Code) {
                let codeLanguage = post.properties['abode-content-type'].split("/")[1];
                let codeSnippet = this.prepareCodeBlock(codeLanguage, fileArray[2]);
                post.properties.content = `<pre><code class="language-${codeLanguage}">${codeSnippet}</code></pre>`;
            } else {
                let postContent = marked(fileArray[2], {
                    highlight: (code, lang) => {
                        return this.prepareCodeBlock(lang, code);
                    }
                }).replace(/^<p>/, '')
                    .replace(/<\/p>\n$/, '');

                post.properties.content = postContent;
            }

            post.properties.personTags = [];
            post.properties.category = [];

            if (doc.tags) {
                doc.tags.forEach(tag => {
                    if (tag.indexOf('http') > -1) {
                        constructionPromises.push(Card.loadCard(tag).then(card => {
                            if (card !== undefined) {
                                post.properties.personTags.push(card);
                            }
                        }));
                    } else {
                        post.properties.category.push(tag);
                    }
                });
            }

            Promise.all(constructionPromises).then(results => {
                resolve(post);
            });
        });
    }

    private static prepareCodeBlock(codeLanguage: string, codeContent: string) {
        if (codeLanguage !== "markup" && codeLanguage !== "markup" && codeLanguage !== "css" && codeLanguage !== "javascript") {
            loadLanguages(codeLanguage);
        }

        let rawCodeSnippet = Prism.highlight(codeContent, Prism.languages[codeLanguage], codeLanguage);
        let codeLines = rawCodeSnippet.split("\n");
        let codeSnippet;

        if (codeLines.length > 1) {
            codeSnippet = '<ol class="code-line-numbers">';
        } else {
            codeSnippet = '<ol>';
        }

        codeLines.forEach((codeLine, lineNumber) => {
            codeSnippet += `<li class="L${lineNumber + 1}">${codeLine}</li>`;
        });
        codeSnippet += '</ol>';

        return codeSnippet;
    }

    public itineraryList() {
        return `${this.properties.itinerary.properties.origin} to ${this.properties.itinerary.properties.destination}`;
    }

    public itineraryDepartureTime() {
        // TODO: Check if departure time is same day as post. If it's not display the date
        let departure = moment(this.properties.itinerary.properties.departure, "YYYY-MM-DDTHH:mm:ssZ");
        return departure.format("h:mma");
    }

    public itineraryArrivalTime() {
        // TODO: Check if arrival time is same day as post. If it's not display the date
        let arrival = moment(this.properties.itinerary.properties.arrival, "YYYY-MM-DDTHH:mm:ssZ");
        return arrival.format("h:mma");
    }
    
    public isPublic(): boolean {
    	return this.properties.visibility === 'public';
    }

    public getPublishedDate(): string {
        return this.properties.date.format();
    }
    
    public getUpdatedDate(): string {
        return this.properties.updated.format();
    }

    public verifyPostPermalink(req: any): boolean {
        let officialPostPath = this.permalink.replace(':year', this.properties.getYearString())
            .replace(':month', this.properties.getMonthString())
            .replace(':day', this.properties.getDayString())
            .replace(':slug', this.properties.postIndex.toString());

        if (officialPostPath !== req.path) {
            return false;
        }

        return true;
    }

    public getOfficialPermalink(): string {
        return this.permalink.replace(':year', this.properties.getYearString())
            .replace(':month', this.properties.getMonthString())
            .replace(':day', this.properties.getDayString())
            .replace(':slug', this.properties.postIndex.toString());
    }

    public semiRelativeDateFormat(date?: Moment): string {
        let today = moment().hour(0).minute(0).second(0).millisecond(0);       
        
        if (date === undefined) {
            date = this.properties.date;
        }


        if (date.isSameOrAfter(today)) {
            return 'Today';
        } else {
            return date.format("MMM DD, YYYY");
        }
    }

    public semiRelativeDateTimeFormat(date?: Moment): string {
        
        if (date === undefined) {
            date = this.properties.date;
        }
        
        let dateString = this.semiRelativeDateFormat(date);
        return date.format("h:mma") + ' ' + dateString;
    }

    public save() {
        let postObject = this.getSaveObject();
        let postContents = this.properties.content;

        // Save YAML File
        let fileData = "---\n" + yaml.safeDump(postObject, { lineWidth: 800, skipInvalid: true }) + "---\n" + postContents;
        let fileName = this.getFilename();

        console.log(`Test Fileoutput for ${fileName}`);
        console.log(fileData);

        fs.writeFile(fileName, fileData, function(err) {
            if (err) {
                console.log('Error saving post');
                return console.log(err);
            }

            console.log("Saving Finished");
        });
    }

    public updateDatabaseCache(): any {

        console.log('Attempting to update post in database');

        return new Promise((resolve, reject) => {
            DataController.db.serialize(() => {

                let addPost = DataController.db.prepare("INSERT OR REPLACE INTO `posts` (year, month, day, post_index, name, published, post_type, visibility, content) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
                let addTag = DataController.db.prepare("INSERT OR IGNORE INTO `tags` (name) VALUES (?)");
                let addPostTags = DataController.db.prepare("INSERT OR IGNORE INTO `posts_tags` (post_year, post_month, post_day, post_index, tag_name) VALUES (?, ?, ?, ?, ?)");
                let addPostChannels = DataController.db.prepare("INSERT OR IGNORE INTO `posts_channels` (post_year, post_month, post_day, post_index, channel) VALUES (?, ?, ?, ?, ?)");

                addPost.run(
                    this.properties.getYearString(),
                    this.properties.getMonthString(),
                    this.properties.getDayString(),
                    this.properties.postIndex,
                    this.properties.name ? this.properties.name : '',
                    this.properties.date.format(),
                    this.getPostType(),
                    this.properties.visibility,
                    this.properties.content
                );

                // console.log(post.properties);
                if (this.properties.category) {
                    this.properties.category.forEach(tagName => {
                        addTag.run(
                            tagName
                        );

                        addPostTags.run(
                            this.properties.getYearString(),
                            this.properties.getMonthString(),
                            this.properties.getDayString(),
                            this.properties.postIndex,
                            tagName
                        );
                    });
                }
                if (this.properties['abode-channel']) {
                    this.properties['abode-channel'].forEach(channelName => {
                        addPostChannels.run(
                            this.properties.getYearString(),
                            this.properties.getMonthString(),
                            this.properties.getDayString(),
                            this.properties.postIndex,
                            channelName
                        );
                    });
                }

                addPost.finalize(error => console.log(error));
                addTag.finalize(error => console.log(error));
                addPostTags.finalize(error => console.log(error));
                addPostChannels.finalize(error => console.log(error));

            });
        });
    }

    public getSaveObject(): any {
        // Duplicate post object so we don't modify the original
        let postObject = JSON.parse(JSON.stringify(this));

        // Remove content from the post object properties
        let postContents = postObject.properties.content;
        delete postObject.properties.content;

        // If there was no content, we should set it to be an empty string
        if (postContents == undefined ) {
            postContents = "";
        }

        // Reverse alterations during Post import phase
        postObject.date = this.properties.date.format(JEKYLL_DATE_FORMAT);
        postObject.slug = postObject.properties.postIndex;
        postObject.title = postObject.properties.name;

        delete postObject.properties.date;
        delete postObject.properties.postIndex;
        delete postObject.properties.name;

        if (postObject.properties['task-status'] !== undefined) {
            postObject.properties['task-status'] = postObject['task-status'];
        }

        if (postObject.properties['show_name'] !== undefined) {
            postObject.properties['show_name'] = postObject['show_name'];
        }

        if (postObject.properties['show_season'] !== undefined) {
            postObject.properties['show_season'] = postObject['show_season'];
        }

        if (postObject.properties['show_episode'] !== undefined) {
            postObject.properties['show_episode'] = postObject['show_episode'];
        }

        if (postObject.properties['episode_name'] !== undefined) {
            postObject.properties['episode_name'] = postObject['episode_name'];
        }

        if (postObject.properties['imdb_id'] !== undefined) {
            postObject.properties['imdb_id'] = postObject['imdb_id'];
        }

        if (postObject.properties['show_url'] !== undefined) {
            postObject.properties['show_url'] = postObject['show_url'];
        }

        if (postObject.properties['show_image'] !== undefined) {
            postObject.properties['show_image'] = postObject['show_image'];
        }

        if (postObject.properties['episode_image'] !== undefined) {
            postObject.properties['episode_image'] = postObject['episode_image'];
        }

        if (postObject.properties['season_finale'] !== undefined) {
            postObject.properties['season_finale'] = postObject['season_finale'];
        }

        if (postObject.properties['movie_name'] !== undefined) {
            postObject.properties['movie_name'] = postObject['movie_name'];
        }

        if (postObject.properties['movie_url'] !== undefined) {
            postObject.properties['movie_url'] = postObject['movie_url'];
        }

        if (postObject.properties['movie_image'] !== undefined) {
            postObject.properties['movie_image'] = postObject['movie_image'];
        }

        // If there are no syndications, we should remove it
        if (postObject.properties.syndication !== undefined && postObject.properties.syndication.length === 0) {
            delete postObject.properties.syndication;
        }

        // Convert person tags and categories back into tags
        if (postObject.tags === undefined) {
            postObject.tags = [];
        }

        postObject.properties.category.forEach(category => {
            postObject.tags.push(category);
        });

        postObject.properties.personTags.forEach(person => {
            postObject.tags.push(person.getRepresentitiveUrl());
        });

        // If there are no tags on the post object, we should remove it
        if (postObject.tags !== undefined && postObject.tags.length === 0) {
            delete postObject.tags;
        }

        return postObject;
    }

    getPostDir(): string {
        let year = this.properties.date.format("YYYY");
        let month = this.properties.date.format("MM");
        let day = this.properties.date.format("DD");

        let yearDir = `${dataDir}/_note/posts/${year}`;
        let monthDir = `${yearDir}/${month}`;
        let dayDir = `${monthDir}/${day}`;

        let postDir = `${dayDir}/${this.properties.postIndex}`;
        if (!fs.existsSync(postDir)) {
            fs.mkdirSync(postDir);
            console.log(postDir + " created");
        }

        return postDir;
    }

    getFilename(): string {
        console.log("Formatting Post Filename");
        return `${this.getPostDir()}/post.md`;
    }

    public getPostType(): PostType {

        if (this.properties['abode-content-type'] && this.properties['abode-content-type'].indexOf('code/') > -1) {
            return PostType.Code;
        }
        if (this.properties.start) {
            return PostType.Event;
        }
        if (this.properties['abode-trip']) {
            return PostType.Trip;
        }
        if (this.properties.rsvp || this['p-rsvp']) {
            return PostType.RSVP;
        }
        if (this.properties['in-reply-to']) {
            return PostType.Reply;
        }
        if (this.properties['repost-of']) {
            return PostType.Repost;
        }
        if (this.properties['bookmark-of']) {
            return PostType.Bookmark;
        }
        if (this.properties['like-of']) {
            return PostType.Like;
        }
        if (this.properties.checkin) {
            return PostType.Checkin;
        }
        if (this.properties['listen-of']) {
            return PostType.Listen;
        }
        if (this.properties['read-of']) {
            return PostType.Read;
        }
        if (this.properties['watch-of'] || this.properties.show_name || this.properties.movie_name) {
            return PostType.Watch;
        }
        if (this.properties.isbn) {
            return PostType.Book;
        }
        if (this.properties.video) {
            return PostType.Video;
        }
        if (this.properties.audio) {
            return PostType.Audio;
        }
        if (this.properties.ate) {
            return PostType.Ate;
        }
        if (this.properties.drank) {
            return PostType.Drank;
        }
        if (this.properties['task-status']) {
            return PostType.Task;
        }
        if (this.properties['photo']) {
            return PostType.Photo;
        }
        if (this.properties.name && this.properties.name != "") {
            return PostType.Article;
        }

        return PostType.Note;
    }

    public toMf2(properties?): any {
        let mf2Properties = this.properties.toMf2(properties);

        if (properties == undefined || (properties.indexOf('url') > -1)) {
            mf2Properties.url = `https://eddiehinkle.com${this.getOfficialPermalink()}`;
        }

        if (properties == undefined) {
            return {
                "type": `h-${this.type}`,
                "properties": mf2Properties
            }
        } else {
            return {
                "properties": mf2Properties
            }
        }
    }
}

export class PostProperties {
    date: Moment;
    personTags: Card[];
    audience: Card[];
    postIndex: number;
    [key: string]: any;

    constructor(propertiesObject) {
        for (let key in propertiesObject) {
            this[key] = propertiesObject[key];
        }
    }

    public getYearString(): string {
        return this.date.format('YYYY');
    }

    public getMonthString(): string {
        return this.date.format("MM");
    }

    public getDayString(): string {
        return this.date.format("DD");
    }

    public toMf2(properties?): any {
        let propertiesToReturn: any = {};

        for (let key in this) {
            if ((properties == undefined &&
                key !== "date" &&
                key !== "personTags" &&
                key !== "postIndex" &&
                key !== "weather") ||
                (properties !== undefined &&
                properties.indexOf(key) > -1)) {

                if (key === "syndication") {
                    let syndicationItems: any[] = this[key];
                    propertiesToReturn[key] = syndicationItems.map(syndication => syndication.url);
                } else {
                    propertiesToReturn[key] = this[key];
                }
            }
        }

        return propertiesToReturn;
    }
}

export enum PostType {
    Code = "code",
    Event = "event",
    Trip = "trip",
    RSVP = "rsvp",
    Reply = "reply",
    Repost = "repost",
    Bookmark = "bookmark",
    Like = "like",
    Listen = "listen",
    Read = "read",
    Watch = "watch",
    Checkin = "checkin",
    Book = "book", //?????
    Video = "video",
    Audio = "audio",
    Drank = "drank",
    Ate = "ate",
    Task = "task",
    Photo = "photo",
    Article = "article",
    Note = "note"
}