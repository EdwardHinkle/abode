import * as yaml from "js-yaml";
import {PostInfo} from "./posts.model";
import * as marked from 'marked';
import * as moment from 'moment'; // Actual Library
import { Moment } from "moment";
import {People} from "../people"; // TypeScript Type

export class Post {

    public permalink: string;
    public type: 'entry' | 'event';
    public properties: PostProperties;

    public constructor() {

    }

    public static createFromJekyllFile(fileData): Promise<Post> {

        return new Promise((resolve, reject) => {

            let fileArray = fileData.split("---\n");
            let doc = yaml.safeLoad(fileArray[1]);
            let post = new Post();

            // Import all initial properties
            post.properties = new PostProperties(doc.properties);

            // Custom properties and attribute overrides
            post.permalink = doc.permalink;
            post.properties.date = moment(doc.date, 'YYYY-MM-DD h:mm:ss ZZ');
            post.properties.postIndex = doc.slug;

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

            People.getPeople().then(peopleData => {

                post.properties.content = marked(fileArray[2]).replace(/^<p>/, '').replace(/<\/p>\n$/, '');
                post.properties.personTags = [];
                post.properties.category = [];
                post.properties.syndication = [];

                if (doc.tags) {
                    doc.tags.forEach(tag => {
                        if (tag.indexOf('http') > -1) {
                            post.properties.personTags.push(peopleData.getPersonByUrl(tag));
                        } else {
                            post.properties.category.push(tag);
                        }
                    });
                }

                resolve(post);
            });
        });
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
}

export class PostProperties {
    date: Moment;
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
}

export enum PostType {
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