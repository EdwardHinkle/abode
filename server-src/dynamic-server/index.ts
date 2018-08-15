import * as express from 'express';
import * as yaml from 'js-yaml';
import {Posts} from "../model/posts.model";
import {Post, PostType} from "../model/post.model";
import moment = require("moment");
import * as pug from 'pug';

export let dynamicRouter = express.Router();

dynamicRouter.get('/microblog-syndication.json', (req, res) => {
    let numberOfPreviousDays = 3;

    let combinedPromises: Promise<Post[]>[] = [];

    let thisYear = moment().format("YYYY");
    let thisMonth = moment().format("MM");
    let thisDate = moment().format("DD");

    for (let date = parseInt(thisDate); date >= parseInt(moment().format("DD")) - numberOfPreviousDays; date--) {
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

    Promise.all(combinedPromises)
        .catch(error => {
            console.log("error loading homepage", error);
            return combinedPromises;
        })
        .then(arrayOfPosts => {

            let posts = [].concat.apply([], arrayOfPosts);

            posts.sort((a: Post, b: Post) => {
                return b.properties.date.diff(a.properties.date);
            });

            let jsonFeed = {
                "version": "https://jsonfeed.org/version/1",
                "title": "@EddieHinkle feed",
                "home_page_url": "https://eddiehinkle.com/",
                "feed_url": "https://eddiehinkle.com/microblog-syndication.json",
                "hubs": [
                    {
                        "type": "WebSub",
                        "url": "https://switchboard.p3k.io/"
                    }
                ],
                "author": {
                    "name": "Eddie Hinkle",
                    "url": "https://eddiehinkle.com/",
                    "avatar": "https://eddiehinkle.com/images/profile.jpg"
                },
                "items": []
            };

            posts.forEach(post => {

                if (post.properties.syndication !== undefined &&
                    post.properties.syndication.length > 0) {

                    post.properties.syndication.forEach(syndication => {

                        if (syndication.url === 'https://micro.blog/EddieHinkle') {
                            let feedItem: any = {
                                "id": `https://eddiehinkle.com${post.getOfficialPermalink()}`,
                                "url": `https://eddiehinkle.com${post.getOfficialPermalink()}`,
                                "date_published": post.properties.date.format()
                            };

                            if (post.properties.name !== undefined && post.properties.name > "") {
                                feedItem.title = post.properties.name;
                            }

                            feedItem.content_html = pug.renderFile(`${req.app.get('config').app_root}/../views/posts/microblog-syndication.pug`, {
                                post: post
                            });

                            jsonFeed.items.push(feedItem);
                        }

                    });
                }

            });

            res.json(jsonFeed);

        });
});

dynamicRouter.get('/photos/:year(\\d+)?/:month(\\d+)?/:day(\\d+)?/', (req, res) => {

    let combinedPromises: Promise<Post[]>[] = [];

    let pageDate = moment();

    if (req.params.year !== undefined) {
        pageDate.year(req.params.year);
    }

    if (req.params.month !== undefined) {
        pageDate.month(req.params.month);
    }

    if (req.params.day !== undefined) {
        pageDate.day(req.params.day);
    }

    Posts.getPosts({
        year: pageDate.format("YYYY"),
        month: pageDate.format("MM"),
        day: pageDate.format("DD")
    }).catch(error => {
            console.log("error loading homepage", error);
            return combinedPromises;
        })
        .then(arrayOfPosts => {

            let posts = [].concat.apply([], arrayOfPosts);

            posts.sort((a: Post, b: Post) => {
                return b.properties.date.diff(a.properties.date);
            });

            posts = posts.filter(post => post.properties.photo !== undefined &&
                                         post.properties.photo.length > 0 &&
                                         post.getPostType() !== PostType.Listen &&
                                         post.getPostType() !== PostType.Watch &&
                                         post.getPostType() !== PostType.Audio);

            res.render("posts/photos", {
                posts: posts
            });
        });
});

dynamicRouter.get('/', (req, res) => {

    let numberOfPreviousDays = 10;

    let combinedPromises: Promise<Post[]>[] = [];

    for (let date = moment(); moment().diff(date, "days") < numberOfPreviousDays; date.subtract(1, "day")) {

        combinedPromises.push(Posts.getPosts({
            year: date.format("YYYY"),
            month: date.format("MM"),
            day: date.format("DD")
        }));

    }

    Promise.all(combinedPromises)
    .catch(error => {
        console.log("error loading homepage", error);
        return combinedPromises;
    })
    .then(arrayOfPosts => {

        let posts = [].concat.apply([], arrayOfPosts);
        let latestDrank: Post;
        let latestAte: Post[] = [];
        let latestCheckin: Post;
        let latestListen: Post[] = [];
        let latestWatch: Post;
        let latestPhoto: Post[] = [];
        let latestPhotoCount: number = 0;
        let latestNotes: Post[] = [];
        let latestArticles: Post[] = [];
        let latestSocial: Post[] = [];
        let latestPodcast: Post;

        posts.sort((a: Post, b: Post) => {
            return b.properties.date.diff(a.properties.date);
        });

        posts.forEach(post => {
            let postType = post.getPostType();

            switch(postType) {
                case PostType.Audio:
                    if (latestPodcast === undefined) {
                        latestPodcast = post;
                    }
                    break;
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
                case PostType.Watch:
                    if (latestWatch === undefined && (post.properties.show_name !== undefined || post.properties.movie_name !== undefined)) {
                        latestWatch = post;
                    }
                    break;
                case PostType.Listen:
                    if (latestListen.length < 4) {
                        latestListen.push(post);
                    }
                    break;
                case PostType.Note:
                    if (latestNotes.length < 10) {
                        latestNotes.push(post);
                    }
                    break;
                case PostType.Article:
                    if (latestArticles.length < 10 && post.isPublic()) {
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

            if (latestPhotoCount < 4) {
                if (post.properties.photo !== undefined &&
                    post.properties.photo.length > 0 &&
                    post.getPostType() !== PostType.Listen &&
                    post.getPostType() !== PostType.Watch &&
                    post.getPostType() !== PostType.Audio &&
                    post.properties.category.indexOf("reading") === -1) {

                    latestPhotoCount += post.properties.photo.length;
                    latestPhoto.push(post);
                }
            }
        });

        res.render("homepage/homepage", {
            latestDrank: latestDrank,
            latestAte: latestAte.reverse(),
            latestCheckin: latestCheckin,
            latestListen: latestListen,
            latestWatch: latestWatch,
            latestPhoto: latestPhoto,
            latestNotes: latestNotes,
            latestArticles: latestArticles,
            latestSocial: latestSocial,
            latestPodcast: latestPodcast
        });
    });
});

dynamicRouter.get('/:year(\\d+)/', (req, res, next) => {

    let pageDate = moment();
    pageDate.year(req.params.year);

    Posts.getPosts({
        year: pageDate.format("YYYY")
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

    let pageDate = moment();
    pageDate.year(req.params.year);
    pageDate.month(req.params.month);

    Posts.getPosts({
        year: pageDate.format("YYYY"),
        month: pageDate.format("MM")
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

    let pageDate = moment();
    pageDate.year(req.params.year);
    pageDate.month(parseInt(req.params.month)-1);
    pageDate.date(parseInt(req.params.day));
    pageDate.hour(0).minute(0).second(0).millisecond(0);

    let now = moment().hour(0).minute(0).second(0).millisecond(0);

    if (now.diff(pageDate, "day") < 0) {

        res.render("posts/futureDay", {
            today: {
                label: `Check out what's happening today`,
                link: `/${now.format("YYYY")}/${now.format("MM")}/${now.format("DD")}/`
            }
        });
        return;

    }

    Posts.getPosts({
        year: pageDate.format("YYYY"),
        month: pageDate.format("MM"),
        day: pageDate.format("DD")
    }).then(posts => {

        posts.sort((a: Post, b: Post) => {
            return b.properties.date.diff(a.properties.date);
        });

        let pageData: any = {
            title: `${pageDate.format("MMM DD, YYYY")}`,
            posts: posts
        };

        let nextDate = pageDate.clone().add(1, "day");
        if (now.diff(nextDate, "day") >= 0) {
            let linkDate = nextDate;
            pageData.next = {
                label: `${linkDate.format("MMM DD, YYYY")}`,
                link: `/${linkDate.format("YYYY")}/${linkDate.format("MM")}/${linkDate.format("DD")}/`
            }
        }

        let previousDate = pageDate.clone().subtract(1, "day");
        if (moment("06/21/1987", "MM/DD/YYYY").diff(previousDate, "day") < 0) {
            let linkDate = previousDate;
            pageData.previous = {
                label: `${linkDate.format("MMM DD, YYYY")}`,
                link: `/${linkDate.format("YYYY")}/${linkDate.format("MM")}/${linkDate.format("DD")}/`
            }
        }

        res.render("posts/daySummary", pageData);
    }).catch(error => {
        console.log("ERROR", error);
        next();
    });
});

dynamicRouter.get('/:year(\\d+)/:month(\\d+)/:day(\\d+)/:postIndex(\\d+)/debug/', (req, res) => {

    console.log('DEBUG Post');

    let year = req.params.year;
    let month = req.params.month;
    let day = req.params.day;
    let postIndex = req.params.postIndex;

    let promises = [];
    let postInfo = {
        year: year,
        month: month,
        day: day,
        postIndex: postIndex
    };

    promises.push(Posts.getPostData(postInfo));
    promises.push(Posts.getPost(postInfo));

    Promise.all(promises).then(postArray => {

        let yamlFileArray = postArray[0].split("---\n");
        let yamlData = yaml.safeLoad(yamlFileArray[1]);

        let saveData = postArray[1].getSaveObject();

        // Now we need to display the post
        res.render("posts/debugPost", {
            fileData: JSON.stringify(yamlData, null, 2),
            postData: JSON.stringify(saveData, null, 2)
        });
        return;

    }).catch(error => {
        if (error !== undefined) {
            console.log('url failed');
            console.log(error);
            res.render("posts/errorMessage", {
                errorMessage: "post not able to be found"
            });
            return;
        }
    });

});

dynamicRouter.get('/:year(\\d+)/:month(\\d+)/:day(\\d+)/:postIndex(\\d+)/:postType?/', (req, res) => {

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
        res.render("posts/fullPost", {
            post: post
        });
        return;
    }).catch(error => {
        if (error !== undefined) {
            res.render("posts/errorMessage", {
                errorMessage: "Sorry, the post you are looking for is still processing"
            });
            return;
        }
    });

});