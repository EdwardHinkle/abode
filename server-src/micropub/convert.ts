import * as fs from 'fs';
import { convertMicropubToJekyll } from './handle';

export function convertSavedJsonToMarkdown(req, res) {
    fs.readFile(__dirname + "/../../../micropub-examples/1492135312.json", 'utf8', (err, data) => {
        if (err) throw err;
        
        var rehydratedData = JSON.parse(data);

        convertMicropubToJekyll(rehydratedData, req).then(function(convertResponse){
            console.log(convertResponse);
            res.send(convertResponse);
        });

    });
}