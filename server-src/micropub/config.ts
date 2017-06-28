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

export function getMicropubConfig(req): Promise<any> {
    return new Promise((resolve, reject) => {
        resolve({
            "media-endpoint": "https://eddiehinkle.com/micropub/media"
        });
    });
}