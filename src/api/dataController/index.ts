import * as express from 'express';
import * as fs from 'fs';
import * as yaml from 'js-yaml';
import * as _ from 'lodash';
import * as moment from 'moment';
import * as mf2 from '../mf2';

const dataDir = __dirname + '/../../../data';

export let dataRouter = express.Router();

dataRouter.get('/posts/latest', getLatestPosts);
dataRouter.get('/:year', apiCall);
dataRouter.get('/:year/:month', apiCall);
dataRouter.get('/:year/:month/:day', apiCall);
dataRouter.get('/:year/:month/:day/:index', apiCall);
dataRouter.get('/:year/:month/:day/:index/:type', apiCall);

function filterPosts(req, posts) {
    let filteredPosts;

    // todo: apply ?filter as needed
    filteredPosts = _.filter(posts, (post) => {
        // todo: This eventually needs to check if the user is logged in and if they are logged in,
        // private posts should be returned as long as the "audience" is the same as the logged in user
        if (post.visibility === 'private') {
            return false;
        }
        if (req.query.types !== undefined) {
            const allowedTypes = req.query.types.split(',');
            if (allowedTypes.indexOf(mf2.getPostType(post)) === -1) {
                return false
            }
        }
        return true;
    });

    return filteredPosts;
}

function sortPosts(req, posts) {
    let sortedPosts;

    // todo: eventually add sorting options
    sortedPosts = _.sortBy(posts, (post) => {
        return post.date;
    });

    return sortedPosts;
}

function formatPosts(req, posts) {
    let formattedPosts;

    formattedPosts = _.map(posts, (post) => {
        post.date = moment(post.date, 'YYYY-MM-DD HH:mm:ss ZZ');
        return post;
    });

    return formattedPosts;
}

function filterSortFormatPosts(req, posts) {
    let confirmedArray;
    if (posts.constructor !== Array) {
            confirmedArray = [posts];
    } else {
        confirmedArray = posts;
    }
    const filteredPosts = filterPosts(req, confirmedArray);
    const sortedPosts = sortPosts(req, filteredPosts);
    const formattedPosts = formatPosts(req, sortedPosts);
    return formattedPosts;
}

export function getLatestPosts(req, res) {

    let postsReturned = [];
    const postCount = req.query.count;

    const date = moment();

    while (postsReturned.length <= postCount) {
        const year = date.format('YYYY');
        const month = date.format('MM');
        const day = date.format('DD');

        const directoryToSearch = `${dataDir}/${year}/${month}/${day}`;
        postsReturned = postsReturned.concat(filterSortFormatPosts(req, getFilesFromDir(directoryToSearch)));

        // Decrement by 1 day
        date.subtract(1, 'day');
        if (date.isBefore('1987-06-01', 'year')) {
            break;
        }
    }
    res.send(postsReturned.slice(0, postCount));
}

export function getPostsByDate(req, dateSegments): IPost[] {
    const dataReturned = filterSortFormatPosts(req, getFilesFromDir(dataDir + '/' + dateSegments.join('/')));

    return dataReturned;
}

function apiCall(req, res) {

    const dataPath = [];

    if (req.params.year) {
        dataPath.push(req.params.year);
    }

    if (req.params.month) {
        dataPath.push(req.params.month);
    }

    if (req.params.day) {
        dataPath.push(req.params.day);
    }

    if (req.params.index) {
        dataPath.push(req.params.index);
    }

    res.send(getPostsByDate(req, dataPath));
}

function getFilesFromDir(dirName: string): IPost[] {
    const dataArray = [];

    if (fs.existsSync(dirName)) {
        if (fs.existsSync(`${dirName}/post.md`)) {

            // tslint:disable-next-line:max-line-length
            const fileInfo = fs.readFileSync(`${dirName}/post.md`, 'utf8');
            const fileArray = fileInfo.split('---\n');

            const doc = yaml.safeLoad(fileArray[1]);
            doc.content = fileArray[2];

            return doc;

        } else {

            let nextDir;
            const folders = fs.readdirSync(dirName);
            folders.sort((a, b) => {
                return parseInt(a, null) - parseInt(b, null);
            });

            while (nextDir = folders.shift()) {
                dataArray.push(getFilesFromDir(`${dirName}/${nextDir}`));
            }

        }

        return _.flatten(dataArray);
    } else {
        return [];
    }
}

export interface IPost {
    'date': string,
    'layout': string,
    'title': string,
    'visibility': 'public' | 'private',
    'tags': string[],
    'properties': any,
    'slug': string,
    'permalink': string,
    'content-type': 'text/markdown' | 'text/plain' | 'text/html',
    'content': string
}