import { ActivityPubCommunication } from "./communication";

// ActivityPubCommunication.sendResponse({
//     toUrl: "https://mastodon.social/@Gargron/100254678717223630",
//     fromUrl: ""
// });

ActivityPubCommunication.sendResponse({
    toUrl: "https://aaronparecki.com/2018/07/02/13/",
    fromUrl: "https://eddiehinkle.com/2018/08/14/4/reply/"
}).catch((error) => {
    console.log('error', error);
});

// ActivityPubCommunication.isActivityPub("https://eddiehinkle.com").then((isActivityPub) => {
//     console.log('is it activity pub?');
//     console.log(isActivityPub);
//     console.log('it shouldn\'t be');
// });