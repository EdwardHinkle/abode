import {Database} from "sqlite3";
import {Channel} from "./channel.model";
import {Posts} from "./posts.model";
import {DataController} from "./data.controller";


export class CacheController {

    public static cacheExists(callback: (exists: boolean) => void) {
        DataController.db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='posts'",
            (error, result, third) => {
                if (error || result == null) {
                    callback(false);
                } else {
                    callback(true);
                }
            });
    }

    public static rebuildCache() {
        DataController.db.serialize(() => {

            DataController.db.run("DROP TABLE IF EXISTS channels");
            DataController.db.run("DROP TABLE IF EXISTS posts");
            DataController.db.run("DROP TABLE IF EXISTS tags");
            DataController.db.run("DROP TABLE IF EXISTS posts_tags");
            this.buildCache();

        });
    }

    public static buildCache() {

        let channels = Channel.getChannels();

        DataController.db.serialize(() => {

            // Create databases
            DataController.db.run("CREATE TABLE `channels` (`channel_id` varchar(255), `name` varchar(255), `layout` varchar(255), `type` varchar(255))");
            DataController.db.run("CREATE TABLE `posts` (`year` int, `month` int, `day` int, `post_index` int, `name` text, published text, post_type text, visibility varchar(255), content text, PRIMARY KEY (year, month, day, post_index)) WITHOUT ROWID");
            DataController.db.run("CREATE TABLE `tags` (`tag_id` INTEGER PRIMARY KEY, `name` varchar(255) UNIQUE)");
            DataController.db.run("CREATE TABLE `posts_tags` (`post_year` int, post_month int, post_day int, post_index int, `tag_name` text, PRIMARY KEY (post_year, post_month, post_day, post_index, tag_name), FOREIGN KEY(post_year, post_month, post_day, post_index) REFERENCES posts(year, month, day, post_index), FOREIGN KEY(tag_name) REFERENCES tags(name))");
            DataController.db.run("CREATE TABLE `posts_channels` (`post_year` int, post_month int, post_day int, post_index int, `channel` varchar(255), PRIMARY KEY (post_year, post_month, post_day, post_index, channel), FOREIGN KEY(post_year, post_month, post_day, post_index) REFERENCES posts(year, month, day, post_index), FOREIGN KEY(channel) REFERENCES channels(channel_id))");

            // Insert Channel Database
            let addChannels = DataController.db.prepare("INSERT INTO `channels` VALUES (?, ?, ?, ?)");
            channels.forEach(channel => {
                addChannels.run(channel.id, channel.name, channel.layout, channel.type);
            });
            addChannels.finalize();

            console.log('Fetching Posts');

            // Insert Posts Database
            Posts.getAllPosts(true).then(posts => {
                console.log('posts fetched');

                DataController.db.serialize(() => {

                    let addPost = DataController.db.prepare("INSERT INTO `posts` (year, month, day, post_index, name, published, post_type, visibility, content) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
                    let addTag = DataController.db.prepare("INSERT OR IGNORE INTO `tags` (name) VALUES (?)");
                    let addPostTags = DataController.db.prepare("INSERT INTO `posts_tags` (post_year, post_month, post_day, post_index, tag_name) VALUES (?, ?, ?, ?, ?)");
                    let addPostChannels = DataController.db.prepare("INSERT INTO `posts_channels` (post_year, post_month, post_day, post_index, channel) VALUES (?, ?, ?, ?, ?)");

                    posts.forEach(post => {
                        addPost.run(
                            post.properties.getYearString(),
                            post.properties.getMonthString(),
                            post.properties.getDayString(),
                            post.properties.postIndex,
                            post.properties.name ? post.properties.name : '',
                            post.properties.date.format(),
                            post.getPostType(),
                            post.properties.visibility,
                            post.properties.content
                        );

                        // console.log(post.properties);
                        if (post.properties.category) {
                            post.properties.category.forEach(tagName => {
                                addTag.run(
                                    tagName
                                );

                                addPostTags.run(
                                    post.properties.getYearString(),
                                    post.properties.getMonthString(),
                                    post.properties.getDayString(),
                                    post.properties.postIndex,
                                    tagName
                                );
                            });
                        }
                        if (post.properties['abode-channel']) {
                            post.properties['abode-channel'].forEach(channelName => {
                                addPostChannels.run(
                                    post.properties.getYearString(),
                                    post.properties.getMonthString(),
                                    post.properties.getDayString(),
                                    post.properties.postIndex,
                                    channelName
                                );
                            });
                        }


                    });

                    addPost.finalize();
                    addTag.finalize();
                    addPostTags.finalize();
                    addPostChannels.finalize();

                });

            }).catch(error => {
                console.log("Failed to fetch the posts");
                console.log(error);
            });

        });

    }

}