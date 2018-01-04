import * as fs from 'fs';
import * as yaml from 'js-yaml';

let config = require('../../abodeConfig.json');
let dataDir = __dirname + "/../../jekyll/_source/";
let imageDir = `${dataDir}/images`;
let entryImageDirName = `entry-images`;

let syndicateData = fs.readFileSync(__dirname + '/../../config/syndicate.yaml', 'utf8');
let syndicateTargets = yaml.safeLoad(syndicateData);

export function getMicropubConfig(queryType, req): Promise<any> {
    return Promise.resolve().then(function () {
        switch(queryType) {
            case 'syndicate-to':
                return {
                    "syndicate-to": syndicateTargets
                };
            case 'config':
                return {
                    "media-endpoint": "https://eddiehinkle.com/micropub/media",
                    "syndicate-to": syndicateTargets
                };
            // case 'source':
                //
                // req.query.url
                // return {};
        }
    });
}