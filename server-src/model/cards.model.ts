import * as fs from 'fs';
import {Card} from "./card.model";


const cardsDirectory = `${__dirname}/../../jekyll/_source/_note/contacts`;

export class Cards {

    static findCardByNickname(nickname: string, cards: Card[]): Card {
        let matchingCards = cards.filter(card => card.properties.nickname[0] === nickname);
        if (matchingCards.length > 0) {
            return matchingCards[0];
        }
        return undefined;
    }

    static getCardByUid(uid: string): Promise<Card> {
        return new Promise((resolve, reject) => {

            let cardFilename = uid.replace('https://', '')
                                  .replace('http://', '')
                                  .replace('.json', '')
                                  .replace(/\//g, '-')
                                  .replace(/\?/g, '-')
                                  .replace(/-$/, '');

            console.log('should read card file ', cardFilename);

            try {
                let cardData = JSON.parse(fs.readFileSync(`${cardsDirectory}/${cardFilename}.json`, 'utf8'));
                resolve(new Card(cardData));
            } catch (error) {
                console.log('Error trying to parse card: ' + uid);
                console.log(error);
                resolve(undefined);
            }
        });
    }

    static findCardByUrl(url: string, cards: Card[]): Card {
        let matchingCards = cards.filter(card => card.properties.url.indexOf(url));
        if (matchingCards.length > 0) {
            return matchingCards[0];
        }
        return undefined;
    }

    static getContacts(): Promise<Card[]> {
        return this.getCards().then(cards => cards.filter(card => card.properties.category.indexOf("contact") > -1));
    }

    static getVenues(): Promise<Card[]> {
        return this.getCards().then(cards => cards.filter(card => card.properties.category.indexOf("venue") > -1));
    }

    static getCards(): Promise<Card[]> {
        return new Promise((resolve, reject) => {
            let cards: Promise<Card>[] = [];

            let cardsDir = fs.readdirSync(cardsDirectory, { encoding: 'utf8' });
            cardsDir.forEach(cardFile => {
                cards.push(this.getCardByUid(cardFile));
            });

            Promise.all(cards).then(cards => resolve(cards));
        });
    }

}

