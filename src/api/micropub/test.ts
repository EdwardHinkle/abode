import * as fs from 'fs';
import { convertMicropubToJekyll } from './handle';

let args = process.argv.slice(2);

export function convertSavedJsonToMarkdown(filename) {
    fs.readFile(__dirname + "/../../../micropub-examples/" + filename, 'utf8', (err, data) => {
        if (err) throw err;
        
        var rehydratedData = JSON.parse(data);

        convertMicropubToJekyll(rehydratedData, {}).then(function(convertResponse){
            console.log(convertResponse);
        });

    });
}

convertSavedJsonToMarkdown(args[0]);