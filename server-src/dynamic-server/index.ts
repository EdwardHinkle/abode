import * as express from 'express';
import * as path from 'path';
import * as fs from "fs";
import * as yaml from 'js-yaml';
import * as marked from 'marked';
import { People } from '../people';
import {Posts} from "../model/posts.model";
import {Post, PostType} from "../model/post.model";
import moment = require("moment");

let dataDir = __dirname + "/../../jekyll/_source";

export let dynamicRouter = express.Router();

dynamicRouter.get('/overview', (req, res, next) => {

    let combinedPromises: Promise<Post[]>[] = [];

    let thisYear = moment().format("YYYY");
    let thisMonth = moment().format("MM");
    let thisDate = moment().format("DD");

    for (let date = parseInt(thisDate); date >= parseInt(moment().format("DD")) - 3; date--) {
        let dateString = (date <= 9 ? "0" + date : "" + date);

        combinedPromises.push(Posts.getPosts({
            year: thisYear,
            month: thisMonth,
            day: dateString
        }));

        if (date === 1) {
            if (thisMonth === "1") {
                thisYear = "" + (parseInt(thisYear) - 1);
            }

            thisMonth = "" + (parseInt(thisMonth) - 1);
        }
    }

    Promise.all(combinedPromises).then(arrayOfPosts => {

        arrayOfPosts.forEach(posts => {
            console.log("array post length", posts.length);
        });

        let posts = [].concat.apply([], arrayOfPosts);
        let latestDrank: Post;
        let latestAte: Post[] = [];
        let latestCheckin: Post;
        let latestPhoto: Post[] = [];
        let latestPhotoCount: number = 0;
        let latestNotes: Post[] = [];
        let latestArticles: Post[] = [];
        let latestSocial: Post[] = [];

        console.log('total posts', posts.length);

        posts.sort((a: Post, b: Post) => {
            return b.properties.date.diff(a.properties.date);
        });

        console.log('total posts', posts.length);

        posts.forEach(post => {
            let postType = post.getPostType();

            switch(postType) {
                case PostType.Drank:
                    if (latestDrank === undefined) {
                        latestDrank = post;
                    }
                    break;
                case PostType.Ate:
                    if (latestAte.length === 0) {
                        latestAte.push(post);
                    } else if (latestAte[0].properties.date.diff(post.properties.date, 'minutes') < 30) {
                        latestAte.push(post);
                    }
                    break;
                case PostType.Checkin:
                    if (latestCheckin === undefined) {
                        latestCheckin = post;
                    }
                    break;
                case PostType.Photo:
                    console.log('latestPhotoCount', latestPhotoCount);
                    if (latestPhotoCount < 4) {
                        latestPhotoCount += post.properties.photo.length;
                        latestPhoto.push(post);
                    }
                    break;
                case PostType.Note:
                    if (latestNotes.length < 10) {
                        latestNotes.push(post);
                    }
                    break;
                case PostType.Article:
                    if (latestArticles.length < 10) {
                        latestArticles.push(post);
                    }
                    break;
                case PostType.Like:
                case PostType.Reply:
                case PostType.Bookmark:
                    latestSocial.push(post);
                    break;
                default:
            }
        });

        console.log('latestPhotos');
        console.log(latestPhoto);

        res.render("homepage/homepage", {
            latestDrank: latestDrank,
            latestAte: latestAte.reverse(),
            latestCheckin: latestCheckin,
            latestPhoto: latestPhoto,
            latestNotes: latestNotes,
            latestArticles: latestArticles,
            latestSocial: latestSocial
        });
    });
});

dynamicRouter.get('/:year(\\d+)/', (req, res, next) => {
    Posts.getPosts({
        year: req.params.year
    }).then(posts => {

        posts.sort((a: Post, b: Post) => {
            return b.properties.date.diff(a.properties.date);
        });

        res.render("posts/list", {
            posts: posts
        });
    }).catch(error => {
        console.log("ERROR", error);
        next();
    });
});

dynamicRouter.get('/:year(\\d+)/:month(\\d+)/', (req, res, next) => {
    Posts.getPosts({
        year: req.params.year,
        month: req.params.month
    }).then(posts => {

        posts.sort((a: Post, b: Post) => {
            return b.properties.date.diff(a.properties.date);
        });

        res.render("posts/list", {
            posts: posts
        });
    }).catch(error => {
        console.log("ERROR", error);
        next();
    });
});

dynamicRouter.get('/:year(\\d+)/:month(\\d+)/:day(\\d+)/', (req, res, next) => {
    Posts.getPosts({
        year: req.params.year,
        month: req.params.month,
        day: req.params.day
    }).then(posts => {

        posts.sort((a: Post, b: Post) => {
            return b.properties.date.diff(a.properties.date);
        });

        res.render("posts/list", {
            posts: posts
        });
    }).catch(error => {
        console.log("ERROR", error);
        next();
    });
});

dynamicRouter.get('/:year(\\d+)/:month(\\d+)/:day(\\d+)/:postIndex(\\d+)/:postType?/', (req, res, next) => {

    let year = req.params.year;
    let month = req.params.month;
    let day = req.params.day;
    let postIndex = req.params.postIndex;

    Posts.getPost({
        year: year,
        month: month,
        day: day,
        postIndex: postIndex
    }).then(post => {

        // Check if the post path is the official permalink path.
        if (!post.verifyPostPermalink(req)) {
            // Redirect to the official permalink path
            res.redirect(302, post.getOfficialPermalink());
            return;
        }

        // Now we need to display the post
        res.render("posts/fullPost", post);
        return;
    }).catch(error => {
        if (error !== undefined) {
            res.render("posts/postUnavailable");
            return;
        }
    });

});