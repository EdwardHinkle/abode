import * as request from 'request';
import * as _ from 'lodash';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

import { Person, PersonYamlData } from './person';

let peopleDataFile = `${__dirname}/../../config/people.yaml`;

export class People {

    collection = [] as [Person];

    constructor(peopleData: [PersonYamlData]) {
        if (peopleData != undefined) {
            for (let personData of peopleData) {
                this.collection.push(new Person(personData));
            }
        }

    }

    getPersonBy(filter: (person: Person) => boolean) {
        let foundPeople = this.collection.filter(filter);
        return foundPeople[0];
    }

    getPersonByNickname(nickname: String) {
        return this.getPersonBy((person) => {
            return person.nickname.toLowerCase() == nickname.toLowerCase();
        });
    }

    getPersonByFirstName(firstName: String) {
        return this.getPersonBy((person) => {
            return person.firstName == firstName;
        });
    }

    getPersonByLastName(lastName: String) {
        return this.getPersonBy((person) => {
            return person.lastName == lastName;
        });
    }

    getPersonByUrl(url: String) {
        return this.getPersonBy((person) => {
            // At some point this should actually be expanded to look at ALL url fields
            return (person.url == url || person[person.representitiveUrl] == url);
        });
    }

    static getPeople(): Promise<People> {
        return new Promise((resolve, reject) => {
            
            let originalData = fs.readFileSync(peopleDataFile, 'utf8');
            var personData = yaml.safeLoad(originalData) as [PersonYamlData];

            let peopleData = [] as [PersonYamlData];
            _.forEach(personData, (person, key) => {
                peopleData.push(person);
            });
            
            resolve(new People(peopleData));
        });
    }

}

