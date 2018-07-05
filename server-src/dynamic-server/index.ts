import * as express from 'express';
import * as path from 'path';
import * as fs from "fs";
import * as yaml from 'js-yaml';
import * as marked from 'marked';
import { People } from '../people';

let dataDir = __dirname + "/../../jekyll/_source";

export let dynamicRouter = express.Router();

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

    let fileInfo = fs.readFileSync(`${dataDir}/_note/${year}/${month}/${day}/${postIndex}/post.md`, 'utf8');
    let fileArray = fileInfo.split("---\n");
    let doc = yaml.safeLoad(fileArray[1]);
    let officialPostPath = doc.permalink.replace(':year', year).replace(':month', month).replace(':day', day).replace(':slug', postIndex);

    // Check if the post path is the official permalink path.
    if (officialPostPath !== req.path) {
        // Redirect to the official permalink path
        res.redirect(302, officialPostPath);
        return;
    }

    // Start prepping post
    People.getPeople().then(peopleData => {

        doc.properties.content = marked(fileArray[2]).replace(/^<p>/, '').replace(/<\/p>\n$/, '');
        doc.properties.personTags = [];
        doc.properties.category = [];

        console.log('people data', peopleData.collection);

        if (doc.tags) {
            doc.tags.forEach(tag => {
                if (tag.indexOf('http') > -1) {
                    console.log(tag);
                    console.log(peopleData.getPersonByUrl(tag));
                    doc.properties.personTags.push(peopleData.getPersonByUrl(tag));
                } else {
                    doc.properties.category.push(tag);
                }
            });
        }

        console.log('json document', doc);
        console.log('json properties', doc.properties);

        // Now we need to display the post
        res.render("posts/fullPost", doc);
        return;
    });
});