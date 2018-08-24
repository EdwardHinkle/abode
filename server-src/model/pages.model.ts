import * as fs from "fs";
import * as yaml from "js-yaml";
import { Page } from "./page.model";

let dataDir = __dirname + "/../../jekyll/_source";

export class Pages {

    // public static getAllPosts(): Promise<Post[]> {
    //
    //     return new Promise((resolve, reject) => {
    //         let postFilepath = `${dataDir}/_note`;
    //
    //         if (fs.existsSync(postFilepath)) {
    //             this.getPostsInDir(postFilepath, true).then(posts => {
    //                 resolve(posts);
    //             })
    //         } else {
    //             console.log(`Path does not exist: ${postFilepath}`);
    //             resolve([]);
    //         }
    //     });
    // }
    //
    // public static getPosts(postsInfo: PostsInfo): Promise<Post[]> {
    //
    //     return new Promise((resolve, reject) => {
    //         let postFilepath = `${dataDir}/_note`;
    //
    //         if (postsInfo.year !== undefined) {
    //             postFilepath += `/${postsInfo.year}`;
    //         }
    //
    //         if (postsInfo.month !== undefined) {
    //             postFilepath += `/${postsInfo.month}`;
    //         }
    //
    //         if (postsInfo.day !== undefined) {
    //             postFilepath += `/${postsInfo.day}`;
    //         }
    //
    //         if (fs.existsSync(postFilepath)) {
    //             this.getPostsInDir(postFilepath, true).then(posts => {
    //                 resolve(posts);
    //             })
    //         } else {
    //         	if (postsInfo.required) {
    //             	reject(`Path does not exist: ${postFilepath}`);
    //             } else {
	// 			    console.log(`Path does not exist: ${postFilepath}`);
	// 			    resolve([]);
	// 			}
    //         }
    //     });
    // }
    //
    // private static getPostsInDir(dirPath, recursive: boolean = false): Promise<Post[]> {
    //
    //     return new Promise((resolve, reject) => {
    //
    //         let postPromises: Promise<Post[]>[] = [];
    //
    //         fs.readdirSync(dirPath).filter((filename) => {
    //             return filename.indexOf(".") != 0;
    //         }).forEach((filename) => {
    //
    //             let fileStat = fs.statSync(`${dirPath}/${filename}`);
    //             if (fileStat.isDirectory()) {
    //                 if (recursive) {
    //                     postPromises.push(this.getPostsInDir(`${dirPath}/${filename}`, recursive));
    //                     // .then(posts => {
    //                     //     // combinedPosts = combinedPosts.concat([...posts]);
    //                     // });
    //                 }
    //             } else {
    //                 // Return post info
    //                 let fileInfo = fs.readFileSync(`${dirPath}/${filename}`, 'utf8');
    //                 postPromises.push(Post.createFromJekyllFile(fileInfo).then(post => {
    //                     return [post]
    //                 }));
    //             }
    //
    //         });
    //
    //         Promise.all(postPromises).then(arrayOfPosts => {
    //             let posts = [].concat.apply([], arrayOfPosts);
    //             let filteredPosts = posts.filter((post: Post) => post.isPublic());
    //             resolve(filteredPosts);
    //         });
    //     });
    // }

    public static getPage(pageInfo: PageInfo): Promise<Page> {

        return new Promise((resolve, reject) => {
            let postFilepath = `${dataDir}/_note/pages/${pageInfo.slug}/post.md`;
            if (fs.existsSync(postFilepath)) {
                let fileInfo = fs.readFileSync(`${dataDir}/_note/pages/${pageInfo.slug}/post.md`, 'utf8');
                Page.createFromJekyllFile(fileInfo).then(post => {
                    resolve(post);
                });
            } else {
                reject(`/${pageInfo.slug} does not exist`);
            }
        });
    }

    public static getPageData(pageInfo: PageInfo): Promise<any> {

        return new Promise((resolve, reject) => {
            let postFilepath = `${dataDir}/_note/pages/${pageInfo.slug}/post.md`;
            if (fs.existsSync(postFilepath)) {
                resolve(fs.readFileSync(`${dataDir}/_note/pages/${pageInfo.slug}/post.md`, 'utf8'));
            } else {
                reject(`/${pageInfo.slug} does not exist`);
            }
        })
    }

    // public static savePost(post: Post) {
    //
    //
    // }
}

export interface PageInfo {
    slug: string;
}

// export interface PostsInfo {
//     year?: string;
//     month?: string;
//     day?: string;
//     required?: boolean;
// }