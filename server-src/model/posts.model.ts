import * as fs from "fs";
import * as yaml from "js-yaml";
import {Post, PostType} from "./post.model";
import {DataController} from "./data.controller";

let dataDir = __dirname + "/../../jekyll/_source";

export class Posts {
    public static getLatestPost() {

    }

    public static searchPosts(searchInfo: SearchPostsInfo): Promise<Post[]> {
        let posts: Promise<Post>[] = [];
        // Select the post ids we need to fetch the actual file
        let sql = `SELECT posts.year, posts.month, posts.day, posts.post_index FROM posts `;

        // If we are grabbing by channel we need to join to the posts_channel
        if (searchInfo.inChannel) {
            sql += `INNER JOIN posts_channels ON posts.year = posts_channels.post_year AND posts.month = posts_channels.post_month AND posts.day = posts_channels.post_day AND posts.post_index=posts_channels.post_index `;
        }

        // If we are grabbing by tag we need to join to the posts_tags
        if (searchInfo.taggedWith) {
            sql += `INNER JOIN posts_tags ON posts.year = posts_tags.post_year AND posts.month = posts_tags.post_month AND posts.day = posts_tags.post_day AND posts.post_index=posts_tags.post_index `;
        }

        // Set up the where statement
        sql += `WHERE `;

        let where = [];

        if (searchInfo.inChannel) {
            where.push(` posts_channels.channel = "${searchInfo.inChannel}" `);
        }

        if (searchInfo.taggedWith) {
            let whereSql = ` (`;

            searchInfo.taggedWith.forEach((tagName, i, tags) => {
                whereSql += `posts_tags.tag_name = "${tagName}"`;
                if (i < tags.length - 1) {
                    whereSql += ` OR `;
                }
            });

            whereSql += `) `;

            where.push(whereSql);
        }

        if (searchInfo.hasType) {
            let whereSql = ` (`;

            searchInfo.hasType.forEach((typeName, i, types) => {
                whereSql += `posts.post_type = "${typeName}"`;
                if (i < types.length - 1) {
                    whereSql += ` OR `;
                }
            });

            whereSql += `) `;

            where.push(whereSql);
        }

        if (searchInfo.years) {
            let whereSql = ` (`;

            searchInfo.years.forEach((year, i, years) => {
                whereSql += `posts.year = "${year}"`;
                if (i < years.length - 1) {
                    whereSql += ` OR `;
                }
            });

            whereSql += `) `;

            where.push(whereSql);
        }

        if (searchInfo.months) {
            let whereSql = ` (`;

            searchInfo.months.forEach((month, i, months) => {
                whereSql += `posts.month = "${month}"`;
                if (i < months.length - 1) {
                    whereSql += ` OR `;
                }
            });

            whereSql += `) `;

            where.push(whereSql);
        }

        if (searchInfo.days) {
            let whereSql = ` (`;

            searchInfo.days.forEach((day, i, days) => {
                whereSql += `posts.day = "${day}"`;
                if (i < days.length - 1) {
                    whereSql += ` OR `;
                }
            });

            whereSql += `) `;

            where.push(whereSql);
        }

        if (searchInfo.showPrivate) {
            where.push(` (posts.visibility = "public" OR posts.visibility = "private") `);
        } else {
            where.push(` posts.visibility = "public" `);
        }

        where.forEach((whereStatement, i) => {
            sql += whereStatement;
            if (i < where.length-1) {
                sql += ' AND ';
            }
        });

        if (searchInfo.groupBy) {
            let sqlStatement = ` GROUP BY `;

            searchInfo.groupBy.forEach((groupByName, i, groupByItems) => {
                sqlStatement += `"${groupByName}"`;
                if (i < groupByItems.length - 1) {
                    sqlStatement += `, `;
                }
            });

            sqlStatement += ` `;

            sql += sqlStatement;
        }

        if (searchInfo.orderBy) {
            let sqlStatement = ` ORDER BY `;

            searchInfo.orderBy.forEach((orderByName, i, orderByItems) => {
                sqlStatement += `"${orderByName}"`;

                if (searchInfo.orderDirection) {
                    sqlStatement += (searchInfo.orderDirection[i] ? searchInfo.orderDirection[i] : 'DESC');
                }

                if (i < orderByItems.length - 1) {
                    sqlStatement += `, `;
                }
            });

            sqlStatement += ` `;

            sql += sqlStatement;
        }

        if (searchInfo.limit) {
            sql += ` LIMIT ${searchInfo.limit}`;
        }

        console.log('searching sql');
        console.log(sql);

        return new Promise((resolve, reject) => {
            DataController.db.serialize(() => {
                DataController.db.each(sql,
                    (error, row) => {
                        if (error) {
                            console.log('ERROR!');
                            console.log(error);
                        }

                        posts.push(Posts.getPost({
                            year: row.year,
                            month: ("0" + row.month).slice(-2),
                            day: ("0" + row.day).slice(-2),
                            postIndex: row.post_index
                        }));
                    }, (error, count) => {
                        Promise.all(posts).then(posts => {
                            resolve(posts);
                        })
                    });
            });
        });
    }

