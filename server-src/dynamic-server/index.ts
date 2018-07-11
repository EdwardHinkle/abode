import * as express from 'express';
import * as path from 'path';
import * as fs from "fs";
import * as yaml from 'js-yaml';
import * as marked from 'marked';
import { People } from '../people';
import {Posts} from "../model/posts.model";
import {Post} from "../model/post.model";

let dataDir = __dirname + "/../../jekyll/_source";

export let dynamicRouter = express.Router();

dynamicRouter.get('', (req, res, next) => {
    res.render("homepage/homepage");
    return;
});

// dynamicRouter.get('/:year(\\d+)/', (req, res, next) => {
//     res.send(`Year: ${req.params.year}`);
//
//     // TODO: This needs to be a yearly summary
// });
//
// dynamicRouter.get('/:year(\\d+)/:month(\\d+)/', (req, res, next) => {
//     res.send(`Year: ${req.params.year}, Month: ${req.params.month}`);
//
//     // TODO: This needs to be a monthly summary
// });
//
// dynamicRouter.get('/:year(\\d+)/:month(\\d+)/:day(\\d+)/', (req, res, next) => {
//     res.send(`Year: ${req.params.year}, Month: ${req.params.month}, Day: ${req.params.day}`);
//
//     // TODO: This needs to be a daily summary
// });

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