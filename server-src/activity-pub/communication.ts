import * as RSA from "node-rsa";
import * as requestPromise from "request-promise";
import {ActivityPubProfile} from "./activity-pub-profile.interface";
import {ActivityPubPost} from "./activity-pub-post.interface";
import * as moment from "moment";

const config = require('../../abodeConfig.json');

export class ActivityPubCommunication {

    public static signHeader(stringToSign: string) {
        const key = new RSA();
        key.importKey(config.activitypub['private-pem'], 'pkcs1-private-pem');
        return key.encryptPrivate(stringToSign, 'base64');
    }

    public static decryptHeader(stringToDecrypt: string) {
        const key = new RSA();
        key.importKey(config.activitypub['public-pem'], 'pkcs8-public-pem');
        return key.decryptPublic(stringToDecrypt, 'utf8');
    }

    public static getAuthorProfile(authorUrl: string): Promise<ActivityPubProfile> {
        return requestPromise.get(authorUrl, {
            headers: {
                accept: "application/activity+json"
            },
            json: true
        }).then((profile: ActivityPubProfile) => {

            if (profile['@context'].indexOf('https://www.w3.org/ns/activitystreams') > -1) {
                return profile;
            }

            return Promise.reject("No @context found");

        }).catch((error) => {
            return Promise.reject("Activity JSON wasn't returned");
        });
    }

    public static sendResponse(options: SendResponseOptions) {
        console.log("Attempting ActivtyPub on " + options.toUrl);

        return ActivityPubCommunication.getActivityPubPost(options.toUrl).then((postData) => {

            if (postData !== undefined) {
                console.log("Found ActivityPub post");
                console.log(postData);

                if (postData.attributedTo !== undefined) {
                    let authorUrl: string;
                    if (typeof postData.attributedTo === "string") {
                        authorUrl = postData.attributedTo;
                    }


                    this.getAuthorProfile(authorUrl).then((authorProfile) => {
                        console.log('Found user inbox', authorProfile.inbox);

                        // sending replies is a bit tricky because you need to also include a "Mention" in the tags array,
                        // and also you need to include the person's "preferredUsername" in the post text for mastodon to
                        // show it as a notification

                        var replyPost = {
                            "@context": "https://www.w3.org/ns/activitystreams",
                            "id": "https://eddiehinkle.com/2018/08/14/4/reply/",
                            "type": "Create",
                            "actor": "https://eddiehinkle.com/activitypub",
                            "object": {
                                "id": "https://eddiehinkle.com/2018/08/14/4/reply/",
                                "type": "Note",
                                "published": "2018-08-14T13:20:11-0500",
                                "attributedTo": "https://eddiehinkle.com/activitypub",
                                "inReplyTo": authorUrl,
                                "content": "<p>Test Tootback</p>",
                                "to": "https://www.w3.org/ns/activitystreams#Public"
                            }
                        };

                        let segments = authorProfile.inbox.split("/");
                        segments.shift();
                        segments.shift();
                        let host = segments.shift();
                        let path = segments.join("/");
                        let date = moment().format("ddd, DD MMM YYYY HH:mm:ss [GMT]");
                        let stringToSign = `(request-target): post ${path}\nhost: ${host}\ndate: ${date}`;
                        let headerSignature = this.signHeader(stringToSign);
                        console.log('signed signature');
                        console.log(headerSignature);
                        // let decryptedSignature = this.decryptHeader(headerSignature);
                        // console.log('decrypted signature');
                        // console.log(decryptedSignature);

                        return requestPromise.post(authorProfile.inbox, {
                            headers: {
                                'Host': host,
                                'Date': date,
                                'Signature': `keyId="https://eddiehinkle.com/activitypub#key",headers="(request-target): host date",signature="${headerSignature}"`
                            },
                            json: replyPost
                        }).then((data) => {

                            // if (profile['@context'].indexOf('https://www.w3.org/ns/activitystreams') > -1) {
                            //     return profile;
                            // }
                            //
                            // return Promise.reject("No @context found");

                            console.log("Reply Result");
                            console.log(data);

                        }).catch((error) => {
                            console.log(error.error);
                            return Promise.reject("Activity Wasn't accepted");
                        });

                    });
                }
            }

        });
    }

    public static getActivityPubPost(url: string): Promise<ActivityPubPost> {
        return requestPromise.get(url, {
            headers: {
                accept: "application/activity+json; profile=\"https://www.w3.org/ns/activitystreams\", application/ld+json; profile=\"https://www.w3.org/ns/activitystreams\""
            },
            json: true
        }).then((postData: ActivityPubPost) => {

            if (postData['@context'].indexOf('https://www.w3.org/ns/activitystreams') > -1) {
                return postData;
            }

            return Promise.reject("No @context found");

        }).catch((error) => {
            return Promise.reject("Activity JSON wasn't returned");
        });
    }

}

export interface SendResponseOptions {
    toUrl: string;
    fromUrl: string;
}