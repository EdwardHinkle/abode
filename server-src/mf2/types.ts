

export type postType =
    'Code' |
    'Note' |
    'RSVP' |
    'Reply' |
    'Repost' |
    'Like' |
    'Video' |
    'Photo' |
    'Article' |
    'Event' |
    'Checkin' |
    'Bookmark' |
    'Audio' |
    'Invitation' |
    'Ate' |
    'Drank' |
    'Listen' |
    'Watch';

let typeInference = {
    "rsvp": 'RSVP',
    "in-reply-to": 'Reply',
    "repost-of": 'Repost',
    "like-of": 'Like',
    "checkin": 'Checkin',
    "ate": 'Ate',
    "drank": 'Drank',
    "video": 'Video',
    "photo": 'Photo',
    "audio": "Audio",
    'listen-of': 'Listen',
    'watch-of': 'Watch'
};

export type Visibility = 'public' | 'private';

export function getPostType(postObject): postType {
    
    if (postObject.type[0] === 'h-event') {
        return 'Event';
    }

    if (postObject.properties['abode-content-type'] && postObject.properties['abode-content-type'].indexOf('code/') > -1) {
        return 'Code';
    }

    for (let attribute in typeInference) {
        if (postObject.properties[attribute] != undefined) {
            return typeInference[attribute];
        }
    }

    if (postObject.files != undefined && postObject.files.photo != undefined && postObject.files.photo.length > 0) {
        return 'Photo';
    }

    // If name exists and it is not a prefix of the content, this is an article
    if (postObject.properties.name != undefined && postObject.properties.name != '' && postObject.properties.content.indexOf(postObject.properties.name) != 0) {
        return 'Article';
    }

    // Else it's a note
    return 'Note';
}