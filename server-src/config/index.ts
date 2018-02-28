import * as request from 'request';
import * as Promise from 'bluebird';
import * as _ from 'lodash';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

export function importPeopleData(): Promise<any> {
    
    return new Promise((resolve, reject) => {
    
        // console.log(`${__dirname}/../../jekyll/_source/_data/person_tag_by_url.json`);
        let originalData = fs.readFileSync(`${__dirname}/../../config/people.yaml`, 'utf8');
        var personData = yaml.safeLoad(originalData);

        let dataByName = JSON.stringify(personData);
        let personByUrl = {};
        _.forEach(personData, (person, key) => {
            let personUrl = person[person.representitiveUrl];
            personByUrl[personUrl] = person;
        });
        let dataByUrl = JSON.stringify(personByUrl);


        fs.writeFileSync(`${__dirname}/../../jekyll/_source/_data/person_tag_by_name.json`, dataByName, { encoding: 'utf8' });
        fs.writeFileSync(`${__dirname}/../../jekyll/_source/_data/person_tag_by_url.json`, dataByUrl, { encoding: 'utf8' });

        resolve();

    });
}