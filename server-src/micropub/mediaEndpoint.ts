import * as fs from 'fs';
import * as mime from 'mime-types';
import * as request from 'request';

let config = require('../../abodeConfig.json');
let dataDirPath = __dirname + "/../../jekyll/_source";
let imageDirPath = `${__dirname}/../../media-server-storage/`;

let imageType = require('image-type');

export function getMediaEndpointRequest(req, res) {

    if (req.headers.authorization === undefined || req.headers.authorization.indexOf('Bearer') == -1) {
        // ERROR no auth bearer token
        res.status(401).send({error: "unauthorized"});
        return;
    }

    // Need to check that the access token is valid
    request.get({
        'url': config.micropub.tokenEndpoint,
        'auth': {
            'bearer': req.headers.authorization.split(" ").pop("Bearer ")
        },
        json: true
    }, (err, data) => {
        if (err != undefined) {
            console.log(`ERROR: ${err}`);
            res.status(400).send({error: "invalid_request"});
            return;
        }

        // If false ERROR
        if (data.statusCode != 200 || data.body.me != config.server) {
            res.status(401).send({error: "unauthorized"});
            return;
        }

        // Make sure the right scope is there
        if (data.body.scope.indexOf("create") == -1 && data.body.scope.indexOf("post") == -1) {
            res.status(401).send({error: "insufficient_scope"});
            return;
        }

        // Everything is fine lets do the actual work

        // Get file path with filename
        let filePath = req.file.path;
        let fileExt = mime.extension(req.file.mimetype);
        let fileName = `${req.file.filename}.${fileExt}`;

        // Rename file with correct extension
        fs.renameSync(filePath, `${filePath}.${fileExt}`);

        // Send Response
        res.location(`${config.server}/media/${fileName}`).status(201).send("ok");
    });

}