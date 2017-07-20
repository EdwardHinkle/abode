import * as express from 'express';
import * as dataController from '../dataController';

const config = require('../../../abodeConfig.json');

export let siteRouter = express.Router();

// Look for posts and post assets
siteRouter.get('/:year([0-9][0-9][0-9][0-9])/:month([0-9][0-9])/:day([0-9][0-9])/:index([0-9]+)*', function siteSupport(req, res, next) {
    // todo: Need to find a way to serve static assets out of public folders using this as well.
    // In order to do that, I need to check the parameter after the index and see if it has a
    // file extension, if so, check for that file in the post's /assets folder. Also to figure out...should it check for
    // assets even if there is no post?

    // Get posts for current date structure
    const posts = dataController.getPostsByDate(req, [req.params.year, req.params.month, req.params.day, req.params.index]);

    if (posts.length === 0) {
        // No posts were found, continue with the routing process
        next();
    }

    const post = posts[0];
    const canonicalPostUrl = post.permalink.replace(':year', <string><any>req.params.year)
                                           .replace(':month', <string><any>req.params.month)
                                           .replace(':day', <string><any>req.params.day)
                                           .replace(':slug', <string><any>req.params.index);

    // If current url found a post but is not the canonical version, redirect to the canonical post
    if (canonicalPostUrl !== req.originalUrl) {
        res.redirect(301, canonicalPostUrl);
    } else {
        // Url is post's canonical url, pass along through routing for Angular
        next();
    }

});
