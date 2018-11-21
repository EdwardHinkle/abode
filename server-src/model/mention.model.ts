import {Moment} from "moment";

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
        for (let key in mentionData) {
            this[key] = mentionData[key];
        }
    }

    getTarget(): string {
        return this[this['wm-property']];
    }

    targetMatches(match: string): boolean {
        return this.getTarget().indexOf(match) > -1;
    }

    isCurrentPermalink(): boolean {
        let target = this.getTarget();
        let regex = new RegExp(/(https:\/\/eddiehinkle.com\/[0-9]{4}\/[0-9]{2}\/[0-9]{2}\/[0-9]{2}\/[a-z]+\/])|(https:\/\/eddiehinkle.com\/[a-z]+\/)/);
        let currentPermalink = regex.test(target);
        console.log('checking if permalink is a current permalink', currentPermalink);
        console.log(target);
        return currentPermalink;
    }

    getPostPath(): string {
        let target = this.getTarget();
        let regex = new RegExp(/https:\/\/eddiehinkle.com\/([0-9]{4})\/([0-9]{2})\/([0-9]{2})\/([0-9]{2})\/[a-z]+\/]|https:\/\/eddiehinkle.com\/([a-z]+)\//);
        let matches = regex.exec(target);

        if (matches.length === 1) {
            return `pages/${matches[0]}`;
        } else {
            let postsPath = `posts`;
            matches.forEach(pathSegment => {
                postsPath += `/${pathSegment}`;
            });
            return postsPath;
        }
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