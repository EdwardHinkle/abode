import * as Promise from 'bluebird';
import * as goodreads from '../goodreads';
import * as webmentions from '../webmentions';
import * as configTools from '../config';
import * as jekyll from '../jekyll';
import * as git from '../git';
import * as request from 'request';

export function rebuildServer(req?, res?) {    

    Promise.all([
        goodreads.getGoodreadsData(),
        webmentions.getWebmentionData(),
        configTools.importPeopleData()
    ]).then((results) => {
        // All tasks are done, we can restart the jekyll server, etc.
        console.log("Rebuild ready...");

        return jekyll.runJekyllBuild()
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

}

export function rebuildServerFromSlack(req?, res?) {

    if (req.body.token != "h0uOKoXJklurbaIY6AbqW9PZ") {
        console.log("Unauthorized Rebuild Attempt From Slack");
        res.status(401).send("denied");
        return;
    }

    res.status(200).send("Site rebuild process...");

    git.runGitStageAll()
        .then(() => { return git.runGitCommit(); })
        .then(() => { return git.runGitPull() })
        .then(() => {

            return Promise.all([
                goodreads.getGoodreadsData(),
                webmentions.getWebmentionData(),
                configTools.importPeopleData()
            ]).then((results) => {
                // All tasks are done, we can restart the jekyll server, etc.
                console.log("Rebuild ready...");
                request.post({
                    url: req.body.response_url,
                    json: {
                        "response_type": "in_channel",
                        "text": "Imports finished, running jekyll"
                    }
                }, (err, data) => {
                    if (err != undefined) {
                        console.log(`ERROR: ${err}`);
                    }
                    if (data.statusCode != 200) {
                        console.log("oops Slack Error");
                    } else {
                        console.log("Successfull sent Slack Message");
                    }

                });

                return jekyll.runJekyllBuild()
                .then(() => { return git.runGitStageAll(); })
                .then(() => { return git.runGitCommit(); })
                .then(() => { return git.runGitPush(); })
                .then(() => {
                    request.post({
                        url: req.body.response_url,
                        json: {
                            "response_type": "in_channel",
                            "text": "Rebuild Complete"
                        }
                    }, (err, data) => {
                        if (err != undefined) {
                            console.log(`ERROR: ${err}`);
                        }
                        if (data.statusCode != 200) {
                            console.log("oops Slack Error");
                        } else {
                            console.log("Successfull sent Slack Message");
                        }

                    });
                }).catch((error) => {
                    console.log("Caught Error");
                    console.log(error);
                    if (error != undefined) {
                        request.post({
                            url: req.body.response_url,
                            json: {
                                "response_type": "in_channel",
                                "text": "Uh, oh! There was an error: " + error
                            }
                        }, (err, data) => {
                            if (err != undefined) {
                                console.log(`ERROR: ${err}`);
                            }
                            if (data.statusCode != 200) {
                                console.log("oops Slack Error");
                            } else {
                                console.log("Successfully sent Slack Message");
                            }

                        });
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

export function refreshServerWithDrafts(req?, res?) {
    return Promise.all([
        goodreads.getGoodreadsData(),
        webmentions.getWebmentionData()
    ]).then((results) => {
        // All tasks are done, we can restart the jekyll server, etc.
        console.log("Refresh ready...");

        return jekyll.runJekyllDraftBuild()
        .then(() => {
            if (res != undefined) {
                res.status(202).send('Draft Site Refresh');
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
