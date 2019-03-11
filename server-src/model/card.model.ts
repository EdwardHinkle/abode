import {UrlUtility} from "../utilities/url.utility";
import {MicropubCard} from "./micropub-card.model";
import * as fs from "fs";
import * as path from "path";

const cardsDirectory = `${__dirname}/../../jekyll/_source/_note/contacts`;

export class Card {

    type: 'h-card';
    properties: CardPropertiesInterface;

    constructor(cardData?: CardInterface) {
        if (cardData != undefined) {
            this.type = cardData.type;
            this.properties = {
                name: cardData.properties.name,
                nickname: cardData.properties.nickname,
                uid: cardData.properties.uid ? cardData.properties.uid : cardData.properties.url[0],
                url: cardData.properties.url,
                category: cardData.properties.category,
                photo: cardData.properties.photo,
                org: cardData.properties.org,
                'abode-inactive': cardData.properties['abode-inactive'] ? cardData.properties['abode-inactive'] : false
            }
        }

    }

    getName() {
        return this.properties.name[0];
    }

    getRepresentitiveUrl() {
        return this.properties.uid[0];
    }

    getOfficialPermalink() {
        return `https://eddiehinkle.com/contact/${UrlUtility.getCleanUrl(this.getRepresentitiveUrl())}/`;
    }

    isActive() {
        return this.properties['abode-inactive'] !== undefined ? this.properties['abode-inactive'] : true;
    }

    static saveCard(card: Card) {
        try {
            fs.writeFileSync(`${cardsDirectory}/${UrlUtility.getCleanUrl(card.getRepresentitiveUrl())}.json`,
                JSON.stringify({
                    type: card.type,
                    properties: card.properties
                }), { encoding: 'utf8'});
        } catch (error) {
            console.log('Error trying to save card: ' + card.getRepresentitiveUrl());
            console.log(error);
        }

    }

    static loadCard(cardUid: string): Promise<Card> {
        return new Promise((resolve, reject) => {
            try {
                let cardData = JSON.parse(fs.readFileSync(`${cardsDirectory}/${UrlUtility.getCleanUrl(cardUid)}.json`, 'utf8'));
                resolve(new Card(cardData));
            } catch (error) {
                console.log('Error trying to parse card: ' + cardUid);
                console.log(error);
                resolve(undefined);
            }
        });
    }

}

export interface CardInterface {
    type: 'h-card';
    properties: CardPropertiesInterface;
}


export class CardPropertiesInterface {
    name: string;
    nickname: string;
    uid?: string;
    url: string[];
    category: string;
    photo?: string[];
    org?: CardInterface[];
    'abode-inactive'?: boolean;
}