import * as express from "express";

export let activityPubRouter = express.Router();

activityPubRouter.get('/.well-known/webfinger', (req, res) => {
    let config: any = req.app.get('config');

    res.json({
        "subject": "acct:me@eddiehinkle.com",

        "links": [
            {
                "rel": "self",
                "type": "application/activity+json",
                "href": "https://eddiehinkle.com/activitypub/actor"
            }
        ]
    });
});

activityPubRouter.get('/activitypub/actor', (req, res) => {
    let config: any = req.app.get('config');

    res.json({
        "@context": [
            "https://www.w3.org/ns/activitystreams",
            "https://w3id.org/security/v1"
        ],

        "id": "https://eddiehinkle.com/activitypub/actor",
        "type": "Person",
        "preferredUsername": "eddiehinkle",
        "inbox": "https://eddiehinkle.com/activitypub/inbox",
        "name": "Eddie Hinkle",
        "summary": "Eddie Hinkle is a husband to Ashley, father to Luke and UI Engineer that lives in Frederick, MD.",
        "icon": [
            "https://eddiehinkle.com/images/profile.jpg"
        ],

        "publicKey": {
            "id": "https://eddiehinkle.com/activitypub/actor#main-key",
            "owner": "https://eddiehinkle.com/activitypub/actor",
            "publicKeyPem": config.activitypub.pem
        }
    });
});