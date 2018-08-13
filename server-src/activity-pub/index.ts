import * as express from "express";

export let activityPubRouter = express.Router();

activityPubRouter.get('/.well-known/webfinger', (req, res) => {
    let config: any = req.get('config');

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
    let config: any = req.get('config');

    res.json({
        "@context": [
            "https://www.w3.org/ns/activitystreams",
            "https://w3id.org/security/v1"
        ],

        "id": "https://eddiehinkle.com/activitypub/actor",
        "type": "Person",
        "preferredUsername": "me",
        "inbox": "https://eddiehinkle.com/activitypub/inbox",

        "publicKey": {
            "id": "https://eddiehinkle.com/activitypub/actor#main-key",
            "owner": "https://eddiehinkle.com/activitypub/actor",
            "publicKeyPem": config.activitypub.pem
        }
    });
});