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
                "href": "https://eddiehinkle.com/activitypub"
            }
        ]
    });
});

activityPubRouter.get('/activitypub', (req, res) => {
    let config: any = req.app.get('config');

    if (req.accepts('json')) {
        res.json({
            "@context": [
                "https://www.w3.org/ns/activitystreams",
                "https://w3id.org/security/v1"
            ],

            "id": "https://eddiehinkle.com/activitypub",
            "type": "Person",
            "preferredUsername": "eddiehinkle",
            "inbox": "https://eddiehinkle.com/activitypub/inbox",
            "name": "Eddie Hinkle",
            "summary": "Eddie Hinkle is a husband to Ashley, father to Luke and UI Engineer that lives in Frederick, MD.",
            "icon": {
                "type": "Image",
                "mediaType": "image/jpeg",
                "url": "https://eddiehinkle.com/images/profile.jpg"
            },

            "publicKey": {
                "id": "https://eddiehinkle.com/activitypub#main-key",
                "owner": "https://eddiehinkle.com/activitypub",
                "publicKeyPem": config.activitypub.pem
            }
        });
    }
});