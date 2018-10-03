import * as Promise from 'bluebird';
import * as moment from 'moment';
import * as goodreads from '../goodreads';
import * as webmentions from '../webmentions';
import * as configTools from '../config';
import * as jekyll from '../jekyll';
import * as git from '../git';
import * as request from 'request';

export function rebuildServer(req?, res?) {    

    Promise.all([
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

    request.post(`https://aperture.eddiehinkle.com/micropub/`, {
        'auth': {
            'bearer': `my7XNxxxB9EYoyDCLBQppcqD7Hsqz45R`
        },
        body: {
            type: ['h-entry'],
            properties: {
                content: [`Site rebuild process...`],
                published: [moment().format()],
                author: [{
                    type: ['h-card'],
                    properties: {
                        name: ['eddiehinkle.com'],
                        url: ['https://eddiehinkle.com']
                    }
                }]
            }
        },
        json: true
    }, (err, data) => {
        if (err != undefined) {
            console.log(`ERROR: ${err}`);
        }
        if (data.statusCode !== 201 && data.statusCode !== 202) {
            console.log("oops Microsub Notification Error");
        } else {
            console.log("Successfully sent Microsub Notification");
        }
    });

    git.runGitStageAll()
        .then(() => { return git.runGitCommit(); })
        .then(() => { return git.runGitPull() })
        .then(() => {

            return Promise.all([
                webmentions.getWebmentionData(),
                configTools.importPeopleData()
            ]).then((results) => {
                // All tasks are done, we can restart the jekyll server, etc.
                console.log("Rebuild ready...");
                request.post(`https://aperture.eddiehinkle.com/micropub/`, {
                    'auth': {
                        'bearer': `my7XNxxxB9EYoyDCLBQppcqD7Hsqz45R`
                    },
                    body: {
                        type: ['h-entry'],
                        properties: {
                            content: [`Imports finished, running jekyll`],
                            published: [moment().format()],
                            author: [{
                                type: ['h-card'],
                                properties: {
                                    name: ['eddiehinkle.com'],
                                    url: ['https://eddiehinkle.com']
                                }
                            }]
                        }
                    },
                    json: true
                }, (err, data) => {
                    if (err != undefined) {
                        console.log(`ERROR: ${err}`);
                    }
                    if (data.statusCode !== 201 && data.statusCode !== 202) {
                        console.log("oops Microsub Notification Error");
                    } else {
                        console.log("Successfully sent Microsub Notification");
                    }
                });

                return jekyll.runJekyllBuild()
                .then(() => { return git.runGitStageAll(); })
                .then(() => { return git.runGitCommit(); })
                .then(() => { return git.runGitPush(); })
                .then(() => {
                    request.post(`https://aperture.eddiehinkle.com/micropub/`, {
                        'auth': {
                            'bearer': `my7XNxxxB9EYoyDCLBQppcqD7Hsqz45R`
                        },
                        body: {
                            type: ['h-entry'],
                            properties: {
                                content: [`Rebuild Complete`],
                                published: [moment().format()],
                                author: [{
                                    type: ['h-card'],
                                    properties: {
                                        name: ['eddiehinkle.com'],
                                        url: ['https://eddiehinkle.com']
                                    }
                                }]
                            }
                        },
                        json: true
                    }, (err, data) => {
                        if (err != undefined) {
                            console.log(`ERROR: ${err}`);
                        }
                        if (data.statusCode !== 201 && data.statusCode !== 202) {
                            console.log("oops Microsub Notification Error");
                        } else {
                            console.log("Successfully sent Microsub Notification");
                        }
                    });
//                    jekyll.runJekyllPrivateBuild().then(() => {
//                        request.post(`https://aperture.eddiehinkle.com/micropub/`, {
//                            'auth': {
//                                'bearer': `my7XNxxxB9EYoyDCLBQppcqD7Hsqz45R`
//                            },
//                            body: {
//                                type: ['h-entry'],
//                                properties: {
//                                    content: [`Private Rebuild Complete`],
//                                    published: [moment().format()],
//                                    author: [{
//                                        type: ['h-card'],
//                                        properties: {
//                                            name: ['eddiehinkle.com'],
//                                            url: ['https://eddiehinkle.com']
//                                        }
//                                    }]
//                                }
//                            },
//                            json: true
//                        }, (err, data) => {
//                            if (err != undefined) {
//                                console.log(`ERROR: ${err}`);
//                            }
//                            if (data.statusCode !== 201 && data.statusCode !== 202) {
//                                console.log("oops Microsub Notification Error");
//                            } else {
//                                console.log("Successfully sent Microsub Notification");
//                            }
//                        });
//                    });
                }).catch((error) => {
                    console.log("Caught Error");
                    console.log(error);
                    if (error != undefined) {
                        request.post(`https://aperture.eddiehinkle.com/micropub/`, {
                            'auth': {
                                'bearer': `my7XNxxxB9EYoyDCLBQppcqD7Hsqz45R`
                            },
                            body: {
                                type: ['h-entry'],
                                properties: {
                                    content: [`Uh, oh! There was an error: ${error}`],
                                    published: [moment().format()],
                                    author: [{
                                        type: ['h-card'],
                                        properties: {
                                            name: ['eddiehinkle.com'],
                                            url: ['https://eddiehinkle.com']
                                        }
                                    }]
                                }
                            },
                            json: true
                        }, (err, data) => {
                            if (err != undefined) {
                                console.log(`ERROR: ${err}`);
                            }
                            if (data.statusCode !== 201 && data.statusCode !== 202) {
                                console.log("oops Microsub Notification Error");
                            } else {
                                console.log("Successfully sent Microsub Notification");
                            }
                        });
                    }
                });
                
            });

    });
}

export function refreshServer(req?, res?) {
    return Promise.all([
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
