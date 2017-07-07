import * as goodreads from 'goodreads';
import * as fs from 'fs';
import * as path from 'path';
import * as Promise from 'bluebird';
import * as _ from 'lodash';
import { Goodreads } from 'bookmark';

var config = require('../../abodeConfig.json');

var gr = new Goodreads({ key: config.goodreads.key, secret: config.goodreads.secret });
var username = "eddiehinkle";

export function getGoodreadsData(): Promise<any> {

    return Promise.all([
        getCurrentlyReadingBooks(),
        getRecentlyReadBooks()
    ]).spread((currently_reading: any, recently_read: any) => {
        
        return Promise.all([
            processCurrentlyReadingBooks(currently_reading),
            processRecentlyReadBooks(recently_read)
        ]);

    });

        // gr.getSingleShelf({
        //     v: 2,
        //     id: 22018436,
        //     shelf: 'read',
        //     page: 1,
        //     per_page: 100,
        //     sort: 'date_read'
        // }).then((recentlyRead) => {
        //     fs.writeFile(__dirname + '/../_source/_data/reading_info.json', readingInfo, 'utf8', function(error){
        //         if (error != undefined) {
        //             console.error("OOPS!", error);
        //         }
        //         console.log("Reading Info Retrieved");
        //     });
        // });

        // gr.getSingleShelf({
        //     v: 2,
        //     id: 22018436,
        //     shelf: 'read',
        //     page: 1,
        //     per_page: 100,
        //     sort: 'date_read'
        // }).then((recentlyRead) => {
        //     var readingInfo = {
        //         booksReadThisYear: 0
        //     }
        //     // _.each(recentlyRead.reviews[0].review, function(review){
        //         // var book = review.book;
        //         var book = recentlyRead.reviews[0].review[0].book;

        //         gr.getUserBookReview({
        //             user_id: config.goodreads.userid,
        //             book_id: Number(book[0].id)
        //         }).then((val) => {
        //             console.log(val);
        //         });

        //     // });

        //     // fs.writeFile(__dirname + '/../_source/_data/reading_info.json', readingInfo, 'utf8', function(error){
        //     //     if (error != undefined) {
        //     //         console.error("OOPS!", error);
        //     //     }
        //     //     console.log("Reading Info Retrieved");
        //     // });
        // });

        // gr.getSingleShelf({
        //     userID: config.goodreads.userid,
        //     shelf: 'currently-reading',
        //     page: 1,
        //     per_page: 100
        // }, function(currentlyReading){
        //     var json = JSON.stringify(currentlyReading.GoodreadsResponse.books[0].book);
        //     fs.writeFile(path.join(__dirname, '../../jekyll/_source/_data/currently_reading.json'), json, 'utf8', function(error){
        //         if (error != undefined) {
        //             console.error("OOPS!", error);
        //         }
        //         console.log("Currently Reading List Retrieved");
        //     });
        // });

        // gr.getSingleShelf({
        //     userID: config.goodreads.userid,
        //     shelf: 'read',
        //     page: 1,
        //     per_page: 4,
        //     sort: 'date_read'
        // }, function(recentlyRead){
        //     var json = JSON.stringify(recentlyRead.GoodreadsResponse.books[0].book);
        //     fs.writeFile(path.join(__dirname, '../../jekyll/_source/_data/recently_read.json'), json, 'utf8', function(error){
        //         if (error != undefined) {
        //             console.error("OOPS!", error);
        //         }
        //         console.log("Recently Read List Retrieved");
        //     });
        // });

}

export function getCurrentlyReadingBooks(): Promise<any> {
    return gr.getSingleShelf({
        v: 2,
        page: 1,
        per_page: 100,
        id: config.goodreads.userid,
        shelf: 'currently-reading'
    });
}

export function processCurrentlyReadingBooks(currently_reading): Promise<any> {
    return new Promise((resolve, reject) => {
        var currently_reading_books = _.map(currently_reading.reviews[0].review, (review: any) => {
            return review.book[0];
        });

        var json = JSON.stringify(currently_reading_books);
        fs.writeFile(path.join(__dirname, '../../jekyll/_source/_data/currently_reading.json'), json, 'utf8', function(error){
            if (error != undefined) {
                reject(error);
            }
            console.log("Currently Reading List Retrieved");
            resolve();
        });
    });
}

export function getRecentlyReadBooks(): Promise<any> {
    return gr.getSingleShelf({
        v: 2,
        page: 1,
        per_page: 4,
        sort: 'date_read',
        shelf: 'read',
        id: config.goodreads.userid
    })
}

export function processRecentlyReadBooks(recently_read): Promise<any> {
    return new Promise((resolve, reject) => {
        var recently_read_books = _.map(recently_read.reviews[0].review, (review: any) => {
            return review.book[0];
        });

        var json = JSON.stringify(recently_read_books);
        fs.writeFile(path.join(__dirname, '../../jekyll/_source/_data/recently_read.json'), json, 'utf8', function(error){
            if (error != undefined) {
                reject(error);
            }
            console.log("Recently Read List Retrieved");
            resolve();
        });
    });
}

// Get Book Status

// Query this url
//https://www.goodreads.com/user/show/(USERID).xml?key=(KEY)
// parse <user>
// parse <user_statuses>
// parse <user_status> each of these status are the current progress of the current book. 