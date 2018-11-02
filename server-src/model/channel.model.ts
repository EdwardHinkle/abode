import * as fs from "fs";
import {SearchPostsInfo} from "./posts.model";

export class Channel {
    id: string;
    name: string;
    layout: string;
    type: ChannelType;

    constructor (data: ChannelData) {
        this.id = data.id;
        this.name = data.name;
        this.layout = data.layout;
        this.type = data.type;
    }

    public static getChannels(): Channel[] {
        let channelData: ChannelData[] = JSON.parse(fs.readFileSync(`${__dirname}/../../jekyll/_source/_note/channels/channels.json`, 'utf8'));
        let channels = [];

        channelData.forEach(channelData => {
            channels.push(new Channel(channelData));
        });

        return channels;
    }
}

export interface ChannelData {
    id: string;
    name: string;
    layout: string;
    type: ChannelType;
    query: SearchPostsInfo;
}

export type ChannelType = 'static' | 'dynamic';