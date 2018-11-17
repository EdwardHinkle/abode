export class Card {

    type: 'h-card';
    properties: CardProperties;

    constructor(cardData: Card) {
        if (cardData != undefined) {
            this.type = cardData.type;
            this.properties = {
                name: cardData.properties.name,
                nickname: cardData.properties.nickname,
                uid: cardData.properties.uid ? cardData.properties.uid : cardData.properties.url[0],
                url: cardData.properties.url,
                category: cardData.properties.category,
                photo: cardData.properties.photo,
                'abode-inactive': cardData.properties['abode-inactive']
            }
        }

    }

    getRepresentitiveUrl() {
        return this.properties.uid[0];
    }

    isActive() {
        return this.properties['abode-inactive'] !== undefined ? this.properties['abode-inactive'] : true;
    }

}

export interface Card {
    type: 'h-card';
    properties: CardProperties;
}

export interface CardProperties {
    name: string;
    nickname: string;
    uid?: string;
    url: string[];
    category: string;
    photo?: string[];
    'abode-inactive'?: boolean;
}