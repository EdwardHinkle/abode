import * as yaml from "js-yaml";
import {PostInfo} from "./posts.model";
import * as marked from 'marked';
import * as moment from 'moment'; // Actual Library
import { Moment } from "moment";
import * as fs from "fs";
import {PostType} from "./post.model";
import {Cards} from "./cards.model";
import {Card} from "./card.model"; // TypeScript Type

const JEKYLL_DATE_FORMAT = 'YYYY-MM-DD h:mm:ss ZZ';
let dataDir = __dirname + "/../../jekyll/_source";

export class Page {

    public permalink: string;
    public type: 'entry' | 'event' = 'entry';
    public properties: PostProperties;
    public client_id: string;
    public slug: string;

    public constructor() {

    }

    public static createFromJekyllFile(fileData): Promise<Page> {

        let constructionPromises: Promise<any>[] = [];

        return new Promise((resolve, reject) => {

            let fileArray = fileData.split("---\n");
            let doc = yaml.safeLoad(fileArray[1]);
            let page = new Page();

            // Import all initial properties
            page.properties = new PostProperties(doc.properties);

            // Custom properties and attribute overrides
            page.slug = doc.slug;
            page.permalink = doc.permalink;
            page.client_id = doc.client_id;
            page.properties.date = moment(doc.date, JEKYLL_DATE_FORMAT);
            if (page.properties.updated) {
                page.properties.updated = moment(page.properties.updated, JEKYLL_DATE_FORMAT);
            }
            page.properties.duration = doc.duration;
            page.properties.visibility = doc.visibility;

            // TODO: These need to be cleaned up in the actual data
            if (typeof page.properties.photo === "string") {
                page.properties.photo = [page.properties.photo];
            }

            if (doc.photo !== undefined) {
                if (page.properties.photo === undefined) {
                    page.properties.photo = [];
                }
                page.properties.photo.push(doc.photo);
            }

            // Convert the jekyll title into a h-entry name
            page.properties.name = doc.title;

            // Fetch extra data
            page.properties.content = marked(fileArray[2]).replace(/^<p>/, '').replace(/<\/p>\n$/, '');
            page.properties.personTags = [];
            page.properties.category = [];

            if (doc.tags) {
                doc.tags.forEach(tag => {
                    if (tag.indexOf('http') > -1) {
                        constructionPromises.push(Card.loadCard(tag).then(card => {
                            if (card !== undefined) {
                                page.properties.personTags.push(card);
                            }
                        }));
                    } else {
                        page.properties.category.push(tag);
                    }
                });
            }

            Promise.all(constructionPromises).then(results => {
                resolve(page);
            });
        });
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

    public getOfficialPermalink(): string {
        return `/${this.slug}`;
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


 /*    public semiRelativeDateFormat(): string {
        if (moment().diff(this.properties.date, 'days') > 0) {
            return this.properties.date.format("MMM DD, YYYY");
        } else {
            return 'Today';
        }
    }

    public semiRelativeDateTimeFormat(): string {
        let date = this.semiRelativeDateFormat();
        return this.properties.date.format("h:mma") + ' ' + date;
    } */
    
    public getPostSummary() {
        if (this.properties.name) {
            return this.properties.name;
        }

        if (this.properties.content) {
            return this.properties.content;
        }

        return "Eddie Hinkle";
    }
    
    public getOGPreviewMedia() {
        return null;
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
        let postDir = `${dataDir}/_note/pages/${this.slug}`;
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