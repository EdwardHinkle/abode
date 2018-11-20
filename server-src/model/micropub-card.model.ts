export interface MicropubCard {
    type: 'h-card';
    properties: MicropubCardProperties
}

export interface MicropubCardProperties {
    name: string[];
    nickname: string[];
    url: string[];
    uid: string[];
    photo: string[];
    org: MicropubCard[];
}