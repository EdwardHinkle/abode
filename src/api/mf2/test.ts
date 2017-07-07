import * as mfTypes from './types';

let type1 = mfTypes.getPostType({
    properties: {
        name: "Test",
        content: "Testing"
    }
});

console.log(`Type is: ${type1}`);

let type2 = mfTypes.getPostType({
    properties: {
        name: "Test",
        content: "Testing",
        photo: true
    }
});

console.log(`Type is: ${type2}`);

let type3 = mfTypes.getPostType({
    properties: {
        name: "Test",
        content: "Testing",
        rsvp: true
    }
});

console.log(`Type is: ${type3}`);

let type4 = mfTypes.getPostType({
    properties: {
        name: "Test",
        content: "Testing",
        'like-of': true
    }
});

console.log(`Type is: ${type4}`);

let type5 = mfTypes.getPostType({
    properties: {
        name: "Test",
        content: "Testing",
        'repost-of': true
    }
});

console.log(`Type is: ${type5}`);

let type6 = mfTypes.getPostType({
    properties: {
        name: "Test",
        content: "Testing",
        'in-reply-to': true
    }
});

console.log(`Type is: ${type6}`);

let type7 = mfTypes.getPostType({
    properties: {
        name: "Article",
        content: "Testing"
    }
});

console.log(`Type is: ${type7}`);