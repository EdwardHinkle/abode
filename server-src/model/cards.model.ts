import * as fs from 'fs';
import {Card} from "./card.model";
import {DataController} from "./data.controller";
import {UrlUtility} from "../utilities/url.utility";


const cardsDirectory = `${__dirname}/../../jekyll/_source/_note/contacts`;

export class Cards {

    static findCardByNickname(nickname: string, cards: Card[]): Card {
        let matchingCards = cards.filter(card => card.properties.nickname[0] === nickname);
        if (matchingCards.length > 0) {
            return matchingCards[0];
        }
        return undefined;
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
                cards.push(Card.loadCard(cardFile));
            });

            Promise.all(cards).then(cards => resolve(cards));
        });
    }

    public static getAllContacts(logSql: boolean = false): Promise<Card[]> {
        return this.getContacts();

        // let cards: Card[] = [];
        // Select the post ids we need to fetch the actual file
        // let sql = `SELECT name, COUNT(posts_tags.tag_name) as tagCount FROM tags JOIN posts_tags ON tags.name = posts_tags.tag_name GROUP BY posts_tags.tag_name ORDER BY tagCount DESC`;

        // if (logSql) {
        //     console.log('searching sql');
        //     console.log(sql);
        // }

        // return new Promise((resolve, reject) => {
        //     DataController.db.serialize(() => {
        //         DataController.db.each(sql,
        //             (error, row) => {
        //                 if (error) {
        //                     console.log('ERROR!');
        //                     console.log(error);
        //                 }
        //
        //                 categories.push(new Category(row.name));
        //             }, (error, count) => {
        //                 resolve(categories);
        //             });
        //     });
        // });
    }


    // public static search(searchInfo: SearchCardInfo, logSql: boolean = false): Promise<Card[]> {
    //     let categories: Category[] = [];
    //     // Select the post ids we need to fetch the actual file
    //     let sql = `SELECT name, COUNT(posts_tags.tag_name) as tagCount FROM tags JOIN posts_tags ON tags.name = posts_tags.tag_name WHERE tags.name LIKE "%${searchInfo.tag_name}%" GROUP BY posts_tags.tag_name ORDER BY tagCount DESC`;
    //
    //     if (logSql) {
    //         console.log('searching sql');
    //         console.log(sql);
    //     }
    //
    //     return new Promise((resolve, reject) => {
    //         DataController.db.serialize(() => {
    //             DataController.db.each(sql,
    //                 (error, row) => {
    //                     if (error) {
    //                         console.log('ERROR!');
    //                         console.log(error);
    //                     }
    //
    //                     categories.push(new Category(row.name));
    //                 }, (error, count) => {
    //                     resolve(categories);
    //                 });
    //         });
    //     });
    // }

}

export interface SearchCardInfo {
    all: string;
}