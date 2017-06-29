import * as fs from 'fs';
import * as mime from 'mime-types';
import * as request from 'request';

let config = require('../../abodeConfig.json');
let dataDirPath = __dirname + "/../../jekyll/_source";
let imageDirPath = `images`;
let entryImagePath = `entry-images`;

let imageType = require('image-type');

export function getMediaEndpointRequest(req, res) {

    console.log("Reached Endpoint");

    if (req.headers.authorization === undefined || req.headers.authorization.indexOf('Bearer') == -1) {
        // ERROR no auth bearer token
        console.log("NO TOKEN");
    }

    // Need to check that the access token is valid
    request.get({
        'url': config.micropub.tokenEndpoint,
        'auth': {
            'bearer': req.headers.authorization.split(" ").pop("Bearer ")
        }
    }, (err, data) => {
        if (err != undefined) {
            console.log(`ERROR: ${err}`);
        }
        console.log("Token Verification Response");
        console.log(data);

        // If false ERROR
        if (true) {
            console.log("WRONG TOKEN");
        }

        // Get file path with filename
            let filePath = req.file.path;
        let fileExt = mime.extension(req.file.mimetype);
        let fileName = `${req.file.filename}.${fileExt}`;

        // Rename file with correct extension
        fs.renameSync(filePath, `${filePath}.${fileExt}`);

        // Send Response
        res.location(`${config.server}/${imageDirPath}/${entryImagePath}/${fileName}`).status(201).send("ok");
    });

}