import * as Promise from 'bluebird';
import * as goodreads from '../goodreads';
import * as webmentions from '../webmentions';
import * as jekyll from '../jekyll';
import * as git from '../git';

export function rebuildServer(req?, res?) {
    git.runGitPull().then(() => {

        return Promise.all([
            goodreads.getGoodreadsData(),
            webmentions.getWebmentionData()
        ]).then((results) => {
            // All tasks are done, we can restart the jekyll server, etc.
            console.log("Rebuild ready...");

            return jekyll.runJekyllBuild()
            .then(() => { return git.runGitCommit(); })
            .then(() => { return git.runGitPush(); })
            .then(() => {
                if (res != undefined) {
                    res.status(202).send('Site Rebuilt');
                }
            }).catch((error) => {
                console.log("Caught Error");
                console.log(error);
                if (error != undefined && res != undefined) {
                    res.status(202).send(error);
                }
            });
            
        });

    });
}

export function refreshServer(req?, res?) {
    return Promise.all([
        goodreads.getGoodreadsData(),
        webmentions.getWebmentionData()
    ]).then((results) => {
        // All tasks are done, we can restart the jekyll server, etc.
        console.log("Refresh ready...");

        return jekyll.runJekyllBuild()
        .then(() => {
            if (res != undefined) {
                res.status(202).send('Site Refresh');
            }
        }).catch((error) => {
            console.log("Caught Error");
            console.log(error);
            if (error != undefined && res != undefined) {
                res.status(202).send(error);
            }
        });
        
    });
}
