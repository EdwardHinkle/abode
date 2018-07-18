import * as fs from "fs";
import * as yaml from "js-yaml";
import {Post} from "./post.model";

let dataDir = __dirname + "/../../jekyll/_source";

export class Posts {
    public static getLatestPost() {

    }

    public static getPosts(postsInfo: PostsInfo): Promise<Post[]> {

        return new Promise((resolve, reject) => {
            let postFilepath = `${dataDir}/_note`;

            if (postsInfo.year !== undefined) {
                postFilepath += `/${postsInfo.year}`;
            }

            if (postsInfo.month !== undefined) {
                postFilepath += `/${postsInfo.month}`;
            }

            if (postsInfo.day !== undefined) {
                postFilepath += `/${postsInfo.day}`;
            }

            if (fs.existsSync(postFilepath)) {
                this.getPostsInDir(postFilepath, true).then(posts => {
                    resolve(posts);
                })
            } else {
            	if (postsInfo.required) {
                	reject(`Path does not exist: ${postFilepath}`);
                } else {
				    console.log(`Path does not exist: ${postFilepath}`);
				    resolve([]);
				}
            }
        });
    }

    private static getPostsInDir(dirPath, recursive: boolean = false): Promise<Post[]> {

        return new Promise((resolve, reject) => {

            let postPromises: Promise<Post[]>[] = [];

            fs.readdirSync(dirPath).filter((filename) => {
                return filename.indexOf(".") != 0;
            }).forEach((filename) => {

                let fileStat = fs.statSync(`${dirPath}/${filename}`);
                if (fileStat.isDirectory()) {
                    if (recursive) {
                        postPromises.push(this.getPostsInDir(`${dirPath}/${filename}`, recursive));
                        // .then(posts => {
                        //     // combinedPosts = combinedPosts.concat([...posts]);
                        // });
                    }
                } else {
                    // Return post info
                    let fileInfo = fs.readFileSync(`${dirPath}/${filename}`, 'utf8');
                    postPromises.push(Post.createFromJekyllFile(fileInfo).then(post => {
                        return [post]
                    }));
                }

            });

            Promise.all(postPromises).then(arrayOfPosts => {
                resolve([].concat.apply([], arrayOfPosts));
            });
        });
    }

    public static getPost(postInfo: PostInfo): Promise<Post> {

        return new Promise((resolve, reject) => {
            let postFilepath = `${dataDir}/_note/${postInfo.year}/${postInfo.month}/${postInfo.day}/${postInfo.postIndex}/post.md`;
            if (fs.existsSync(postFilepath)) {
                let fileInfo = fs.readFileSync(`${dataDir}/_note/${postInfo.year}/${postInfo.month}/${postInfo.day}/${postInfo.postIndex}/post.md`, 'utf8');
                Post.createFromJekyllFile(fileInfo).then(post => {
                    resolve(post);
                });
            } else {
                reject("File does not exist");
            }
        });
    }
}

export interface PostInfo {
    year: string;
    month: string;
    day: string;
    postIndex: string;
}

export interface PostsInfo {
    year?: string;
    month?: string;
    day?: string;
    required?: boolean;
}