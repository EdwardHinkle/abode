import {ActivityPubPublicKey} from "./activity-pub-public-key.interface";
import {ActivityPubImage} from "./activity-pub-image.interface";

export interface ActivityPubProfile {
    '@context': string[] | string;
    id: string;
    type: 'Person';
    preferredUsername: string;
    url: string;
    icon: ActivityPubImage;
    image: ActivityPubImage;
    inbox: string;
    outbox: string;
    publicKey: ActivityPubPublicKey;
}
