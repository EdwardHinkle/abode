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

    public static createFromJekyllFile(fileData, callback: (post: Post) => void) {
        let fileArray = fileData.split("---\n");
        let doc = yaml.safeLoad(fileArray[1]);
        let post = new Post();

        // Import all initial properties
        post.properties = new PostProperties(doc.properties);

        // Custom properties and attribute overrides
        post.permalink = doc.permalink;
        post.properties.date = moment(doc.date, 'YYYY-MM-DD h:mm:ss ZZ');
        post.properties.postIndex = doc.slug;

        People.getPeople().then(peopleData => {

            post.properties.content = marked(fileArray[2]).replace(/^<p>/, '').replace(/<\/p>\n$/, '');
            post.properties.personTags = [];
            post.properties.category = [];

            if (doc.tags) {
                doc.tags.forEach(tag => {
                    if (tag.indexOf('http') > -1) {
                        post.properties.personTags.push(peopleData.getPersonByUrl(tag));
                    } else {
                        post.properties.category.push(tag);
                    }
                });
            }

            callback(post);
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
            .replace(':day', this.properties.getDaString())
            .replace(':slug', this.properties.postIndex.toString());
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