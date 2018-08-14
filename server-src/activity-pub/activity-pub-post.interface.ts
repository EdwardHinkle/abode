import {ActivityPubAttributed} from "./activity-pub-attributed.interface";

export interface ActivityPubPost {
    '@context': string[] | string;
    id: string;
    url: string;
    type: 'Note';
    published: string;
    attributedTo: string | string[] | ActivityPubAttributed | ActivityPubAttributed[];
    content: string;
    to: string[];
    tag: string[];
    inReplyTo: string;
}