    public static getAllPosts(showPrivate: boolean = false): Promise<Post[]> {

        return new Promise((resolve, reject) => {
            let postFilepath = `${dataDir}/_note/posts`;

            if (fs.existsSync(postFilepath)) {
                this.getPostsInDir(postFilepath, true, showPrivate).then(posts => {
                    resolve(posts);
                })
            } else {
                console.log(`Path does not exist: ${postFilepath}`);
                resolve([]);
            }
        });
    }

    public static getPosts(postsInfo: PostsInfo): Promise<Post[]> {

        return new Promise((resolve, reject) => {
            let postFilepath = `${dataDir}/_note/posts`;

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
                this.getPostsInDir(postFilepath, true, postsInfo.showPrivate).then(posts => {
                    resolve(posts);
                }).catch(error => {
                    console.log('oops!');
                    console.log(error);
                    reject(error);
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

    private static getPostsInDir(dirPath, recursive: boolean = false, showPrivate: boolean = false): Promise<Post[]> {

        return new Promise((resolve, reject) => {

            let postPromises: Promise<Post[]>[] = [];

            fs.readdirSync(dirPath).filter((filename) => {
                return filename.indexOf(".") != 0;
            }).forEach((filename) => {

                let fileStat = fs.statSync(`${dirPath}/${filename}`);
                if (fileStat.isDirectory()) {
                    if (recursive) {
                        postPromises.push(this.getPostsInDir(`${dirPath}/${filename}`, recursive, showPrivate));
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
                let posts = [].concat.apply([], arrayOfPosts);
                let filteredPosts;
                if (!showPrivate) {
                    filteredPosts = posts.filter((post: Post) => post.isPublic());
                } else {
                    filteredPosts = posts;
                }
                resolve(filteredPosts);
            }).catch(error => {
                reject(error);
            });
        });
    }

    public static getPost(postInfo: PostInfo): Promise<Post> {

        return new Promise((resolve, reject) => {
            let postFilepath = `${dataDir}/_note/posts/${postInfo.year}/${postInfo.month}/${postInfo.day}/${postInfo.postIndex}/post.md`;
            if (fs.existsSync(postFilepath)) {
                let fileInfo = fs.readFileSync(`${dataDir}/_note/posts/${postInfo.year}/${postInfo.month}/${postInfo.day}/${postInfo.postIndex}/post.md`, 'utf8');
                Post.createFromJekyllFile(fileInfo).then(post => {
                    resolve(post);
                });
            } else {
                reject("File does not exist");
            }
        });
    }

    public static getPostData(postInfo: PostInfo): Promise<any> {

        return new Promise((resolve, reject) => {
            let postFilepath = `${dataDir}/_note/posts/${postInfo.year}/${postInfo.month}/${postInfo.day}/${postInfo.postIndex}/post.md`;
            if (fs.existsSync(postFilepath)) {
                resolve(fs.readFileSync(`${dataDir}/_note/posts/${postInfo.year}/${postInfo.month}/${postInfo.day}/${postInfo.postIndex}/post.md`, 'utf8'));
            } else {
                reject("file does not exist");
            }
        })
    }

    public static savePost(post: Post) {


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
    showPrivate?: boolean;
}

export interface SearchPostsInfo {
    hasType?: PostType[];
    taggedWith?: string[];
    years?: [number];
    months?: [number];
    days?: [number];
    inChannel?: string;
    showPrivate?: boolean;
    groupBy?: [string];
    orderBy?: [string];
    orderDirection?: ['ASC' | 'DESC'];
    limit?: number;
}