import * as fs from 'fs';
import { convertMicropubToJekyll } from './handle';

export function convertSavedJsonToMarkdown(req, res) {
    var filename = req.params.filename;
    fs.readFile(__dirname + "/../../../micropub-examples/" + filename + ".json", 'utf8', (err, data) => {
        if (err) throw err;
        
        var rehydratedData = JSON.parse(data);

        convertMicropubToJekyll(rehydratedData, req).then(function(convertResponse){
            console.log(convertResponse);
            res.send(convertResponse);
        });

    });
}