import * as MicropubFormatter from 'format-microformat';
import * as moment from 'moment';
import * as fs from 'fs';
import * as path from 'path';
import * as http from 'http';
import * as git from '../git';
import * as jekyll from '../jekyll';
import * as _ from 'lodash';
import * as mfTypes from '../mf2';
import * as yaml from 'js-yaml';
import * as toMarkdown from 'to-markdown';
import * as mfo from 'mf-obj';

let imageType = require('image-type');
let readingTime = require('reading-time');

import { People } from '../people';

let config = require('../../abodeConfig.json');
let dataDir = __dirname + "/../../jekyll/_source/";
let imageDir = `${dataDir}/images`;
let entryImageDirName = `entry-images`;

export function getMicropubConfig(queryType, req): Promise<any> {
    return Promise.resolve().then(function () {
        switch(queryType) {
            case 'syndicate-to':
                return {
                    "syndicate-to": [
                        {
                            "uid": "https://twitter.com/eddiehinkle",
                            "name": "Twitter"
                        },
                        {
                            "uid": "https://www.facebook.com/EdwardTHinkle",
                            "name": "Facebook"
                        },
                        {
                            "uid": "https://news.indieweb.org/en",
                            "name": "IndieNews"
                        }
                    ]
                };
            case 'config':
                return {
                    "media-endpoint": "https://eddiehinkle.com/micropub/media",
                    "syndicate-to": [
                        {
                            "uid": "https://twitter.com/eddiehinkle",
                            "name": "twitter.com/eddiehinkle"
                        },
                        {
                            "uid": "https://www.facebook.com/EdwardTHinkle",
                            "name": "facebook.com/edwardthinkle"
                        },
                        {
                            "uid": "https://twitter.com/edwardhinkle",
                            "name": "twitter.com/edwardhinkle"
                        },
                        {
                            "uid": "https://news.indieweb.org/en",
                            "name": "IndieNews"
                        }
                    ]
                };
            // case 'source':
                //
                // req.query.url
                // return {};
        }
    });
}