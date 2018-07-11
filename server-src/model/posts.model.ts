import * as fs from "fs";
import * as yaml from "js-yaml";
import {Post} from "./post.model";

let dataDir = __dirname + "/../../jekyll/_source";

export class Posts {
    public static getLatestPost() {

    }

    public static getPost(postInfo: PostInfo, callback: (post?: Post, error?: string) => void) {
        let postFilepath = `${dataDir}/_note/${postInfo.year}/${postInfo.month}/${postInfo.day}/${postInfo.postIndex}/post.md`;
        if (fs.existsSync(postFilepath)) {
            let fileInfo = fs.readFileSync(`${dataDir}/_note/${postInfo.year}/${postInfo.month}/${postInfo.day}/${postInfo.postIndex}/post.md`, 'utf8');
            Post.createFromJekyllFile(fileInfo, (post: Post) => {
                callback(post);
            });
        } else {
            callback(null, "File does not exist");
        }
    }
}

export interface PostInfo {
    year: number;
    month: number;
    day: number;
    postIndex: number;
}