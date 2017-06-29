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
import * as mime from 'mime-types';

let config = require('../../abodeConfig.json');
let dataDirPath = __dirname + "/../../jekyll/_source";
let imageDirPath = `images`;
let imageDir = `${dataDirPath}/${imageDirPath}`;
let entryImagePath = `entry-images`;

let imageType = require('image-type');
let readingTime = require('reading-time');

export function getMediaEndpointRequest(req, res) {

    console.log("Reached Endpoint");

    // Get file path with filename
    let filePath = req.file.path;
    let fileExt = mime.extension(req.file.mimetype);
    let fileName = `${req.file.path}.${fileExt}`;

    // Rename file with correct extension
    fs.renameSync(filePath, `${filePath}.${fileExt}`);

    // Send Response
    res.location(`${config.server}/${imageDirPath}/${entryImagePath}/${fileName}`).status(201).send("ok");

}