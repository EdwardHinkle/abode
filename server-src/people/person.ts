export type urlType = 'url' | 'facebook' | 'twitter';

export class Person {

    nickname: string;
    firstName: string;
    lastName: string;

    representitiveUrl: urlType;
    url?: string;
    facebook?: string;
    twitter?: string;

    constructor(personData: PersonYamlData) {
        if (personData != undefined) {
            this.nickname = personData.nickname ? personData.nickname : personData.firstName;
            this.firstName = personData.firstName;
            this.lastName = personData.lastName;
            this.representitiveUrl = personData.representitiveUrl;
            this.url = personData.url || undefined;
            this.facebook = personData.facebook || undefined;
            this.twitter = personData.twitter || undefined;
        }

    }

    getRepresentitiveUrl() {
        return this[this.representitiveUrl];
    }

}

export interface PersonYamlData {
    nickname: string;
    firstName: string;
    lastName: string;
    representitiveUrl: urlType;
    url?: string;
    facebook?: string;
    twitter?: string;
}